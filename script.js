// Configuración cliente Supabase Frontend
const SUPABASE_URL = 'https://ltijkypogezylmoiqtzw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aWpreXBvZ2V6eWxtb2lxdHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDg5MjUsImV4cCI6MjEwNDU4NDkyNX0.k9hN--PilkP5s8yTeDzZ4RGUDgZrA3x3ICAAPa3zNzY';

// Evitamos colisión con window.supabase de la CDN
const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Estado global
let cart = [];
let isLoginMode = true;

// Elementos del DOM - Carrito
const cartModal = document.getElementById('cartModal');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalValue = document.getElementById('cartTotalValue');
const checkoutBtn = document.getElementById('checkoutBtn');
const bookingForm = document.getElementById('bookingForm');
const playDemoBtn = document.getElementById('playDemoBtn');

// Elementos del DOM - Autenticación
const authModal = document.getElementById('authModal');
const btnOpenAuth = document.getElementById('btnOpenAuth');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authTitle = document.getElementById('authTitle');
const btnAuthSubmit = document.getElementById('btnAuthSubmit');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authSwitchPrompt = document.getElementById('authSwitchPrompt');
const authErrorMsg = document.getElementById('authErrorMsg');
const authSuccessMsg = document.getElementById('authSuccessMsg');

// Funciones del Modal Auth
function openAuthModal() {
  if (!authModal) return;
  authModal.style.setProperty('display', 'flex', 'important');
  if (authErrorMsg) authErrorMsg.style.display = 'none';
  if (authSuccessMsg) authSuccessMsg.style.display = 'none';
}

function closeAuthModalWindow() {
  if (!authModal) return;
  authModal.style.setProperty('display', 'none', 'important');
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  if (authErrorMsg) authErrorMsg.style.display = 'none';
  if (authSuccessMsg) authSuccessMsg.style.display = 'none';

  if (isLoginMode) {
    if (authTitle) authTitle.innerText = 'Acceder a Mattematika';
    if (btnAuthSubmit) btnAuthSubmit.innerText = 'Iniciar Sesión';
    if (authSwitchPrompt) authSwitchPrompt.innerText = '¿No tienes cuenta?';
    if (authSwitchBtn) authSwitchBtn.innerText = 'Regístrate';
  } else {
    if (authTitle) authTitle.innerText = 'Crear Cuenta';
    if (btnAuthSubmit) btnAuthSubmit.innerText = 'Registrarse';
    if (authSwitchPrompt) authSwitchPrompt.innerText = '¿Ya tienes cuenta?';
    if (authSwitchBtn) authSwitchBtn.innerText = 'Inicia Sesión';
  }
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
  // Modal Auth
  if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal();
    });
  }

  if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthModalWindow();
    });
  }

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModalWindow();
    });
  }

  if (authSwitchBtn) {
    authSwitchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthMode();
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  // Carrito
  openCartBtn?.addEventListener('click', toggleCart);
  closeCartBtn?.addEventListener('click', toggleCart);
  cartModal?.addEventListener('click', (e) => {
    if (e.target === cartModal) toggleCart();
  });

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id') || 'curso-1';
      const title = btn.getAttribute('data-title');
      const price = parseFloat(btn.getAttribute('data-price'));
      addToCart(id, title, price);
    });
  });

  bookingForm?.addEventListener('submit', handleBooking);
  checkoutBtn?.addEventListener('click', proceedCheckout);
  playDemoBtn?.addEventListener('click', playLessonDemo);

  // Verificación de sesión en Supabase
  if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data?.session && btnOpenAuth) {
        btnOpenAuth.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Mi Aula';
        btnOpenAuth.onclick = () => { window.location.href = '/aula-virtual.html'; };
      }
    }).catch(err => console.log('Sin sesión previa:', err));
  }
});

// Manejo Submit Auth
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (authErrorMsg) authErrorMsg.style.display = 'none';
  if (authSuccessMsg) authSuccessMsg.style.display = 'none';
  btnAuthSubmit.disabled = true;

  try {
    if (!supabaseClient) {
      throw new Error('Supabase no cargó correctamente.');
    }

    if (isLoginMode) {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = '/aula-virtual.html';
    } else {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;

      if (data?.session) {
        window.location.href = '/aula-virtual.html';
      } else {
        authSuccessMsg.innerText = '¡Cuenta creada! Ya puedes iniciar sesión.';
        authSuccessMsg.style.display = 'block';
        toggleAuthMode();
      }
    }
  } catch (err) {
    if (authErrorMsg) {
      authErrorMsg.innerText = err.message || 'Error al autenticar.';
      authErrorMsg.style.display = 'block';
    }
  } finally {
    btnAuthSubmit.disabled = false;
  }
}

// Funciones del Carrito
function toggleCart() {
  const isVisible = cartModal.style.display === 'flex';
  cartModal.style.display = isVisible ? 'none' : 'flex';
}

function addToCart(id, title, price) {
  cart.push({ id, title, price });
  updateCartUI();
  toggleCart();
}

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCartUI();
};

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

async function proceedCheckout() {
  if (cart.length === 0) {
    alert('Agrega al menos un curso o clase antes de pagar.');
    return;
  }

  const originalText = checkoutBtn.innerHTML;
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando cobro...';
  checkoutBtn.disabled = true;

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });

    const data = await response.json();

    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      alert('No se pudo generar el enlace de pago.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión con el servidor.');
  } finally {
    checkoutBtn.innerHTML = originalText;
    checkoutBtn.disabled = false;
  }
}

function handleBooking(e) {
  e.preventDefault();
  addToCart('clase-1a1', 'Clase Particular 1 a 1 (60 min)', 25);
  bookingForm.reset();
}

function playLessonDemo() {
  alert("Reproduciendo lección demo: 'Propiedades de las Operaciones'");
}