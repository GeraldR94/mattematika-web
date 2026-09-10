import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración Mercado Pago
const mpToken = (process.env.MP_ACCESS_TOKEN || '').trim();
const mpClient = new MercadoPagoConfig({ accessToken: mpToken });

// Configuración Supabase protegida
const supabaseUrl = (process.env.SUPABASE_URL || 'https://ltijkypogezylmoiqtzw.supabase.co').trim();
const supabaseKey = (process.env.SUPABASE_ANON_KEY || '').trim();

let supabase = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket }
  });
  console.log('Cliente Supabase conectado exitosamente.');
} catch (err) {
  console.error('Error al instanciar Supabase:', err.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint: Crear Orden / Preferencia
app.post('/api/create-preference', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const preferenceItems = items.map((item) => ({
      id: item.id || 'curso-1',
      title: String(item.title),
      unit_price: Number(item.price) < 100 ? Number(item.price) * 1000 : Number(item.price),
      quantity: 1,
      currency_id: 'ARS'
    }));

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: preferenceItems,
        notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks`
      }
    });

    return res.json({ init_point: response.init_point });
  } catch (error) {
    console.error('Error al crear preferencia en MP:', error);
    return res.status(500).json({ error: 'Error interno en Mercado Pago' });
  }
});

// Endpoint: Webhook de Mercado Pago
app.post('/api/webhooks', async (req, res) => {
  const { type, data } = req.body;

  try {
    if (type === 'payment' || req.query.type === 'payment') {
      const paymentId = data?.id || req.query['data.id'];

      if (paymentId) {
        const paymentInstance = new Payment(mpClient);
        const payment = await paymentInstance.get({ id: paymentId });

        console.log(`Webhook: Pago recibido #${payment.id} [${payment.status}]`);

        if (payment.status === 'approved' && supabase) {
          const payerEmail = payment.payer?.email || 'alumno@mattematika.com';
          const monto = payment.transaction_amount;
          const itemId = payment.additional_info?.items?.[0]?.id || 'curso-1';

          await supabase
            .from('usuarios')
            .upsert({ email: payerEmail }, { onConflict: 'email' });

          const { error: errorCompra } = await supabase
            .from('compras')
            .insert({
              payment_id: String(payment.id),
              status: payment.status,
              monto: monto,
              payer_email: payerEmail,
              item_id: itemId
            });

          if (errorCompra) {
            console.error('Error Supabase:', errorCompra);
          } else {
            console.log(`Compra registrada para: ${payerEmail}`);
          }
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return res.sendStatus(500);
  }
});

// Endpoint de comprobación
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor Mattematika activo',
    supabaseConectado: !!supabase
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});