const fs = require('fs');
const path = require('path');

const srcIco = path.join(__dirname, '../public/favicon/favicon.ico');
const destPublicIco = path.join(__dirname, '../public/favicon.ico');
const destAppIco = path.join(__dirname, '../app/favicon.ico');

const srcApple = path.join(__dirname, '../public/favicon/apple-touch-icon.png');
const destPublicApple = path.join(__dirname, '../public/apple-touch-icon.png');
const destAppApple = path.join(__dirname, '../app/apple-icon.png');

if (fs.existsSync(srcIco)) {
  fs.copyFileSync(srcIco, destPublicIco);
  fs.copyFileSync(srcIco, destAppIco);
  console.log("Synced favicon.ico to public/favicon.ico and app/favicon.ico");
}

if (fs.existsSync(srcApple)) {
  fs.copyFileSync(srcApple, destPublicApple);
  fs.copyFileSync(srcApple, destAppApple);
  console.log("Synced apple-touch-icon.png to public/apple-touch-icon.png and app/apple-icon.png");
}
