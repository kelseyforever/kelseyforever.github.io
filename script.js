document.addEventListener('DOMContentLoaded', () => {
  // --- paths (single source of truth)
  const PHOTO_DIR = 'assets/photos';
  const VIDEO_DIR = 'assets/videos';

  // --- dom
  const gallery      = document.getElementById('gallery');
  const lb           = document.getElementById('lightbox');
  const lbBox        = document.getElementById('lightContent');
  const lbClose      = document.getElementById('close');
  const dlLink       = document.getElementById('download');
  const openOriginal = document.getElementById('openOriginal');
  const topBtn       = document.getElementById('topBtn');
  const shuffleBtn   = document.getElementById('shuffleBtn');

  // --- helpers
  const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const normalize = f => f.trim().toLowerCase().replace(/\.(jpe?g|png|heic|mp4|mov)$/i,'');
  const dedupe = (arr) => {
    const seen = new Set();
    return arr.filter(n => { const k = normalize(n); if (seen.has(k)) return false; seen.add(k); return true; });
  };

  // --- item builders
  function addPhoto(name){
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = 'photo';

    const img = document.createElement('img');
    img.src = `${PHOTO_DIR}/${name}`;
    img.loading = 'lazy';
    img.addEventListener('load', () => div.classList.add('loaded'));
    img.onclick = () => openLightbox(`${PHOTO_DIR}/${name}`, 'img');

    div.appendChild(img);
    gallery.appendChild(div);
  }

  function addVideo(name){
  const base = name.replace(/\.\w+$/, ''); // keep original case
  const div  = document.createElement('div');
  div.className = 'item video';
  div.dataset.type = 'video';

  // Poster fallback img (always shows something)
  const posterUrl = `assets/videos/${base}.jpg`;
  const thumb = document.createElement('img');
  thumb.className = 'poster-fallback';
  thumb.src = posterUrl;
  thumb.alt = '';
  thumb.loading = 'lazy';
  div.appendChild(thumb);

  // The actual video
  const v = document.createElement('video');
  v.src = `assets/videos/${name}#t=0.01`; // tiny seek nudges a first frame
  v.poster = posterUrl;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'metadata';
  v.style.opacity = '0'; // fade in only when ready
  div.appendChild(v);

  // When video is actually usable, fade in and hide poster
  const markReady = () => {
    v.style.opacity = '1';
    div.classList.add('ready');
  };
  v.addEventListener('loadeddata', markReady, { once: true });
  v.addEventListener('canplay',     markReady, { once: true });

  // If video errors/stalls, keep the poster fallback visible
  v.addEventListener('error', () => {
    // leave poster showing; no further action
    console.warn('Video failed to load:', name);
  });

  // Desktop hover preview
  if (window.matchMedia('(pointer:fine)').matches) {
    v.addEventListener('mouseenter', () => v.play().catch(()=>{}));
    v.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
  } else {
    // Touch: first tap toggles preview, second opens lightbox
    let tapped = false;
    v.addEventListener('click', (e) => {
      if (!tapped) { tapped = true; v.play().catch(()=>{}); setTimeout(()=>tapped=false, 800); }
      else { openLightbox(`assets/videos/${name}`, 'video'); v.pause(); }
    });
  }

  // Click anywhere on the tile opens the lightbox on desktop
  v.addEventListener('click', () => openLightbox(`assets/videos/${name}`, 'video'));

  gallery.appendChild(div);
}

  // --- lightbox
  function openLightbox(src, kind, poster){
    lbBox.innerHTML = '';
    let node;
    if (kind === 'img') {
      node = document.createElement('img');
      node.src = src;
    } else {
      node = document.createElement('video');
      node.src = src;
      node.controls = true;
      node.autoplay = true;
      node.playsInline = true;
      if (poster) node.poster = poster;
    }
    lbBox.appendChild(node);

    if (dlLink)       dlLink.href = src;
    if (openOriginal) openOriginal.href = src;

    lb.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lbBox.querySelectorAll('video').forEach(v => v.pause());
    lb.classList.add('hidden');
    document.body.style.overflow = '';
    lbBox.innerHTML = '';
  }

  if (lbClose) lbClose.onclick = closeLightbox;
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  // --- ui controls
  shuffleBtn.onclick = () => {
    const items = Array.from(gallery.children);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      gallery.insertBefore(items[j], items[i]);
      [items[i], items[j]] = [items[j], items[i]];
    }
  };

  topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  window.addEventListener('scroll', () => {
    topBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
  });

  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.type;
      Array.from(gallery.children).forEach(it => {
        it.style.display = (t === 'all' || it.dataset.type === t) ? 'block' : 'none';
      });
    });
  });

  // --- render
  (async function render(){
    gallery.innerHTML = '';

    const photos = dedupe(await fetch('photos.json').then(r => r.json()));
    const videos = dedupe(await fetch('videos.json').then(r => r.json()));

    // interleave so videos aren't bottom-heavy
    const max = Math.max(photos.length, videos.length);
    for (let i = 0; i < max; i++) {
      if (i < photos.length) addPhoto(photos[i]);
      if (i < videos.length) addVideo(videos[i]);
    }

    console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${gallery.children.length} tiles`);
  })();
});
