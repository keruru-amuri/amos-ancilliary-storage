const fs = require('fs');
const path = require('path');

// Copy build files to amos-cloudstore subdirectory
const buildDir = path.join(__dirname, '..', 'build');
const targetDir = path.join(buildDir, 'amos-cloudstore');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Function to copy directory recursively
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const items = fs.readdirSync(src);
    items.forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy all files from build/ to build/amos-cloudstore/
const items = fs.readdirSync(buildDir);
items.forEach(item => {
  if (item !== 'amos-cloudstore' && item !== 'staticwebapp.config.json') {
    const srcPath = path.join(buildDir, item);
    const destPath = path.join(targetDir, item);
    copyRecursive(srcPath, destPath);
  }
});

console.log('✅ Post-build: Copied files to /amos-cloudstore subdirectory');
