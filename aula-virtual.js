const SUPABASE_URL = 'https://ltijkypogezylmoiqtzw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aWpreXBvZ2V6eWxtb2lxdHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDg5MjUsImV4cCI6MjEwNDU4NDkyNX0.k9hN--PilkP5s8yTeDzZ4RGUDgZrA3x3ICAAPa3zNzY';

// Evitamos colisión usando supabaseClient
const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const userEmailEl = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');
const loadingCourses = document.getElementById('loading-courses');
const coursesGrid = document.getElementById('courses-grid');
const noCourses = document.getElementById('no-courses');

// Catálogo de referencia de cursos
const cursosCatalogo = {
  'curso-1': {
    title: 'Propiedades de las Operaciones Matemáticas',
    desc: 'Asociativa, conmutativa y distributiva aplicadas sin fórmulas vacías.',
    lessons: '18 lecciones en video'
  },
  'curso-2': {
    title: 'Álgebra Práctica: De Cero a Ecuaciones',
    desc: 'Despejes, factorización y resolución de sistemas de ecuaciones lineales.',
    lessons: '32 lecciones en video'
  },
  'curso-3': {
    title: 'Preparación para Ingreso Universitario y Cálculo',
    desc: 'Límites, derivadas, integrales y exámenes prácticos resueltos.',
    lessons: '45 lecciones en video'
  },
  'clase-1a1': {
    title: 'Clase Particular 1 a 1',
    desc: 'Sesión personalizada de 60 minutos con pizarra interactiva.',
    lessons: 'Tutoría en Vivo'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!supabaseClient) {
    console.error('Supabase no cargó en el navegador.');
    return;
  }

  // 1. Validar sesión activa
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    // Redirigir al home si no hay login
    window.location.href = '/';
    return;
  }

  const user = session.user;
  if (userEmailEl) userEmailEl.innerText = user.email;

  // 2. Cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = '/';
    });
  }

  // 3. Consultar compras de este email
  try {
    const { data: compras, error } = await supabaseClient
      .from('compras')
      .select('*')
      .eq('payer_email', user.email);

    if (loadingCourses) loadingCourses.style.display = 'none';

    if (error || !compras || compras.length === 0) {
      if (noCourses) noCourses.style.display = 'block';
      return;
    }

    // Mostrar cursos adquiridos
    if (coursesGrid) {
      coursesGrid.style.display = 'grid';
      coursesGrid.innerHTML = compras.map(c => {
        const info = cursosCatalogo[c.item_id] || {
          title: c.item_title || 'Curso Mattematika',
          desc: 'Acceso completo al material y ejercicios prácticos.',
          lessons: 'Módulos activos'
        };

        return `
          <div style="background: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <span style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px;">Acceso Activo</span>
              <h3 style="margin: 8px 0; color: #0f172a; font-size: 1.15rem;">${info.title}</h3>
              <p style="color: #64748b; font-size: 0.9rem; line-height: 1.5; margin-bottom: 16px;">${info.desc}</p>
              <div style="font-size: 13px; color: #475569; font-weight: 500; margin-bottom: 20px;">
                <i class="fas fa-play-circle" style="color: #2563eb; margin-right: 6px;"></i> ${info.lessons}
              </div>
            </div>
            <a href="/curso.html?id=${c.item_id}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: center; display: block; box-sizing: border-box;">
              Continuar Aprendiendo
            </a>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Error cargando compras:', err);
    if (loadingCourses) loadingCourses.style.display = 'none';
    if (noCourses) noCourses.style.display = 'block';
  }
});