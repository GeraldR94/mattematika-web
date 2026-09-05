import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Mercado Pago con tu Access Token del .env
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint para crear la preferencia de pago desde el carrito
app.post('/api/create-preference', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito no contiene productos' });
    }

    // Mapear los cursos del carrito al formato que pide Mercado Pago
    const preferenceItems = items.map((item) => ({
      title: item.title,
      unit_price: Number(item.price),
      quantity: 1,
      currency_id: 'ARS' // Cambiar a la moneda de tu cuenta (ARS, USD, etc.)
    }));

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: preferenceItems,
        back_urls: {
          success: `http://localhost:${PORT}/?status=success`,
          failure: `http://localhost:${PORT}/?status=failure`,
          pending: `http://localhost:${PORT}/?status=pending`
        },
        auto_return: 'approved'
      }
    });

    // Devolvemos el enlace oficial de pago generado
    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error('Error al crear preferencia en Mercado Pago:', error);
    res.status(500).json({ error: 'Hubo un error al generar el cobro' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Mattematika activo' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});