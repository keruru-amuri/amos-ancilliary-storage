const fs = require('fs');
const path = require('path');

// Create amos-cloudstore subdirectory structure
const buildDir = path.join(__dirname, '..', 'build');
const targetDir = path.join(buildDir, 'amos-cloudstore');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Move all files from build/ to build/amos-cloudstore/
const items = fs.readdirSync(buildDir);
items.forEach(item => {
  if (item !== 'amos-cloudstore') {
    const srcPath = path.join(buildDir, item);
    const destPath = path.join(targetDir, item);
    fs.renameSync(srcPath, destPath);
  }
});

console.log('✅ Post-build: Moved files to /amos-cloudstore subdirectory');
