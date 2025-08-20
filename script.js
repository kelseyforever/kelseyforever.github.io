const gallery = document.getElementById('gallery');

/* ---------- tiny helpers (safe, won’t break) ---------- */
const normalizeName = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(\s*copy( \d+)?)$/i, '')
    .replace(/\.(jpe?g|png|heic|mp4|mov)$/i, '');

const dedupe = (list) => {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter(n => {
    const key = normalizeName(n);
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const shuffle = (arr) => {
  if (!Array.isArray(arr)) return [];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

async function safeGetJSON(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`${url} ${r.status}`);
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch (e) {
    console.error("Failed to load", url, e);
    return [];
  }
}

/* ---------- tile builders ---------- */
function addPhoto(name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'photo';

  const img = document.createElement('img');
  img.src = `assets/photos/${name}`;
  img.loading = 'lazy';
  img.onload = () => img.classList.add('loaded');
  img.onclick = () => openLightbox(img.src, 'img');

  div.appendChild(img);
  gallery.appendChild(div);
}

function addVideo(name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'video';

  const base = String(name).split('.').slice(0, -1).join('.');
  const vid  = document.createElement('video');
  vid.src = `assets/videos/${name}`;
  vid.poster = `assets/videos/${base}.jpg`;
  vid.muted = true;
  vid.loop = true;
  vid.playsInline = true;
  vid.autoplay = true;          // preview
  vid.preload = 'metadata';
  vid.onloadeddata = () => vid.classList.add('loaded');
  vid.onmouseenter = () => vid.play();
  vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };
  vid.onclick = () => openLightbox(vid.src, 'video');

  div.appendChild(vid);
  gallery.appendChild(div);
}

/* ---------- lightbox ---------- */
function openLightbox(src, kind) {
  const lb = document.getElementById('lightbox');
  const c  = document.getElementById('lightContent');
  const dl = document.getElementById('download');
  lb.classList.remove('hidden');
  c.innerHTML = '';

  if (kind === 'img') {
    const i = document.createElement('img');
    i.src = src;
    c.appendChild(i);
    dl.href = src;
  } else {
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    c.appendChild(v);
    dl.href = src;
  }
}

document.getElementById('close').onclick = () => {
  const lb = document.getElementById('lightbox');
  const c  = document.getElementById('lightContent');
  const active = c.querySelector('video');
  if (active) { active.pause(); active.currentTime = 0; }
  lb.classList.add('hidden');
};
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') document.getElementById('close').click();
});

/* ---------- render (SAFE) ---------- */
async function render(doShuffle = false) {
  gallery.innerHTML = '';

  const [photosRaw, videosRaw] = await Promise.all([
    safeGetJSON('photos.json'),
    safeGetJSON('videos.json')
  ]);

  // light de-dupe (non-destructive)
  let photos = dedupe(photosRaw);
  let videos = dedupe(videosRaw);

  if (doShuffle) { shuffle(photos); shuffle(videos); }

  // SIMPLE: show photos first, then videos (stable + proven working)
  photos.forEach(addPhoto);
  videos.forEach(addVideo);
}

/* ---------- UI wiring ---------- */
document.getElementById('shuffleBtn').onclick = () => render(true);
document.getElementById('topBtn').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
window.addEventListener('scroll', () => {
  document.getElementById('topBtn').style.display = (window.scrollY > 300) ? 'block' : 'none';
});

document.querySelectorAll('.filters button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.type; // "all" | "photo" | "video"
    document.querySelectorAll('#gallery .item').forEach(it => {
      it.style.display = (t === 'all' || it.dataset.type === t) ? 'block' : 'none';
    });
  };
});

/* ---------- GO ---------- */
render();
