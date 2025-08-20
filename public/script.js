const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightContent = document.getElementById('lightContent');
const downloadLink = document.getElementById('download');

function load(type, data) {
  data.forEach(name => {
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
      vid.onmouseenter = ()=>vid.play();
      vid.onmouseleave = ()=>vid.pause();
      vid.onclick       = () => openLightbox(vid.src, 'video');
      div.appendChild(vid);
    }
    gallery.appendChild(div);
  });
}

function openLightbox(url,type){
  lightbox.classList.remove('hidden');
  downloadLink.href=url;
  if(type==='img'){
    lightContent.innerHTML = `<img src="${url}">`;
  } else {
    lightContent.innerHTML=`<video src="${url}" controls autoplay></video>`;
  }
}
document.getElementById('close').onclick=()=>lightbox.classList.add('hidden');

function render(shuffled=false) {
  gallery.innerHTML = '';
  Promise.all([fetch('photos.json').then(r=>r.json()), fetch('videos.json').then(r=>r.json())])
    .then(([p,v])=>{
      const unique = Array.from(new Set([...p, ...v]));
      if(shuffled) unique.sort(()=>Math.random()-0.5);
      load('photo', p.filter(n=>unique.includes(n)));
      load('video', v.filter(n=>unique.includes(n)));
    });
}

// shuffle button
document.getElementById('shuffleBtn').onclick=()=>render(true);

// back to top
document.getElementById('topBtn').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
window.onscroll=()=>{
  document.getElementById('topBtn').style.display = window.scrollY>300 ? 'block':'none';
};

// initial render shuffled once:
render(true);