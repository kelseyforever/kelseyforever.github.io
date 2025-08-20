/* =======================
   Memorial Gallery Script
   ======================= */

const gallery = document.getElementById('gallery');

/* ---------- helpers ---------- */

// normalize names to dedupe things like "IMG_0001.JPG" vs "img_0001.jpg"
const normalizeName = (name) =>
  name.trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(\s*copy( \d+)?)$/i, '')
      .replace(/\.(jpe?g|png|heic|mp4|mov)$/i, '');

// dedupe by normalized basename
const dedupe = (list) => {
  const seen = new Set();
  return list.filter(n => {
    const key = normalizeName(n);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// in-place Fisher–Yates
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// merge photos/videos in a balanced way so videos aren't bottom-heavy
function interleaveBalanced(photos, videos) {
  const p = [...photos];
  const v = [...videos];
  shuffle(p); shuffle(v);

  const merged = [];
  const ratio = Math.max(1, Math.round(p.length / Math.max(1, v.length))); // ~3:1, 4:1, etc.

  let i = 0, j = 0;
  while (i < p.length || j < v.length) {
    for (let k = 0; k < ratio && i < p.length; k++) {
      merged.push({ type: 'photo', name: p[i++] });
    }
    if (j < v.length) merged.push({ type: 'video', name: v[j++] });
  }
  return merged;
}

// play() without console noise if immediately paused by browser
function safePlay(video) {
  const p = video.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

// one observer so tiles auto-preview while visible (helps mobile & desktop)
const previewObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) safePlay(target);
    else { target.pause(); target.currentTime = 0; }
  });
}, { threshold: 0.6 });

/* ---------- lightbox ---------- */

function openLightbox(src, kind) {
  const lb  = document.getElementById('lightbox');
  const box = document.getElementById('lightContent');
  const dl  = document.getElementById('download');

  // stop and clear previous
  box.querySelectorAll('video').forEach(v => v.pause());
  box.innerHTML = '';

  if (kind === 'img') {
    const img = document.createElement('img');
    img.src = src;
    box.appendChild(img);
    dl.href = src;
  } else {
    const vid = document.createElement('video');
    vid.src = src;
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    box.appendChild(vid);
    dl.href = src;
  }

  lb.classList.remove('hidden');
}

// close on X
document.getElementById('close').onclick = () => {
  const lb  = document.getElementById('lightbox');
  const box = document.getElementById('lightContent');
  box.querySelectorAll('video').forEach(v => v.pause());
  lb.classList.add('hidden');
};

// close when clicking backdrop (but not content)
document.getElementById('lightbox').addEventListener('click', (e) => {
  const wrapper = document.getElementById('lightContentWrapper');
  if (!wrapper.contains(e.target)) {
    document.getElementById('close').click();
  }
});

/* ---------- tile builders ---------- */

function addPhoto(name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'photo';

  const img = document.createElement('img');
  img.src = `assets/photos/${name}`;
  img.loading = 'lazy';
  img.addEventListener('load', () => div.classList.add('loaded'));
  img.addEventListener('click', () => openLightbox(img.src, 'img'));

  div.appendChild(img);
  gallery.appendChild(div);
}

function addVideo(name) {
  const base = name.replace(/\.\w+$/, '');

  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = 'video';

  const v = document.createElement('video');
  v.src = `assets/videos/${name}#t=0.01`;   // nudge first frame
  v.poster = `assets/videos/${base}.jpg`;   // jpg right next to file
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'metadata';

  v.addEventListener('loadeddata', () => div.classList.add('loaded'));

  // desktop hover preview
  v.addEventListener('mouseenter', () => safePlay(v));
  v.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });

  // auto-preview when visible (mobile & desktop)
  previewObserver.observe(v);

  // click → open lightbox
  v.addEventListener('click', () => openLightbox(`assets/videos/${name}`, 'video'));

  div.appendChild(v);
  gallery.appendChild(div);
}

/* ---------- rendering ---------- */

async function render(doShuffle = false) {
  gallery.innerHTML = '';

  const [photosRaw, videosRaw] = await Promise.all([
    fetch('photos.json').then(r => r.json()),
    fetch('videos.json').then(r => r.json())
  ]);

  // dedupe, optional shuffle (we still interleave to distribute)
  const photos = dedupe(photosRaw);
  const videos = dedupe(videosRaw);
  if (doShuffle) { shuffle(photos); shuffle(videos); }

  // interleave for better distribution
  const items = interleaveBalanced(photos, videos);

  // build tiles
  for (const it of items) {
    if (it.type === 'photo') addPhoto(it.name);
    else addVideo(it.name);
  }

  // stats for sanity
  console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${items.length} tiles`);
}

/* ---------- controls & filters ---------- */

// shuffle button
const shuffleBtn = document.getElementById('shuffleBtn');
if (shuffleBtn) shuffleBtn.onclick = () => render(true);

// top button (optional)
const topBtn = document.getElementById('topBtn');
if (topBtn) {
  topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.addEventListener('scroll', () => {
    topBtn.style.display = (window.scrollY > 300) ? 'block' : 'none';
  });
}

// filters (All / Photos / Videos)
document.querySelectorAll('.filters button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const type = btn.dataset.type; // 'all' | 'photo' | 'video'
    document.querySelectorAll('#gallery .item').forEach(el => {
      el.style.display = (type === 'all' || el.dataset.type === type) ? 'block' : 'none';
    });
  });
});

/* ---------- go ---------- */
render();
