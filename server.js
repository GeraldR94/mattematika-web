import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const accessToken = (process.env.MP_ACCESS_TOKEN || '').trim();

console.log('--- Verificación de Inicio ---');
console.log('Access Token detectado:', accessToken ? `${accessToken.substring(0, 15)}...` : 'NO CONFIGURADO');

const client = new MercadoPagoConfig({ 
  accessToken: accessToken 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/create-preference', async (req, res) => {
  console.log('>> Solicitud recibida en /api/create-preference');

  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // Mercado Pago Argentina requiere montos en ARS que superen el mínimo operativo
    const preferenceItems = items.map((item) => ({
      id: 'curso-' + Math.floor(Math.random() * 1000),
      title: String(item.title),
      unit_price: Number(item.price) < 100 ? Number(item.price) * 1000 : Number(item.price),
      quantity: 1,
      currency_id: 'ARS'
    }));

    console.log('Items enviados a MP:', preferenceItems);

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: preferenceItems
      }
    });

    console.log('Preferencia creada correctamente:', response.id);
    return res.json({ init_point: response.init_point });
  } catch (error) {
    console.error('--- FALLO DE MERCADO PAGO ---');
    console.error(JSON.stringify(error, null, 2));
    
    return res.status(500).json({ 
      error: 'Error al comunicarse con Mercado Pago',
      details: error.message || error
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Mattematika activo' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});