// --- helpers ---------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const gallery = $('#gallery');
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// normalize names so "IMG_0001.JPG", "img_0001.jpg", "img_0001 (copy).jpg" de-dupe
const normalize = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\.(jpe?g|png|heic|mp4|mov)$/i, '')
    .replace(/\s*\(copy(?:\s*\d+)?\)|\s*copy(?:\s*\d+)?$/i, '')
    .replace(/\s+/g, ' ');

// de-dupe list by normalized base name
const dedupe = (list) => {
  const seen = new Set();
  return list.filter((n) => {
    const key = normalize(n);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Fisher–Yates
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// interleave so videos don’t clump at bottom
const interleave = (photos, videos) => {
  const items = [];
  const max = Math.max(photos.length, videos.length);
  for (let i = 0; i < max; i++) {
    if (photos[i]) items.push({ type: 'photo', name: photos[i] });
    if (videos[i]) items.push({ type: 'video', name: videos[i] });
  }
  return items;
};

// --- lightbox --------------------------------------------------------------
function ensureLightbox() {
  if ($('#lightbox')) return;
  const html = `
  <div id="lightbox" class="lb hidden">
    <div class="lb__inner">
      <button id="lbClose" class="lb__close" aria-label="Close">×</button>
      <div id="lbContent" class="lb__content"></div>
      <a id="lbDL" class="lb__dl" download>Download</a>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  $('#lbClose').onclick = () => $('#lightbox').classList.add('hidden');
  $('#lightbox').onclick = (e) => {
    if (e.target.id === 'lightbox') $('#lightbox').classList.add('hidden');
  };
}
function openLightbox(kind, src) {
  ensureLightbox();
  const lb = $('#lightbox');
  const box = $('#lbContent');
  const dl = $('#lbDL');
  box.innerHTML = '';
  if (kind === 'img') {
    const img = document.createElement('img');
    img.src = src;
    box.appendChild(img);
  } else {
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    box.appendChild(v);
  }
  dl.href = src;
  lb.classList.remove('hidden');
}

// --- tile builders ---------------------------------------------------------
function makePhoto(name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'photo';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = `assets/photos/${name}`;
  img.alt = name;
  img.onload = () => img.classList.add('loaded');
  img.onclick = () => openLightbox('img', img.src);

  div.appendChild(img);
  return div;
}

function makeVideo(name) {
  // base name for poster: foo.mp4 -> foo.jpg
  const base = name.replace(/\.[^/.]+$/, '');
  const src = `assets/videos/${name}`;
  const poster = `assets/videos/${base}.jpg`;

  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'video';

  // 1) ALWAYS show poster <img> (never black)
  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.loading = 'lazy';
  thumb.src = poster;
  thumb.alt = base;
  div.appendChild(thumb);

  // 2) create <video> only when needed (hover/click) to avoid iOS limits
  let videoEl = null;
  let ready = false;

  const ensureVideo = () => {
    if (videoEl) return videoEl;
    videoEl = document.createElement('video');
    videoEl.src = src;
    videoEl.muted = true;
    videoEl.loop = true;
    videoEl.playsInline = true;
    videoEl.preload = 'metadata';
    videoEl.style.display = 'none';
    // when the first frame is ready, swap in
    videoEl.addEventListener('canplay', () => {
      ready = true;
      thumb.style.display = 'none';
      videoEl.style.display = 'block';
    }, { once: true });
    div.appendChild(videoEl);
    return videoEl;
  };

  // Desktop hover preview
  if (!isMobile) {
    div.addEventListener('mouseenter', () => {
      const v = ensureVideo();
      const p = v.play();
      if (p && p.catch) p.catch(() => {}); // ignore aborted play
    });
    div.addEventListener('mouseleave', () => {
      if (!videoEl) return;
      videoEl.pause();
      videoEl.currentTime = 0;
      videoEl.style.display = 'none';
      thumb.style.display = 'block';
    });
  }

  // Click = open lightbox (both desktop & mobile)
  div.addEventListener('click', () => openLightbox('video', src));

  // Fallback: if poster fails, keep tile visible (use a neutral bg)
  thumb.onerror = () => { thumb.style.background = '#000'; };

  return div;
}

// --- render ----------------------------------------------------------------
async function render(shuffleAll = false) {
  gallery.innerHTML = '';

  // Load lists
  const [photosRaw, videosRaw] = await Promise.all([
    fetch('photos.json').then((r) => r.json()),
    fetch('videos.json').then((r) => r.json()),
  ]);

  // de-dupe by normalized base name
  const photos = dedupe(photosRaw);
  const videos = dedupe(videosRaw);

  // randomize each, then interleave so videos aren’t bottom-heavy
  shuffle(photos);
  shuffle(videos);
  const items = interleave(photos, videos);
  if (shuffleAll) shuffle(items);

  // build tiles
  for (const it of items) {
    const tile = it.type === 'photo' ? makePhoto(it.name) : makeVideo(it.name);
    gallery.appendChild(tile);
  }

  // console for sanity
  console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${items.length} tiles`);
}

// buttons / filters / init
document.getElementById('shuffleBtn')?.addEventListener('click', () => render(true));
document.getElementById('topBtn')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.querySelectorAll('.filters button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filters button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.type;
    document.querySelectorAll('#gallery .item').forEach((it) => {
      it.style.display = (t === 'all' || it.dataset.type === t) ? 'block' : 'none';
    });
  });
});

render();
