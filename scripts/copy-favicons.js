const fs = require('fs');
const path = require('path');

const srcFavicon = path.join(__dirname, '../public/favicon/favicon.ico');
const destFavicon = path.join(__dirname, '../public/favicon.ico');

const srcApple = path.join(__dirname, '../public/favicon/apple-touch-icon.png');
const destApple = path.join(__dirname, '../public/apple-touch-icon.png');

if (fs.existsSync(srcFavicon)) {
  fs.copyFileSync(srcFavicon, destFavicon);
  console.log("Copied favicon.ico to public/favicon.ico");
}

if (fs.existsSync(srcApple)) {
  fs.copyFileSync(srcApple, destApple);
  console.log("Copied apple-touch-icon.png to public/apple-touch-icon.png");
}
