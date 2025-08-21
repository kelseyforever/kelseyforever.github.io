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
  const base = name.replace(/\.\w+$/, '');
  const div  = document.createElement('div');
  div.className = 'item video';

  // poster overlay (sits visually on top but now pointer-events:none)
  const poster = document.createElement('img');
  poster.className = 'poster-fallback';
  poster.src = `${VIDEO_DIR}/${base}.jpg`;
  div.appendChild(poster);

  // the video element
  const v = document.createElement('video');
  v.src = `${VIDEO_DIR}/${name}#t=0.01`;      // nudge off black first frame
  v.muted = true;           // required for hover autoplay
  v.setAttribute('muted','');                 // Safari/iOS quirk
  v.playsInline = true;
  v.setAttribute('playsinline','');           // iOS quirk
  v.loop = true;
  v.preload = 'metadata';
  div.appendChild(v);

  // mark tile ready as soon as the browser has enough to draw a frame
  const markReady = () => div.classList.add('ready');
  v.addEventListener('loadedmetadata', markReady, { once:true });
  v.addEventListener('loadeddata',     markReady, { once:true });
  v.addEventListener('canplay',        markReady, { once:true });

  // hover preview (desktop / pointer devices only)
  const canHover = window.matchMedia('(pointer:fine)').matches && !('ontouchstart' in window);
  if (canHover) {
    div.addEventListener('mouseenter', () => { v.play().catch(()=>{}); });
    div.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
  }

  // click => open in lightbox everywhere
  v.addEventListener('click', () => openLightbox(`${VIDEO_DIR}/${name}`, 'video'));

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
