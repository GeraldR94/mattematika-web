// Estado global del carrito
let cart = [];

// Elementos del DOM
const cartModal = document.getElementById('cartModal');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalValue = document.getElementById('cartTotalValue');
const checkoutBtn = document.getElementById('checkoutBtn');
const bookingForm = document.getElementById('bookingForm');
const playDemoBtn = document.getElementById('playDemoBtn');

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
  // Abrir / Cerrar Carrito
  openCartBtn.addEventListener('click', toggleCart);
  closeCartBtn.addEventListener('click', toggleCart);

  // Cerrar al hacer clic en el fondo del modal
  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) toggleCart();
  });

  // Botones de añadir al carrito en tarjetas de cursos
  const addButtons = document.querySelectorAll('.add-to-cart');
  addButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title');
      const price = parseFloat(btn.getAttribute('data-price'));
      addToCart(title, price);
    });
  });

  // Formulario de reserva
  bookingForm.addEventListener('submit', handleBooking);

  // Botón de checkout
  checkoutBtn.addEventListener('click', proceedCheckout);

  // Video demo
  playDemoBtn.addEventListener('click', playLessonDemo);
});

// Alternar visibilidad del modal
function toggleCart() {
  const isVisible = cartModal.style.display === 'flex';
  cartModal.style.display = isVisible ? 'none' : 'flex';
}

// Agregar elemento al carrito
function addToCart(title, price) {
  cart.push({ title, price });
  updateCartUI();
  toggleCart();
}

// Eliminar elemento del carrito
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

// Actualizar interfaz del carrito
function updateCartUI() {
  cartCount.innerText = cart.length;

  if (cart.length === 0) {
    cartItemsList.innerHTML = '<p class="cart-empty-text">El carrito está vacío.</p>';
    cartTotalValue.innerText = '$0 USD';
    return;
  }

  let total = 0;
  cartItemsList.innerHTML = cart.map((item, index) => {
    total += item.price;
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">$${item.price} USD</div>
        </div>
        <button onclick="removeFromCart(${index})" class="cart-item-remove" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');

  cartTotalValue.innerText = `$${total} USD`;
}

// Finalizar compra (simulación de checkout)
async function proceedCheckout() {
  if (cart.length === 0) {
    alert('Agrega al menos un curso o clase antes de pagar.');
    return;
  }

  const btn = document.getElementById('checkoutBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando cobro...';
  btn.disabled = true;

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: cart })
    });

    const data = await response.json();

    if (data.init_point) {
      // Redirige al alumno a la pasarela segura de Mercado Pago
      window.location.href = data.init_point;
    } else {
      alert('No se pudo generar el enlace de pago. Revisa las credenciales en .env');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión con el servidor.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// Manejo de reserva 1 a 1
function handleBooking(e) {
  e.preventDefault();
  addToCart('Clase Particular 1 a 1 (60 min)', 25);
  bookingForm.reset();
}

// Reproducir video demo
function playLessonDemo() {
  alert("Reproduciendo lección demo de Mattematika: 'Propiedad Asociativa de la Multiplicación'");
}