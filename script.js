const gallery = document.getElementById('gallery');

/* ---------------- Helpers ---------------- */
const normalizeName = (name) =>
  name.trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(\s*copy( \d+)?)$/i, '')                 // strip " copy" / " copy 2"
      .replace(/\.(jpe?g|png|heic|mp4|mov)$/i, '');      // strip extension

const dedupe = (list) => {
  const seen = new Set();
  return list.filter(n => {
    const key = normalizeName(n);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Interleave two arrays A (photos) and B (videos)
const interleave = (a, b) => {
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push({ type: 'photo', name: a[i] });
    if (i < b.length) out.push({ type: 'video', name: b[i] });
  }
  return out;
};

/* -------------- Tile Builders -------------- */
function addItem(type, name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = type;

  if (type === 'photo') {
    const img = document.createElement('img');
    img.src = `assets/photos/${name}`;
    img.loading = 'lazy';
    img.onload = () => img.classList.add('loaded');           // make visible
    img.onclick = () => openLightbox(img.src, 'img');
    div.appendChild(img);
  } else {
    const vid = document.createElement('video');
    vid.src = `assets/videos/${name}`;
    const base = name.split('.').slice(0, -1).join('.');      // safe even with multiple dots
    vid.poster = `assets/videos/${base}.jpg`;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.autoplay = true;                                      // preview on both desktop & mobile
    vid.preload = 'metadata';
    vid.onloadeddata = () => vid.classList.add('loaded');     // make visible
    vid.onmouseenter = () => vid.play();
    vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };
    vid.onclick = () => openLightbox(vid.src, 'video');
    div.appendChild(vid);
  }

  gallery.appendChild(div);
}

/* ---------------- Lightbox ---------------- */
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

// Close lightbox (click X or backdrop)
document.getElementById('close').onclick = () => {
  const lb = document.getElementById('lightbox');
  const c  = document.getElementById('lightContent');
  const activeVid = c.querySelector('video');
  if (activeVid) { activeVid.pause(); activeVid.currentTime = 0; }
  lb.classList.add('hidden');
};
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') document.getElementById('close').click();
});

/* ---------------- Render ---------------- */
async function render(doShuffle = false) {
  gallery.innerHTML = '';

  const [photosRaw, videosRaw] = await Promise.all([
    fetch('photos.json').then(r => r.json()),
    fetch('videos.json').then(r => r.json())
  ]);

  // 1) de-dupe
  let photos = dedupe(photosRaw);
  let videos = dedupe(videosRaw);

  // 2) optional shuffle
  if (doShuffle) {
    shuffle(photos);
    shuffle(videos);
  }

  // 3) interleave to keep videos from clumping
  const mixed = interleave(photos, videos);

  // 4) render in that order
  mixed.forEach(({ type, name }) => addItem(type, name));
}

/* --------------- UI Wiring --------------- */
document.getElementById('shuffleBtn').onclick = () => render(true);
document.getElementById('topBtn').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
window.addEventListener('scroll', () => {
  document.getElementById('topBtn').style.display = (window.scrollY > 300) ? 'block' : 'none';
});

// Filters
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

/* ---------------- Go ---------------- */
render();
