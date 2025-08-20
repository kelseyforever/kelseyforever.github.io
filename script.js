const gallery = document.getElementById('gallery');

function load(type, list) {
  list.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = type;

    if(type === 'photo'){
      const img = document.createElement('img');
      img.src = `assets/photos/${name}`;
      img.loading = 'lazy';
      img.onload = () => div.classList.add('loaded');
      img.onclick = () => openLightbox(img.src, 'img');
      div.appendChild(img);
    }
    else{
      const base = name.replace(/\.\w+$/, '');
      const vid = document.createElement('video');
      vid.src = `assets/videos/${name}`;
      vid.poster = `assets/videos/${base}.jpg`;
      vid.playsInline = true; vid.loop = true; vid.muted = true;
      vid.autoplay = true; vid.preload = 'metadata';
      vid.onloadeddata = () => div.classList.add('loaded');
      vid.onmouseenter = () => vid.play();
      vid.onmouseleave = () => {vid.pause(); vid.currentTime=0;};
      vid.onclick = () => openLightbox(vid.src, 'video');
      div.appendChild(vid);
    }

    gallery.appendChild(div);
  });
}

function openLightbox(src, type){
  const lb = document.getElementById('lightbox');
  lb.classList.remove('hidden');
  const box = document.getElementById('lightContent');
  const dl  = document.getElementById('download');
  box.innerHTML='';
  if(type==='img'){
    const i=document.createElement('img');
    i.src=src; box.appendChild(i);
    dl.href=src;
  } else {
    const v=document.createElement('video');
    v.src=src; v.controls=true; v.autoplay=true; v.playsInline=true;
    box.appendChild(v);
    dl.href=src;
  }
}

async function render(shuffle=false){
  gallery.innerHTML='';
  const photos = await fetch('photos.json').then(r=>r.json());
  const videos = await fetch('videos.json').then(r=>r.json());
  if(shuffle){photos.sort(()=>Math.random()-.5);videos.sort(()=>Math.random()-.5);}
  load('photo', photos);
  load('video', videos);
}

document.getElementById('shuffleBtn').onclick = () => render(true);
document.getElementById('topBtn').onclick = () => window.scrollTo({top:0,behavior:'smooth'});
window.onscroll=()=>document.getElementById('topBtn').style.display = (window.scrollY>300?'block':'none');
document.getElementById('close').onclick=()=>document.getElementById('lightbox').classList.add('hidden');

document.querySelectorAll('.filters button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t=btn.dataset.type;
    document.querySelectorAll('#gallery .item').forEach(it=>{
      it.style.display=(t==='all' || it.dataset.type===t)?'block':'none';
    });
  }
});

// start
render();
