const gallery = document.getElementById('gallery');
const lightbox = document.getId('lightbox');
const lightContent = document.getElementById('lightContent');
const downloadLink = document.getElementById('download');

function load(type, json) {
  json.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = type;

    if (type === 'photo') {
      const img = document.createElement('img');
      img.src = `assets/${type}s/${name}`;
      img.onclick = () => openLightbox(img.src, 'img');
      div.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = `assets/${type}s/${name}`;
      vid.muted = true;
      vid.onmouseenter=()=>vid.play();
      vid.onmouseleave=()=>vid.pause();
      vid.onclick = () => openLightbox(vid.src, 'video');
      div.appendChild(vid);
    }
    gallery.appendChild(div);
  });
}

fetch('photos.json').then(r=>r.json()).then(d=>load('photo',d));
fetch('videos.json').then(r=>r.json()).then(d=>load('video',d));

document.querySelectorAll('.filters button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.type;
    document.querySelectorAll('#gallery .item').forEach(it=>{
      if(t==='all' || it.dataset.type===t){ it.style.display='block'; }
      else{ it.style.display='none'; }
    });
  }
});

/* lightbox logic unchanged here */