/* =======================
   Memorial Gallery Script
   ======================= */

(() => {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  /* ---------- helpers ---------- */

  // normalize names to dedupe things like "IMG_0001.JPG" vs "img_0001 (copy).jpg"
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

  // blend photos/videos so videos aren’t bottom-heavy
  function interleaveBalanced(photos, videos) {
    const p = [...photos];
    const v = [...videos];
    shuffle(p); shuffle(v);

    const merged = [];
    const ratio = Math.max(1, Math.round(p.length / Math.max(1, v.length))); // ~3:1, 4:1, etc.

    let i = 0, j = 0;
    while (i < p.length || j < v.length) {
      for (let k = 0; k < ratio && i < p.length; k++) merged.push({ type: 'photo', name: p[i++] });
      if (j < v.length) merged.push({ type: 'video', name: v[j++] });
    }
    return merged;
  }

  // play() without console noise if paused immediately
  function safePlay(video) {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  // shared observer so tiles auto-preview while visible (helps mobile & desktop)
  const previewObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) safePlay(target);
      else { target.pause(); target.currentTime = 0; }
    });
  }, { threshold: 0.6 });

  /* ---------- lightbox ---------- */

  function ensureLightbox(){
    let lb = document.getElementById('lightbox');
    if (lb) return lb;

    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'hidden';
    lb.innerHTML = `
      <div id="lightContentWrapper">
        <button id="close" aria-label="Close">&times;</button>
        <div id="lightContent"></div>
        <div class="lb-actions">
          <a id="download" class="lb-btn" download>Download</a>
          <a id="openOriginal" class="lb-btn" target="_blank" rel="noopener">Open original</a>
        </div>
      </div>`;
    document.body.appendChild(lb);

    // backdrop click closes
    lb.addEventListener('click', (e) => {
      const wrap = document.getElementById('lightContentWrapper');
      if (!wrap.contains(e.target)) closeLightbox();
    });
    // X closes
    lb.querySelector('#close').onclick = closeLightbox;
    // Esc closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    return lb;
  }

function closeLightbox(){
  const lb  = document.getElementById('lightbox');
  if (!lb) return;
  const box = document.getElementById('lightContent');
  // stop any playing video
  box.querySelectorAll('video').forEach(v => v.pause());
  lb.classList.add('hidden');
}

  function openLightbox(src, kind) {
    const lb  = ensureLightbox();
    const box = lb.querySelector('#lightContent');
    const dl  = lb.querySelector('#download');
    const open= lb.querySelector('#openOriginal');

    // stop & clear previous
    box.querySelectorAll('video').forEach(v => v.pause());
    box.innerHTML = '';

    if (kind === 'img') {
      const img = document.createElement('img');
      img.src = src;
      box.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      box.appendChild(vid);
    }

    if (dl) { dl.href = src; dl.setAttribute('download', ''); }
    if (open) open.href = src;

    lb.classList.remove('hidden');
  }

  /* ---------- tile builders ---------- */

  function addPhoto(name) {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = 'photo';

    const img = document.createElement('img');
    img.src = `assets/photos/${name}`;
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(img.src, 'img'));

    div.appendChild(img);
    gallery.appendChild(div);
  }

  function addVideo(name){
  const base = name.replace(/\.\w+$/, '');
  const div = document.createElement('div'); div.className='item'; div.dataset.type='video';
  const v   = document.createElement('video');

  v.src    = `assets/videos/${name}#t=0.01`;
  v.poster = `assets/videos/${base}.jpg`;
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';

  // 🔹 poster-as-background fallback so the tile never looks black
  const posterUrl = `assets/videos/${base}.jpg`;
  v.style.backgroundImage    = `url("${posterUrl}")`;
  v.style.backgroundSize     = 'cover';
  v.style.backgroundPosition = 'center';

  // desktop hover preview
  v.onmouseenter = () => v.play().catch(()=>{});
  v.onmouseleave = () => { v.pause(); v.currentTime = 0; };

  // mark visible once we have any frame
  v.onloadeddata = () => div.classList.add('loaded');

  // click => open lightbox (works on mobile/desktop)
  v.onclick = () => openLightbox(`assets/videos/${name}`, 'video');

  div.appendChild(v);
  gallery.appendChild(div);
}
  /* ---------- rendering ---------- */

  async function render(doShuffle = false) {
    gallery.innerHTML = '';

    const [photosRaw, videosRaw] = await Promise.all([
      fetch('photos.json').then(r => r.json()).catch(() => []),
      fetch('videos.json').then(r => r.json()).catch(() => [])
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

    // sanity
    console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${items.length} tiles`);
  }
// (re)bind click-outside, X button, and Esc-to-close even if the DOM was present before
(function wireLightbox(){
  const lb    = document.getElementById('lightbox');
  const wrap  = document.getElementById('lightContentWrapper');
  const close = document.getElementById('close');
  if (!lb || !wrap || !close) return;

  // click outside content
  lb.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeLightbox();
  });

  // X button
  close.addEventListener('click', closeLightbox);

  // Esc key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
})();
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
    }, { passive: true });
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
})();
