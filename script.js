const gallery = document.getElementById('gallery');

// IntersectionObserver to auto-play/pause when visible (works on mobile)
const videoIO = new IntersectionObserver(
  entries => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) {
        target.play().catch(() => {}); // ignore autoplay rejections
      } else {
        target.pause();
        target.currentTime = 0;
      }
    });
  },
  { root: null, rootMargin: '100px', threshold: 0.5 }
);

function addItem(type, name) {
  const div = document.createElement('div');
  div.className = 'item';
  div.dataset.type = type;

  if (type === 'photo') {
    const img = document.createElement('img');
    img.src = `assets/photos/${name}`;
    img.loading = 'lazy';
    img.onload = () => div.classList.add('loaded');
    img.onclick = () => openLightbox(img.src, 'img');
    div.appendChild(img);
  } else {
    const base = name.replace(/\.\w+$/, '');
    const vid  = document.createElement('video');

    vid.src = `assets/videos/${name}`;
    vid.poster = `assets/videos/${base}.jpg`;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline','');
    vid.setAttribute('webkit-playsinline','');
    vid.preload = 'metadata';
    vid.onloadeddata = () => div.classList.add('loaded');

    // Desktop hover preview
    vid.onmouseenter = () => vid.play();
    vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };

    // Click -> lightbox
    vid.onclick = () => openLightbox(vid.src, 'video');

    div.appendChild(vid);
    videoIO.observe(vid);        // mobile “preview” when visible
  }

  gallery.appendChild(div);
}

function load(type, list) {
  list.forEach(name => addItem(type, name));
}

async function render(doShuffle=false) {
  gallery.innerHTML = '';
  const photos = await fetch('photos.json').then(r => r.json());
  const videos = await fetch('videos.json').then(r => r.json());
  if (doShuffle) {
    photos.sort(() => Math.random() - .5);
    videos.sort(() => Math.random() - .5);
  }
  load('photo', photos);
  load('video', videos);
}

// buttons / filters (unchanged)
document.getElementById('shuffleBtn').onclick = () => render(true);
document.getElementById('topBtn').onclick = () => window.scrollTo({top:0, behavior:'smooth'});
window.addEventListener('scroll', () => {
  document.getElementById('topBtn').style.display = window.scrollY > 300 ? 'block' : 'none';
});
document.getElementById('close').onclick = () => document.getElementById('lightbox').classList.add('hidden');

document.querySelectorAll('.filters button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.type;
    document.querySelectorAll('#gallery .item').forEach(it => {
      it.style.display = (t === 'all' || it.dataset.type === t) ? 'block' : 'none';
    });
  };
});

render();
