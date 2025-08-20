const gallery = document.getElementById('gallery');

/* -------- helpers (safe) -------- */
const normalizeName = (name) =>
  String(name||'').trim().toLowerCase()
    .replace(/\s+/g,' ')
    .replace(/(\s*copy( \d+)?)$/i,'')
    .replace(/\.(jpe?g|png|heic|mp4|mov)$/i,'');

const dedupe = (list) => {
  const seen = new Set();
  return (Array.isArray(list)?list:[]).filter(n=>{
    const key = normalizeName(n);
    if(!key) return false;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const shuffle = (arr) => {
  if(!Array.isArray(arr)) return [];
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
};

const interleave = (photos, videos) => {
  const out = [];
  const max = Math.max(photos.length, videos.length);
  for (let i=0;i<max;i++){
    if(i<photos.length) out.push({type:'photo', name:photos[i]});
    if(i<videos.length) out.push({type:'video', name:videos[i]});
  }
  return out;
};

async function getJSON(url){
  try{
    const r = await fetch(url, { cache:'no-store' });
    if(!r.ok) throw new Error(`${url} ${r.status}`);
    const j = await r.json();
    return Array.isArray(j)?j:[];
  }catch(e){
    console.error('JSON load failed:', url, e);
    return [];
  }
}

/* -------- tile builders -------- */
function addPhoto(name){
  const div = document.createElement('div');
  div.className='item'; div.dataset.type='photo';

  const img = document.createElement('img');
  img.decoding='async';
  img.loading='lazy';
  img.src = `assets/photos/${name}`;
  img.onerror = () => { img.style.opacity=1; }; // if 404, still show tile
  img.onclick = () => openLightbox(img.src,'img');

  div.appendChild(img);
  gallery.appendChild(div);
}

function addVideo(name){
  const div = document.createElement('div');
  div.className='item'; div.dataset.type='video';

  const base = String(name).split('.').slice(0,-1).join('.'); // safe even with multiple dots
  const vid  = document.createElement('video');
  vid.src    = `assets/videos/${name}`;
  vid.poster = `assets/videos/${base}.jpg`;  // must exist for non-black tile
  vid.muted = true; vid.loop = true; vid.playsInline = true;
  vid.autoplay = true; vid.preload = 'metadata';
  vid.onerror  = () => { vid.style.opacity=1; };
  vid.onmouseenter = () => vid.play();
  vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };
  vid.onclick = () => openLightbox(vid.src,'video');

  div.appendChild(vid);
  gallery.appendChild(div);
}

/* -------- lightbox -------- */
function openLightbox(src, kind){
  const lb = document.getElementById('lightbox');
  const box= document.getElementById('lightContent');
  const dl = document.getElementById('download');
  lb.classList.remove('hidden');
  box.innerHTML='';

  if(kind==='img'){
    const i=document.createElement('img');
    i.src=src; box.appendChild(i);
    dl.href=src;
  }else{
    const v=document.createElement('video');
    v.src=src; v.controls=true; v.autoplay=true; v.playsInline=true;
    box.appendChild(v);
    dl.href=src;
  }
}

document.getElementById('close').onclick = () => {
  const lb = document.getElementById('lightbox');
  const box= document.getElementById('lightContent');
  const playing = box.querySelector('video');
  if (playing){ playing.pause(); playing.currentTime = 0; }
  lb.classList.add('hidden');
};
document.getElementById('lightbox').addEventListener('click', (e)=>{
  if(e.target.id==='lightbox') document.getElementById('close').click();
});

/* -------- render -------- */
async function render(doShuffle=false){
  gallery.innerHTML='';

  const [photosRaw, videosRaw] = await Promise.all([
    getJSON('photos.json'),
    getJSON('videos.json')
  ]);

  let photos = dedupe(photosRaw);
  let videos = dedupe(videosRaw);

  if(doShuffle){ shuffle(photos); shuffle(videos); }

  // interleave so vids don’t clump
  const mixed = interleave(photos, videos);
  mixed.forEach(({type, name}) => type==='photo' ? addPhoto(name) : addVideo(name));

  // log counts (for quick sanity checks in console)
  console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${mixed.length} tiles`);
}

/* -------- UI wiring -------- */
document.getElementById('shuffleBtn').onclick = () => render(true);
document.getElementById('topBtn').onclick     = () => window.scrollTo({top:0,behavior:'smooth'});
window.addEventListener('scroll', ()=>{
  document.getElementById('topBtn').style.display = (window.scrollY>300)?'block':'none';
});
document.querySelectorAll('.filters button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t=btn.dataset.type; // "all" | "photo" | "video"
    document.querySelectorAll('#gallery .item').forEach(it=>{
      it.style.display = (t==='all' || it.dataset.type===t) ? 'block' : 'none';
    });
  };
});

/* -------- go -------- */
render();
