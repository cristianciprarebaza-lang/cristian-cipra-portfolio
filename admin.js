
let token = '', data = {};
const $ = s => document.querySelector(s);

async function api(path, opts = {}) {
  const r = await fetch('/.netlify/functions/' + path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'No se pudo completar la operación');
  return j;
}

$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  token = $('#password').value;
  try {
    data = await api('content');
    $('#login').hidden = true;
    $('#panel').hidden = false;
    fillForm();
  } catch (err) {
    $('#loginError').textContent = 'Contraseña incorrecta o servicio aún no configurado.';
    token = '';
  }
};

$('#logout').onclick = () => {
  token = '';
  $('#panel').hidden = true;
  $('#login').hidden = false;
  $('#password').value = '';
};

function fillForm() {
  const f = $('#editor');

  Object.entries(data.profile || {}).forEach(([k, v]) => {
    if (f.elements[k]) f.elements[k].value = v || '';
  });

  f.elements.tools.value = (data.tools || []).join(', ');
  f.elements.contactText.value = data.contactText || '';

  drawServices();
  drawProjects();
}

function drawServices() {
  $('#servicesEditor').innerHTML = (data.services || []).map((s, i) =>
    `<div class="service-row">
      <div class="row-head">
        <b>Servicio ${i + 1}</b>
        <button type="button" class="remove" data-remove-service="${i}">Eliminar</button>
      </div>
      <label>Nombre<input data-service-title="${i}" value="${attr(s.title)}"></label>
      <label>Descripción<textarea data-service-desc="${i}" rows="2">${esc(s.description)}</textarea></label>
    </div>`
  ).join('');
}

function drawProjects() {
  $('#projectsEditor').innerHTML = (data.projects || []).map((p, i) => {
    const images = Array.isArray(p.images) && p.images.length
      ? p.images
      : (p.image ? [p.image] : []);

    p.images = images;
    p.image = images[0] || '';

    return `<div class="project-row">
      <div class="row-head">
        <b>Proyecto ${i + 1}</b>
        <button type="button" class="remove" data-remove-project="${i}">Eliminar</button>
      </div>

      <div class="grid">
        <label>Título
          <input data-p="title" data-i="${i}" value="${attr(p.title)}">
        </label>
        <label>Categoría
          <input data-p="category" data-i="${i}" value="${attr(p.category)}">
        </label>
        <label>Año
          <input data-p="year" data-i="${i}" value="${attr(p.year)}">
        </label>
        <label>Enlace externo
          <input data-p="url" data-i="${i}" value="${attr(p.url)}" placeholder="Web, Behance, etc.">
        </label>
        <label>Enlace del video de TikTok
          <input data-p="tiktokUrl" data-i="${i}" value="${attr(p.tiktokUrl)}" placeholder="https://www.tiktok.com/@usuario/video/123">
        </label>
      </div>

      <label>Descripción
        <textarea data-p="description" data-i="${i}" rows="2">${esc(p.description)}</textarea>
      </label>

      <div class="gallery-editor">
        <h3>Galería del proyecto</h3>
        <p class="muted">Selecciona varias fotografías a la vez. La primera será la portada.</p>

        <label>Agregar fotografías
          <input type="file" accept="image/*" multiple data-upload-gallery="${i}">
        </label>

        <div class="gallery-items">
          ${images.map((url, j) => `
            <div class="gallery-item">
              <span>Imagen ${j + 1}</span>
              <input type="text" data-gallery-url="${i}" data-image-index="${j}" value="${attr(url)}">
              <button type="button" class="remove" data-remove-gallery="${i}:${j}">Eliminar</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function esc(v = '') {
  return String(v).replace(/[&<>]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;'
  }[c]));
}

function attr(v = '') {
  return String(v).replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

$('#addService').onclick = () => {
  data.services.push({
    title: 'Nuevo servicio',
    description: 'Describe brevemente este servicio.'
  });
  drawServices();
};

$('#addProject').onclick = () => {
  data.projects.push({
    id: 'proyecto-' + Date.now(),
    title: 'Nuevo proyecto',
    category: 'Diseño',
    year: String(new Date().getFullYear()),
    description: 'Describe el proyecto.',
    image: '',
    images: [],
    url: '',
    featured: true
  });
  drawProjects();
};

document.addEventListener('click', e => {
  const t = e.target;

  if (t.dataset.removeService !== undefined) {
    data.services.splice(+t.dataset.removeService, 1);
    drawServices();
  }

  if (t.dataset.removeProject !== undefined) {
    data.projects.splice(+t.dataset.removeProject, 1);
    drawProjects();
  }

  if (t.dataset.removeGallery !== undefined) {
    const [i, j] = t.dataset.removeGallery.split(':').map(Number);
    data.projects[i].images.splice(j, 1);
    data.projects[i].image = data.projects[i].images[0] || '';
    drawProjects();
  }
});

document.addEventListener('input', e => {
  const t = e.target;

  if (t.dataset.serviceTitle !== undefined) {
    data.services[+t.dataset.serviceTitle].title = t.value;
  }

  if (t.dataset.serviceDesc !== undefined) {
    data.services[+t.dataset.serviceDesc].description = t.value;
  }

  if (t.dataset.p) {
    data.projects[+t.dataset.i][t.dataset.p] = t.value;
  }

  if (t.dataset.galleryUrl !== undefined) {
    const i = +t.dataset.galleryUrl;
    const j = +t.dataset.imageIndex;
    data.projects[i].images[j] = t.value;

    if (j === 0) data.projects[i].image = t.value;
  }
});

async function upload(file) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen supera 5 MB. Optimízala antes de subirla.');
  }

  const fd = new FormData();
  fd.append('file', file);

  const r = await fetch('/.netlify/functions/media', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });

  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Error al subir imagen');

  return j.url;
}

document.addEventListener('change', async e => {
  const t = e.target;

  try {
    if (t.id === 'portraitFile' && t.files[0]) {
      $('#saveStatus').textContent = 'Subiendo foto...';
      const url = await upload(t.files[0]);
      $('#editor').elements.portrait.value = url;
      $('#saveStatus').textContent = 'Foto cargada. Guarda los cambios.';
    }

    if (t.dataset.uploadGallery !== undefined && t.files.length) {
      const i = +t.dataset.uploadGallery;
      const files = Array.from(t.files);

      $('#saveStatus').textContent = 'Subiendo fotografías...';

      if (!Array.isArray(data.projects[i].images)) {
        data.projects[i].images = data.projects[i].image
          ? [data.projects[i].image] : [];
      }

      for (const file of files) {
        const url = await upload(file);
        data.projects[i].images.push(url);
      }

      data.projects[i].image = data.projects[i].images[0] || '';

      drawProjects();
      $('#saveStatus').textContent =
        `${files.length} fotografía(s) cargadas. Guarda los cambios.`;
    }
  } catch (err) {
    $('#saveStatus').textContent = err.message;
  }
});

document.querySelectorAll('.tab').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('#tab-' + b.dataset.tab).classList.add('active');
  };
});

$('#editor').onsubmit = async e => {
  e.preventDefault();

  const f = e.currentTarget;

  for (const k of [
    'name', 'role', 'headline', 'intro', 'about',
    'email', 'phone', 'location', 'portrait',
    'cv', 'instagram', 'linkedin', 'behance'
  ]) {
    data.profile[k] = f.elements[k].value;
  }

  data.tools = f.elements.tools.value.split(',')
    .map(x => x.trim()).filter(Boolean);

  data.contactText = f.elements.contactText.value;

  data.projects.forEach(p => {
    p.image = p.images?.[0] || p.image || '';
  });

  $('#saveStatus').textContent = 'Guardando...';

  try {
    await api('content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    $('#saveStatus').textContent = 'Cambios guardados correctamente.';
  } catch (err) {
    $('#saveStatus').textContent = err.message;
  }
};
