const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares base
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configuración Mercado Pago
const mpToken = (process.env.MP_ACCESS_TOKEN || 'APP_USR-783580970846462-090413-8294dc7e75978397d0e82605964497ab-2423317569').trim();
const mpClient = new MercadoPagoConfig({ accessToken: mpToken });

// Configuración Supabase REST
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://ltijkypogezylmoiqtzw.supabase.co').trim();
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aWpreXBvZ2V6eWxtb2lxdHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDg5MjUsImV4cCI6MjEwNDU4NDkyNX0.k9hN--PilkP5s8yTeDzZ4RGUDgZrA3x3ICAAPa3zNzY';

async function registrarCompraEnSupabase(datos) {
  const url = `${SUPABASE_URL}/rest/v1/compras`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(datos)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error insertando en Supabase REST:', errorText);
  }
}

// -----------------------------------------------------------------------------
// 1. ENDPOINTS MERCADO PAGO
// -----------------------------------------------------------------------------
app.post('/api/create-preference', async (req, res) => {
  try {
    const { items, payer_email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const TASA_CAMBIO_ARS = 1250;

    const preferenceItems = items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: 1,
      unit_price: Math.round(Number(item.price) * TASA_CAMBIO_ARS),
      currency_id: 'ARS'
    }));

    // Prevenir conflicto si el comprador usa el mismo correo titular de la cuenta MP
    const safePayerEmail = (payer_email && !payer_email.includes('zizu'))
      ? payer_email
      : 'comprador_demo@mattematika.com';

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          email: safePayerEmail
        },
        metadata: {
          payer_email: payer_email,
          item_ids: items.map(i => i.id).join(',')
        },
        back_urls: {
          success: `${req.headers.origin || 'http://localhost:3000'}/aula-virtual.html`,
          failure: `${req.headers.origin || 'http://localhost:3000'}/#cursos`,
          pending: `${req.headers.origin || 'http://localhost:3000'}/aula-virtual.html`
        }
      }
    });

    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error('--- DETALLE ERROR MERCADO PAGO ---');
    console.error(error.message || error);
    if (error.cause) console.error('Causa:', JSON.stringify(error.cause, null, 2));
    console.error('-----------------------------------');
    res.status(500).json({ error: 'Error al generar checkout de Mercado Pago' });
  }
});

// -----------------------------------------------------------------------------
// 2. ENDPOINTS PAYPAL
// -----------------------------------------------------------------------------
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderID, payerEmail, items } = req.body;

    if (!payerEmail || !items || items.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para procesar compra' });
    }

    console.log(`Procesando orden PayPal ${orderID} para ${payerEmail}`);

    for (const item of items) {
      await registrarCompraEnSupabase({
        payment_id: String(orderID),
        status: 'approved',
        monto: Number(item.price),
        payer_email: payerEmail.toLowerCase().trim(),
        item_id: item.id
      });
    }

    res.json({ status: 'COMPLETED', message: 'Cursos activados con éxito' });
  } catch (error) {
    console.error('Error capturando orden PayPal:', error);
    res.status(500).json({ error: 'Error registrando compra en base de datos' });
  }
});

// -----------------------------------------------------------------------------
// 3. WEBHOOK MERCADO PAGO
// -----------------------------------------------------------------------------
app.post('/api/webhook', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;

  try {
    if (topic === 'payment') {
      const paymentId = query.id || query['data.id'];
      console.log('Notificación de pago recibida ID:', paymentId);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error webhook:', error);
    res.sendStatus(500);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Mattematika activo en http://localhost:${PORT}`);
});