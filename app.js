
const fallback = null;
let currentContent;
const $ = s => document.querySelector(s);

async function loadContent() {
  try {
    const r = await fetch('/.netlify/functions/content', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    currentContent = await r.json();
  } catch (e) {
    const r = await fetch('/content.json');
    currentContent = await r.json();
  }
  render(currentContent);
}

function render(c) {
  const p = c.profile || {};
  $('#role').textContent = p.role || 'DISEÑO GRÁFICO · MARKETING · AUDIOVISUAL';
  $('#headline').innerHTML = p.headline || 'Ideas que conectan.<br><em>Diseño que comunica.</em>';
  $('#intro').textContent = p.intro || '';
  $('#about').textContent = p.about || '';
  $('#contactText').textContent = c.contactText || '';
  $('#year').textContent = new Date().getFullYear();

  const portrait = $('#portrait');
  const placeholder = $('#portraitPlaceholder');

  if (p.portrait) {
    portrait.src = p.portrait;
    portrait.hidden = false;
    placeholder.hidden = true;
  } else {
    portrait.hidden = true;
    placeholder.hidden = false;
  }

  $('#emailLink').href = 'mailto:' + (p.email || '');
  $('#phoneLink').href = p.phone
    ? 'https://wa.me/' + p.phone.replace(/\D/g, '')
    : '#';

  $('#socials').innerHTML = [
    ['Instagram', p.instagram],
    ['LinkedIn', p.linkedin],
    ['Behance', p.behance]
  ].filter(x => x[1]).map(x =>
    `<a href="${safeUrl(x[1])}" target="_blank" rel="noopener">${x[0]} ↗</a>`
  ).join('');

  $('#services').innerHTML = (c.services || []).map((s, i) =>
    `<article class="service">
      <span class="service-number">0${i + 1} /</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.description)}</p>
    </article>`
  ).join('');

  $('#tools').innerHTML = (c.tools || []).map(t =>
    `<span>${esc(t)}</span>`
  ).join('');

  const categories = ['Todos', ...new Set(
    (c.projects || []).map(x => x.category).filter(Boolean)
  )];

  $('#filters').innerHTML = categories.map((v, i) =>
    `<button class="filter ${i === 0 ? 'active' : ''}" data-filter="${esc(v)}">${esc(v)}</button>`
  ).join('');

  $('#filters').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      $('#filters').querySelectorAll('button').forEach(x =>
        x.classList.remove('active')
      );
      b.classList.add('active');
      renderProjects(c.projects || [], b.dataset.filter);
    });
  });

  renderProjects(c.projects || [], 'Todos');
}

function getTikTokVideoId(url = '') {
  try {
    const u = new URL(url);
    if (!/(^|\.)tiktok\.com$/i.test(u.hostname)) return '';
    const match = u.pathname.match(/\/video\/(\d+)/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

function renderProjects(items, filter) {
  const list = filter === 'Todos'
    ? items
    : items.filter(x => x.category === filter);

  $('#projects').innerHTML = list.map((p, i) => {
    const videoId = getTikTokVideoId(p.tiktokUrl || '');

    const images = Array.isArray(p.images) && p.images.length
      ? p.images.filter(Boolean)
      : (p.image ? [p.image] : []);

    let media;

    if (videoId) {
      media = `<div class="tiktok-player">
        <iframe src="https://www.tiktok.com/player/v1/${videoId}?controls=1&description=1&music_info=1"
          title="Video de TikTok: ${esc(p.title)}"
          loading="lazy"
          allow="fullscreen; encrypted-media; picture-in-picture"
          allowfullscreen></iframe>
      </div>`;
    } else if (images.length) {
      media = `<div class="project-gallery" data-gallery-index="${i}">
        <div class="project-image">
          <img data-gallery-image src="${safeUrl(images[0])}"
            alt="${esc(p.title)}" loading="lazy">
          ${images.length > 1 ? `
            <button class="gallery-arrow gallery-prev" data-gallery-prev aria-label="Imagen anterior">‹</button>
            <button class="gallery-arrow gallery-next" data-gallery-next aria-label="Imagen siguiente">›</button>
          ` : ''}
        </div>
        ${images.length > 1 ? `
          <div class="gallery-footer">
            <span class="gallery-count" data-gallery-count>01 / ${String(images.length).padStart(2, '0')}</span>
            <div class="gallery-dots">
              ${images.map((_, n) => `
                <button class="gallery-dot ${n === 0 ? 'active' : ''}"
                  data-gallery-dot="${n}" aria-label="Ver imagen ${n + 1}"></button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>`;
    } else {
      media = `<div class="project-image">
        <span class="image-placeholder">0${i + 1}</span>
      </div>`;
    }

    return `<article class="project-card">
      ${media}
      <div class="project-meta">
        <span>${esc(p.category || 'PROYECTO')}</span>
        <span>${esc(p.year || '')}</span>
      </div>
      <h3 class="project-title">${esc(p.title)}</h3>
      <p class="project-desc">${esc(p.description || '')}</p>
      ${p.url ? `<p class="project-desc"><a href="${safeUrl(p.url)}" target="_blank" rel="noopener">Ver proyecto ↗</a></p>` : ''}
      ${p.tiktokUrl && !videoId ? `<p class="project-desc">Enlace de TikTok no reconocido.</p>` : ''}
    </article>`;
  }).join('');

  document.querySelectorAll('.project-gallery').forEach(g => {
    const index = Number(g.dataset.galleryIndex);
    const images = Array.isArray(list[index].images) && list[index].images.length
      ? list[index].images.filter(Boolean)
      : [list[index].image].filter(Boolean);

    if (!images.length) return;

    let current = 0;
    const img = g.querySelector('[data-gallery-image]');
    const count = g.querySelector('[data-gallery-count]');
    const dots = g.querySelectorAll('[data-gallery-dot]');

    function showSlide(n) {
      current = (n + images.length) % images.length;
      img.src = safeUrl(images[current]);

      if (count) {
        count.textContent =
          `${String(current + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
      }

      dots.forEach((dot, j) =>
        dot.classList.toggle('active', j === current)
      );
    }

    g.querySelector('[data-gallery-prev]')?.addEventListener('click', () =>
      showSlide(current - 1)
    );

    g.querySelector('[data-gallery-next]')?.addEventListener('click', () =>
      showSlide(current + 1)
    );

    dots.forEach(dot => {
      dot.addEventListener('click', () =>
        showSlide(Number(dot.dataset.galleryDot))
      );
    });

    img.addEventListener('click', () => {
      $('#lightboxImage').src = safeUrl(images[current]);
      $('#lightbox').classList.add('open');
    });
  });
}

function esc(v = '') {
  return String(v).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[c]));
}

function safeUrl(v = '') {
  return /^https?:\/\//i.test(v) ||
    v.startsWith('/.netlify/functions/media?')
    ? esc(v) : '#';
}

$('#lightboxClose').onclick = () =>
  $('#lightbox').classList.remove('open');

$('#lightbox').onclick = e => {
  if (e.target.id === 'lightbox') {
    $('#lightbox').classList.remove('open');
  }
};

$('.menu-btn').onclick = () => $('nav').classList.toggle('open');

document.querySelectorAll('nav a').forEach(a =>
  a.onclick = () => $('nav').classList.remove('open')
);

loadContent();
