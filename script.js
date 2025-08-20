// Assuming we have arrays of media items. Let's say:
const photos = [ /* ... list of photo file URLs or objects ... */ ];
const videos = [ /* ... list of video file URLs or objects ... */ ];

// Get references to DOM elements (assuming these IDs/classes in HTML)
const galleryContainer = document.querySelector('.gallery-container');
const filterAllBtn = document.getElementById('filter-all');
const filterPhotosBtn = document.getElementById('filter-photos');
const filterVideosBtn = document.getElementById('filter-videos');
const shuffleBtn = document.getElementById('shuffle-btn');

// State to track current filter
let currentFilter = 'all';

// Utility: Shuffle an array in-place (Fisher-Yates shuffle)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Render gallery based on current filter and given order of items
function renderGallery(items) {
  galleryContainer.innerHTML = '';  // clear existing tiles

  items.forEach(item => {
    // Determine if item is photo or video by type or file extension
    const isVideo = item.type === 'video' || /\.(mp4|webm|ogg)$/.test(item); 
    // (Above, assuming item could be an object {src, type} or a filename string.)
    // Create tile element
    const tile = document.createElement('div');
    tile.className = 'tile';
    if (isVideo) {
      // Create video element for video
      const videoEl = document.createElement('video');
      videoEl.src = item.src || item;              // item might be {src: "..."} or a string URL
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.preload = 'metadata';  // load metadata (enough to get first frame)
      // No controls on thumb (we'll add controls in lightbox view)
      tile.appendChild(videoEl);
    } else {
      // Create img element for photo
      const imgEl = document.createElement('img');
      imgEl.src = item.src || item;
      imgEl.loading = 'lazy';  // use lazy loading for performance if supported
      imgEl.alt = 'Photo';
      tile.appendChild(imgEl);
    }
    galleryContainer.appendChild(tile);
  });

  // After rendering all tiles, attach hover and click events
  attachTileEvents();
}

// Attach hover (for videos) and click (for lightbox) events to tiles
function attachTileEvents() {
  const allTiles = document.querySelectorAll('.gallery-container .tile');
  allTiles.forEach(tile => {
    const mediaElem = tile.querySelector('img, video');
    if (!mediaElem) return;
    const isVideo = mediaElem.tagName.toLowerCase() === 'video';

    // Click event for lightbox (both image and video)
    mediaElem.addEventListener('click', e => {
      e.stopPropagation();
      if (isVideo) {
        // Pause the preview if it was playing
        mediaElem.pause();
        openLightbox(mediaElem.currentSrc || mediaElem.src, 'video');
      } else {
        openLightbox(mediaElem.currentSrc || mediaElem.src, 'photo');
      }
    });

    // Hover events (desktop only, videos only)
    if (isVideo) {
      // Play on hover (mouseenter), pause on leave (mouseleave)
      tile.addEventListener('mouseenter', () => {
        // Play the video preview (catch promise to avoid console error if interrupted)
        mediaElem.play().catch(err => { /* silence play interruption errors */ });
      });
      tile.addEventListener('mouseleave', () => {
        mediaElem.pause();
        // Optional: reset to beginning so it previews from start next time
        mediaElem.currentTime = 0;
      });

      // For mobile devices (no hover), you *could* add a touchstart to play, but 
      // we'll rely on click to open lightbox instead of inline play to keep it simple.
    }
  });
}

// Lightbox overlay setup
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.innerHTML = `<span class="close">&times;</span><div class="content"></div>`;
document.body.appendChild(lightbox);
const lightboxContent = lightbox.querySelector('.content');
const lightboxClose = lightbox.querySelector('.close');

// Close lightbox on close button or backdrop click
lightboxClose.addEventListener('click', () => { lightbox.classList.remove('active'); });
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) {  // click outside the content
    lightbox.classList.remove('active');
  }
});

// Function to open lightbox with given media
function openLightbox(src, type) {
  lightboxContent.innerHTML = '';  // clear previous content
  if (type === 'photo') {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Full Photo';
    lightboxContent.appendChild(img);
  } else if (type === 'video') {
    const vid = document.createElement('video');
    vid.src = src;
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    lightboxContent.appendChild(vid);
    // Video will autoplay with controls; user can unmute if desired
  }
  // Add download link
  const downloadLink = document.createElement('a');
  downloadLink.href = src;
  downloadLink.download = '';  // triggers download of the same filename
  downloadLink.textContent = 'Download';
  downloadLink.className = 'download-link';
  lightboxContent.appendChild(downloadLink);

  // Show lightbox
  lightbox.classList.add('active');
}

// Shuffle functionality
function shuffleGallery() {
  if (currentFilter === 'all') {
    // Shuffle combined list of photos and videos
    const combined = photos.concat(videos);
    shuffleArray(combined);
    renderGallery(combined);
  } else if (currentFilter === 'photos') {
    const photosShuffled = [...photos];
    shuffleArray(photosShuffled);
    renderGallery(photosShuffled);
  } else if (currentFilter === 'videos') {
    const videosShuffled = [...videos];
    shuffleArray(videosShuffled);
    renderGallery(videosShuffled);
  }
}

// Filter button event handlers
filterAllBtn.addEventListener('click', () => {
  currentFilter = 'all';
  // Render all photos + videos (in default order or shuffled state?)
  const combined = photos.concat(videos);
  renderGallery(combined);
});
filterPhotosBtn.addEventListener('click', () => {
  currentFilter = 'photos';
  renderGallery(photos);
});
filterVideosBtn.addEventListener('click', () => {
  currentFilter = 'videos';
  renderGallery(videos);
});

// Shuffle button handler
shuffleBtn.addEventListener('click', () => {
  shuffleGallery();
});

// INITIALIZE GALLERY ON PAGE LOAD
renderGallery( photos.concat(videos) );
console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${photos.length + videos.length} tiles`);
