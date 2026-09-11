const SUPABASE_URL = 'https://ltijkypogezylmoiqtzw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aWpreXBvZ2V6eWxtb2lxdHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMDg5MjUsImV4cCI6MjEwNDU4NDkyNX0.k9hN--PilkP5s8yTeDzZ4RGUDgZrA3x3ICAAPa3zNzY';
const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

// Base de datos de lecciones demostrativas
const cursosContenido = {
  'curso-1': {
    title: 'Propiedades de las Operaciones Matemáticas',
    lessons: [
      {
        id: 1,
        title: '1. Introducción: ¿Por qué fallamos en operaciones básicas?',
        desc: 'Comprende el error conceptual detrás de memorizar reglas sin intuición espacial y aritmética.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Reemplazable con tus IDs reales
      },
      {
        id: 2,
        title: '2. Propiedad Conmutativa en la Suma y el Producto',
        desc: 'El orden de los factores no altera el producto: demostración geométrica en rectángulos y conjuntos.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      },
      {
        id: 3,
        title: '3. Propiedad Asociativa y agrupación rápida de cálculos',
        desc: 'Cómo ahorrar tiempo en exámenes agrupando términos para cálculo mental veloz.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      },
      {
        id: 4,
        title: '4. Propiedad Distributiva: La base del álgebra formal',
        desc: 'Dominando el producto respecto de la adición y preparando el terreno para factorizaciones complejas.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      }
    ]
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Validar sesión
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '/';
    return;
  }

  // 2. Obtener el ID del curso desde la URL (?id=curso-1)
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || 'curso-1';

  // 3. Validar si el usuario pagó por este curso
  const { data: compras } = await supabaseClient
    .from('compras')
    .select('*')
    .eq('payer_email', session.user.email)
    .eq('item_id', courseId);

  if (!compras || compras.length === 0) {
    alert('No tienes acceso autorizado a este curso.');
    window.location.href = '/aula-virtual.html';
    return;
  }

  // 4. Renderizar contenido
  const curso = cursosContenido[courseId] || cursosContenido['curso-1'];
  document.getElementById('course-title').innerText = curso.title;

  const lessonsContainer = document.getElementById('lessons-container');
  lessonsContainer.innerHTML = curso.lessons.map((lesson, index) => `
    <li class="lesson-item ${index === 0 ? 'active' : ''}" onclick="loadLesson('${courseId}', ${lesson.id})">
      <i class="fas fa-play-circle lesson-icon"></i>
      <span style="font-size: 13.5px; font-weight: 500;">${lesson.title}</span>
    </li>
  `).join('');

  // Cargar primera lección por defecto
  loadLesson(courseId, 1);
});

window.loadLesson = function(courseId, lessonId) {
  const curso = cursosContenido[courseId] || cursosContenido['curso-1'];
  const lesson = curso.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  document.getElementById('video-frame').src = lesson.videoUrl;
  document.getElementById('current-lesson-title').innerText = lesson.title;
  document.getElementById('current-lesson-desc').innerText = lesson.desc;

  // Actualizar clase activa en la lista
  const items = document.querySelectorAll('.lesson-item');
  items.forEach((item, idx) => {
    if (idx === (lessonId - 1)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
};