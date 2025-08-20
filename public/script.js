const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightContent = document.getElementById('lightContent');
const downloadLink = document.getElementById('download');
const deleteBtn = document.createElement('button');
deleteBtn.id = 'delete';
deleteBtn.textContent = 'Delete';
deleteBtn.style.marginTop = '8px';

const USERNAME = "kemomeyer541";
const REPO     = "kelsey-memorial";
const TOKEN    = "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";

function load(type, data) {
  data.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = type;

    if (type === 'photo') {
      const img = document.createElement('img');
      img.src = `assets/${type}s/${name}`;
      img.onclick = () => openLightbox(img.src, 'img', name, type);
      div.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = `assets/${type}s/${name}`;
      vid.muted = true;
      vid.onmouseenter = () => vid.play();
      vid.onmouseleave = () => vid.pause();
      vid.onclick       = () => openLightbox(vid.src, 'video', name, type);
      div.appendChild(vid);
    }
    gallery.appendChild(div);
  });
}

// load lists
fetch('photos.json').then(r => r.json()).then(d => load('photo', d));
fetch('videos.json').then(r => r.json()).then(d => load('video', d));

function openLightbox(url, type, filename, filetype) {
  lightbox.classList.remove('hidden');
  downloadLink.href = url;
  if (type === 'img') {
    lightContent.innerHTML = `<img src="${url}">`;
  } else {
    lightContent.innerHTML = `<video src="${url}" controls autoplay></video>`;
  }
  if (!document.getElementById('delete')) lightbox.appendChild(deleteBtn);
  deleteBtn.onclick = () => deleteFile(filename, filetype);
}

document.getElementById('close').onclick = () => lightbox.classList.add('hidden');

async function deleteFile(name, type) {
  lightbox.classList.add('hidden');

  const jsonPath = type === 'photo' ? 'photos.json' : 'videos.json';
  const response = await fetch(jsonPath);
  let arr        = await response.json();
  arr            = arr.filter(n => n !== name);

  await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}/contents/public/${jsonPath}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `token ${TOKEN}`
    },
    body: JSON.stringify({
      message: `delete ${name}`,
      content: btoa(JSON.stringify(arr, null, 2))
    })
  });

  location.reload();
}