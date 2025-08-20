const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, '../public/assets/photos');
const videosDir = path.join(__dirname, '../public/assets/videos');

function getFiles(dir, exts) {
  return fs.readdirSync(dir)
    .filter(name => exts.includes(path.extname(name).toLowerCase()));
}

const photos = getFiles(photosDir, ['.jpg', '.jpeg', '.png', '.heic']);
const videos = getFiles(videosDir, ['.mp4', '.mov']);

fs.writeFileSync(path.join(__dirname, '../public/photos.json'), JSON.stringify(photos));
fs.writeFileSync(path.join(__dirname, '../public/videos.json'), JSON.stringify(videos));
console.log('json generated ✅');