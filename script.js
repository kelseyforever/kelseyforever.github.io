const gallery     = document.getElementById('gallery');
const lightbox    = document.getElementById('lightbox');
const lightContent= document.getElementById('lightContent');
const downloadLink= document.getElementById('download');
const filters     = document.querySelectorAll('.filters button');

function load(type, list) {
  list.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = type;

    if (type === 'photo') {
      const img = document.createElement('img');
      img.src = `assets/photos/${name}`;
      img.loading = 'lazy';
      img.onclick = () => openLightbox(img.src, 'img');
      div.appendChild(img);
    } else {
     const vid = document.createElement('video');
      vid.src = `assets/videos/${name}#t=0.1`;
      vid.muted = true;
      vid.poster = `assets/videos/${name}.jpg`;
      vid.preload = "none";           // <---- NEW
      vid.setAttribute('playsinline','');  // <---- NEW
      vid.onmouseenter = () => vid.play();
      vid.onmouseleave = () => vid.pause();
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

document.getElementById('close').onclick = () => {
  lightbox.classList.add('hidden');
  const vid = lightContent.querySelector('video');
  if (vid) { vid.pause(); vid.currentTime = 0; }
};

function closeLightbox(event){
  if(event.target.id === 'lightbox'){
    document.getElementById('close').click();
  }
}

// render with optional shuffle
function render(shuffled = false){
  gallery.innerHTML = '';
  Promise.all([
    fetch('photos.json').then(r=>r.json()),
    fetch('videos.json').then(r=>r.json())
  ]).then(([p, v]) => {
    let list = [...p, ...v];
    list = list.filter((x,i)=>list.indexOf(x)===i);
    if(shuffled){
      for(let i = list.length-1; i>0; i--){
        const j = Math.floor(Math.random()*(i+1));
        [list[i],list[j]]=[list[j],list[i]];
      }
    }
    load('photo', list.filter(n=>p.includes(n)));
    load('video', list.filter(n=>v.includes(n)));
    bindFilters();

    const obs = new IntersectionObserver(en=>{
      en.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('loaded');
          obs.unobserve(e.target);
        }
      });
    });
    document.querySelectorAll('#gallery img').forEach(img=>obs.observe(img));
  });
}

function bindFilters(){
  filters.forEach(btn => {
    btn.onclick=()=>{
      filters.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t=btn.dataset.type;
      document.querySelectorAll('#gallery .item').forEach(it => {
       if (t === 'all') {
         it.style.display = 'block';
          } else {
          it.style.display = (it.dataset.type === t ? 'block' : 'none');
        }
     });
    }
  });
}

document.getElementById('shuffleBtn').addEventListener('click',()=>render(true));
document.getElementById('topBtn').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
window.addEventListener('scroll',()=>document.getElementById('topBtn').style.display = window.scrollY>300?'block':'none');

render(true);
