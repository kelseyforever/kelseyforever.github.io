const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightContent = document.getElementById('lightContent');
const downloadLink = document.getElementById('download');

/* --- load photos --- */
fetchPhotos();
fetchVideos();

function fetchPhotos() {
  fetch('assets/photos/')
    .then(r => r.text())
    .then(html => {
      const temp = new DOMParser().parseFromString(html, 'text/html');
      Array.from(temp.links).forEach(file => {
        if (/\.(jpe?g|png|webp)$/i.test(file.href)) {
          const div = document.createElement('div');
          div.className = 'item';
          div.setAttribute('data-type','photo');
          const img = document.createElement('img');
          img.src = file.href;
          img.onclick = () => openLightbox(file.href, 'img');
          div.appendChild(img);
          gallery.appendChild(div);
        }
      });
    });
}

function fetchVideos() {
  fetch('assets/videos/')
    .then(r => r.text())
    .then(html => {
      const temp = new DOMParser().parseFromString(html, 'text/html');
      Array.from(temp.links).forEach(file => {
        if (/\.(mp4|mov|webm)$/i.test(file.href)) {
          const div = document.createElement('div');
          div.className = 'item';
          div.setAttribute('data-type','video');
          const vid = document.createElement('video');
          vid.src = file.href;
          vid.muted = true;
          vid.onmouseenter=()=>vid.play();
          vid.onmouseleave=()=>vid.pause();
          vid.onclick = () => openLightbox(file.href, 'video');
          div.appendChild(vid);
          gallery.appendChild(div);
        }
      });
    });
}

/* --- filter buttons --- */
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

/* --- lightbox logic --- */
function openLightbox(url,type){
  lightbox.classList.remove('hidden');
  downloadLink.href=url;
  if(type==='img'){
    lightContent.innerHTML = `<img src="${url}">`;
  }else{
    lightContent.innerHTML=`<video src="${url}" controls autoplay></video>`;
  }
}
document.getElementById('close').onclick=()=>lightbox.classList.add('hidden');