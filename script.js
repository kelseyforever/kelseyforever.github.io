document.addEventListener('DOMContentLoaded', () => {
  // Configuration: folder paths (if needed)
  const PHOTO_DIR = 'photos/';   // directory where photo files are located (could be '' if in root)
  const VIDEO_DIR = 'videos/';   // directory for video files and thumbnails

  const gallery = document.getElementById('gallery');
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightbox-content');
  const lightboxClose = document.getElementById('lightbox-close');
  const downloadBtn = document.getElementById('downloadBtn');
  const filterAllBtn = document.getElementById('filter-all');
  const filterPhotoBtn = document.getElementById('filter-photos');
  const filterVideoBtn = document.getElementById('filter-videos');
  const topBtn = document.getElementById('top');
  const shuffleBtn = document.getElementById('shuffle');

  // Helper: normalize a filename (remove extension, lowercase)
  function normalizeName(filename) {
    const dotIndex = filename.lastIndexOf('.');
    const base = dotIndex >= 0 ? filename.slice(0, dotIndex) : filename;
    return base.toLowerCase();
  }

  // Fetch photos and videos JSON in parallel
  Promise.all([
    fetch('photos.json').then(res => res.json()),
    fetch('videos.json').then(res => res.json())
  ]).then(([photos, videos]) => {
    const seenNames = new Set();
    const allItems = [];

    // Process videos first, so they take priority in case of name collisions
    for (const vidName of videos) {
      const base = normalizeName(vidName);
      if (seenNames.has(base)) continue;  // skip duplicates
      seenNames.add(base);
      allItems.push({ type: 'video', file: vidName });
    }
    // Process photos
    for (const photoName of photos) {
      const base = normalizeName(photoName);
      if (seenNames.has(base)) continue;
      seenNames.add(base);
      allItems.push({ type: 'photo', file: photoName });
    }

    // Now we have combined list of items. We can (optionally) sort or shuffle initially if needed.
    // By default, we'll keep the order as in JSON (videos first then photos) unless shuffle is clicked.

    // Create DOM elements for each item
    for (const item of allItems) {
      let itemElem = document.createElement('div');
      itemElem.classList.add('item');
      if (item.type === 'photo') {
        itemElem.classList.add('photo');
        // Create image element
        const img = document.createElement('img');
        img.src = PHOTO_DIR + item.file;
        img.alt = '';  // could set alt to filename or description if available
        img.loading = 'lazy';  // lazy-load images offscreen [oai_citation:12‡web.dev](https://web.dev/articles/browser-level-image-lazy-loading#:~:text=Chrome%20loads%20images%20at%20different,fetched%20as%20the%20page%20loads)
        // Fade-in effect: start invisible until loaded
        img.style.opacity = '0';
        img.onload = () => {
          // on image load, fade it in
          img.style.transition = 'opacity 0.5s ease';
          img.style.opacity = '1';
        };
        // Clicking a photo opens it in lightbox
        img.addEventListener('click', () => {
          openLightbox(PHOTO_DIR + item.file, 'photo');
        });
        itemElem.appendChild(img);
      } else if (item.type === 'video') {
        itemElem.classList.add('video');
        // Create video element with poster
        const video = document.createElement('video');
        const videoSrc = VIDEO_DIR + item.file;
        const base = normalizeName(item.file);
        const posterSrc = VIDEO_DIR + base + '.jpg';
        video.src = videoSrc;
        video.poster = posterSrc;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        // We do NOT set autoplay here to avoid all videos playing at once; we'll play on hover/click.
        video.style.opacity = '0';
        // When video metadata (including poster) is loaded, fade in the tile
        video.addEventListener('loadeddata', () => {
          video.style.transition = 'opacity 0.5s ease';
          video.style.opacity = '1';
        });
        // Hover preview on desktop
        itemElem.addEventListener('mouseenter', () => {
          video.play(); // hover to play (video is muted & allowed to autoplay) [oai_citation:13‡developer.chrome.com](https://developer.chrome.com/blog/autoplay#:~:text=Chrome%27s%20autoplay%20policies%20are%20simple%3A)
        });
        itemElem.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0; // reset to beginning (show poster again)
        });
        // Click behavior differs for desktop vs mobile
        itemElem.addEventListener('click', () => {
          if (isTouchDevice()) {
            // On touch devices, use click as preview toggle
            if (video.paused || video.currentTime === 0) {
              // Not yet playing, so start inline playback
              video.play();
              return; // do not open lightbox on first tap
            }
            // If video is already playing, fall through to open in lightbox
          }
          // On desktop (or second tap on mobile), open in fullscreen lightbox
          openLightbox(videoSrc, 'video', posterSrc);
          // Pause the tile video to avoid it playing in background
          video.pause();
          video.currentTime = 0;
        });
        itemElem.appendChild(video);
      }
      gallery.appendChild(itemElem);
    }

    // After rendering all items, we can optionally log counts or do any post-processing.
    console.log(`Rendered: ${photos.length} photos + ${videos.length} videos = ${allItems.length} tiles`);
  }).catch(err => {
    console.error('Error loading gallery data:', err);
  });

  // Helper to detect touch devices (basic check)
  function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  // Lightbox open function
  function openLightbox(src, type, poster) {
    // Clear any existing content
    lightboxContent.innerHTML = '';
    let elem;
    if (type === 'photo') {
      // Create large image
      elem = document.createElement('img');
      elem.src = src;
      elem.alt = '';
    } else if (type === 'video') {
      elem = document.createElement('video');
      elem.src = src;
      elem.controls = true;       // allow user to control playback in fullscreen
      elem.autoplay = true;       // start playing immediately in lightbox
      elem.loop = true;           // keep looping in lightbox (optional)
      elem.playsInline = true;    // ensure it stays in our custom fullscreen, not native player [oai_citation:14‡css-tricks.com](https://css-tricks.com/what-does-playsinline-mean-in-web-video/#:~:text=Mobile%20browsers%2C%20will%20play%20the,up%20fullscreen%20while%20it%20plays)
      // We will un-mute the video so sound plays if any:
      elem.muted = false;
      // Use the same poster if provided (to show while video loads)
      if (poster) elem.poster = poster;
    }
    lightboxContent.appendChild(elem);
    // Set download link href to the media source
    downloadBtn.href = src;
    // If we want, we can set download attribute with a filename (optional). If not, the attribute on HTML is enough.
    // Show the lightbox
    lightbox.classList.add('open');  // assume CSS will display .open or remove .hidden etc.
    // Prevent body from scrolling while lightbox open (optional, if desired)
    document.body.style.overflow = 'hidden';
  }

  // Close lightbox function
  function closeLightbox() {
    // Hide lightbox
    lightbox.classList.remove('open');
    document.body.style.overflow = ''; // restore scrolling
    // Stop any video in lightbox
    const vid = lightboxContent.querySelector('video');
    if (vid) {
      vid.pause();
    }
    // Clear the content
    lightboxContent.innerHTML = '';
  }

  // Set up lightbox close handlers
  lightboxClose.addEventListener('click', closeLightbox);
  // Clicking outside the content (overlay background) could also close, if #lightbox itself has a background:
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      // Only close if the click was on the backdrop, not on the inner content
      closeLightbox();
    }
  });
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });

  // Shuffle button handler
  shuffleBtn.addEventListener('click', () => {
    const itemsArray = Array.from(gallery.children);
    // Fisher-Yates shuffle
    for (let i = itemsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsArray[i], itemsArray[j]] = [itemsArray[j], itemsArray[i]];
    }
    // Re-append in shuffled order
    itemsArray.forEach(item => gallery.appendChild(item));
  });

  // Filter buttons handlers
  filterAllBtn.addEventListener('click', () => {
    setFilter('all');
  });
  filterPhotoBtn.addEventListener('click', () => {
    setFilter('photo');
  });
  filterVideoBtn.addEventListener('click', () => {
    setFilter('video');
  });
  function setFilter(mode) {
    // Update active button styles
    filterAllBtn.classList.toggle('active', mode === 'all');
    filterPhotoBtn.classList.toggle('active', mode === 'photo');
    filterVideoBtn.classList.toggle('active', mode === 'video');
    // Show/hide items
    const items = gallery.querySelectorAll('.item');
    items.forEach(item => {
      if (mode === 'all') {
        item.style.display = '';
      } else if (mode === 'photo') {
        // hide if item is video
        if (item.classList.contains('video')) item.style.display = 'none';
        else item.style.display = '';
      } else if (mode === 'video') {
        if (item.classList.contains('photo')) item.style.display = 'none';
        else item.style.display = '';
      }
    });
  }

  // Scroll-to-top button
  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });  // smooth scroll to top [oai_citation:15‡stackoverflow.com](https://stackoverflow.com/questions/15935318/smooth-scroll-to-top#:~:text=I%20think%20the%20simplest%20solution,scrollTo)
  });
  // Optionally, show/hide the top button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      topBtn.style.display = 'block';
    } else {
      topBtn.style.display = 'none';
    }
  });
});
