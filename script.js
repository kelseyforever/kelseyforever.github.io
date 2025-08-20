(() => {
  const gallery = document.getElementById('gallery');

  /* ---------- utils ---------- */
  const normalize = n => n.trim().toLowerCase()
    .replace(/\s+/g,' ')
    .replace(/(\s*copy( \d+)?)$/i,'')
    .replace(/\.(jpe?g|png|heic|mp4|mov)$/i,'');
  const dedupe = arr => {
    const seen = new Set();
    return arr.filter(n => { const k = normalize(n); if (seen.has(k)) return false; seen.add(k); return true; });
  };
  const fyShuffle = arr => { for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };

  /* ---------- lightbox (auto-create if missing) ---------- */
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
        <a id="download" download>Download</a>
      </div>`;
    document.body.appendChild(lb);
    lb.addEventListener('click', e => { if (e.target === lb) lb.classList.add('hidden'); });
    lb.querySelector('#close').onclick = () => lb.classList.add('hidden');
    return lb;
  }

  function openLightbox(src, kind){
    const lb  = ensureLightbox();
    const box = lb.querySelector('#lightContent');
    const dl  = lb.querySelector('#download');
    box.innerHTML = '';
    if (kind === 'img'){
      const i = new Image(); i.src = src; box.appendChild(i);
    } else {
      const v = document.createElement('video');
      v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
      box.appendChild(v);
    }
    dl.href = src;
    lb.classList.remove('hidden');
  }

  /* ---------- tile creators ---------- */
  function addPhoto(name){
    const div = document.createElement('div'); div.className='item'; div.dataset.type='photo';
    const img = new Image(); img.loading='lazy'; img.src = `assets/photos/${name}`;
    img.onclick = () => openLightbox(img.src, 'img');
    div.appendChild(img);
    gallery.appendChild(div);
  }

  function addVideo(name){
    const base = name.replace(/\.\w+$/, '');
    const div = document.createElement('div'); div.className='item'; div.dataset.type='video';
    const v   = document.createElement('video');
    v.src = `assets/videos/${name}#t=0.01`;      // nudge first frame
    v.poster = `assets/videos/${base}.jpg`;       // your generated thumbs
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';

    // desktop hover preview
    v.onmouseenter = () => v.play();
    v.onmouseleave = () => { v.pause(); v.currentTime = 0; };

    // click => open lightbox everywhere (mobile/desktop)
    v.onclick = () => openLightbox(`assets/videos/${name}`, 'video');

    div.appendChild(v);
    gallery.appendChild(div);
  }

  /* ---------- render flow ---------- */
  async function render(doShuffle=false){
    gallery.innerHTML = '';

    let photos = await fetch('photos.json').then(r=>r.json()).catch(()=>[]);
    let videos = await fetch('videos.json').then(r=>r.json()).catch(()=>[]);
    photos = dedupe(photos);
    videos = dedupe(videos);
    if (doShuffle){ fyShuffle(photos); fyShuffle(videos); }

    // Interleave so videos aren’t bottom-stacked
    const max = Math.max(photos.length, videos.length);
    for (let i=0; i<max; i++){
      if (photos[i]) addPhoto(photos[i]);
      if (videos[i]) addVideo(videos[i]);
    }

    console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${gallery.children.length} tiles`);
  }

  /* ---------- controls ---------- */
  const shuffleBtn = document.getElementById('shuffleBtn');
  if (shuffleBtn) shuffleBtn.onclick = () => render(true);

  const topBtn = document.getElementById('topBtn');
  if (topBtn){
    topBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('scroll', () => {
      topBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    }, { passive: true });
  }

  // Filters
  document.querySelectorAll('.filters button').forEach(btn=>{
    btn.onclick = () => {
      document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.type;
      document.querySelectorAll('#gallery .item').forEach(it=>{
        it.style.display = (t === 'all' || it.dataset.type === t) ? 'block' : 'none';
      });
    };
  });

  render();
})();
