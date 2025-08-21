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
    const div  = document.createElement('div');
    div.className = 'item';
    div.dataset.type = 'video';

    const base = name.replace(/\.\w+$/, '');
    const v    = document.createElement('video');

    v.src    = `${VIDEO_DIR}/${name}#t=0.01`;       // nudge first frame
    v.poster = `${VIDEO_DIR}/${base}.jpg`;
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';

    // paint poster as background immediately (fallback if poster takes a moment)
    div.style.backgroundImage = `url('${VIDEO_DIR}/${base}.jpg')`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';

    v.addEventListener('loadeddata', () => div.classList.add('loaded'));

    if (!isTouch()) {
      v.addEventListener('mouseenter', () => v.play());
      v.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
    }

    // click → open lightbox; pause tile
    v.onclick = () => { openLightbox(`${VIDEO_DIR}/${name}`, 'video', `${VIDEO_DIR}/${base}.jpg`); v.pause(); };

    div.appendChild(v);
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
