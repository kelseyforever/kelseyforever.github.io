const gallery = document.getElementById('gallery');

function load(type, list) {
  list.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = type;

    if (type === 'photo') {
      const img = document.createElement('img');
      img.src = `assets/photos/${name}`;
      img.loading = "lazy";
      img.onclick = () => openLightbox(img.src, 'img');
      div.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = `assets/videos/${name}`;
      vid.poster = `assets/videos/${name.replace(/\.\w+$/, '')}.jpg`;
      vid.muted = true;
      vid.loop  = true;
      vid.playsInline = true;
      vid.autoplay = false;
      vid.preload  = "metadata";
      vid.onmouseenter = () => vid.play();
      vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };

      // click → open lightbox both mobile and desktop
      vid.onclick = () => openLightbox(vid.src, "video");

      div.appendChild(vid);
    }
    gallery.appendChild(div);
  });
}

function openLightbox(src, kind) {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('hidden');
  const c  = document.getElementById('lightContent');
  c.innerHTML = "";
  if (kind === "img") {
    const i = document.createElement('img');
    i.src = src;
    c.appendChild(i);
  } else {
    const v = document.createElement('video');
    v.src = src;
    v.autoplay = true;
    v.controls = true;
    c.appendChild(v);
  }
}

// render
async function render(shuffle=false){
  gallery.innerHTML="";
  const p = await fetch('photos.json').then(r=>r.json());
  const v = await fetch('videos.json').then(r=>r.json());
  if(shuffle){
    p.sort(()=>Math.random()-0.5);
    v.sort(()=>Math.random()-0.5);
  }
  load('photo', p);
  load('video', v);
}

document.getElementById('shuffleBtn').onclick = ()=>render(true);
document.getElementById('topBtn').onclick     = ()=>window.scrollTo({top:0,behavior:"smooth"});
window.onscroll=()=>document.getElementById('topBtn').style.display=(window.scrollY>300)?"block":"none";
document.getElementById('close').onclick=()=>{ document.getElementById('lightbox').classList.add('hidden'); };

// filters
document.querySelectorAll('.filters button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t=btn.dataset.type;
    document.querySelectorAll('#gallery .item').forEach(it=>{
      it.style.display=(t==="all"||it.dataset.type===t)?"block":"none";
    });
  }
});

// initial
render();
