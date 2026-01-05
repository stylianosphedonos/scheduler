/**
 * Build script for Resource Scheduler Mobile App
 * Copies web files to dist folder for Capacitor
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Files to copy
const filesToCopy = [
  'index.html',
  'app.js',
  'styles.css',
  'i18n.js',
  'manual.html'
];

// Directories to copy
const dirsToCopy = [
  'i18n'
];

// Copy files
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  } else {
    console.log(`⚠ Skipped ${file} (not found)`);
  }
});

// Copy directories recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

dirsToCopy.forEach(dir => {
  const src = path.join(__dirname, dir);
  const dest = path.join(distDir, dir);
  
  if (fs.existsSync(src)) {
    copyDirRecursive(src, dest);
    console.log(`✓ Copied ${dir}/`);
  } else {
    console.log(`⚠ Skipped ${dir}/ (not found)`);
  }
});

console.log('\\n✅ Build complete!');

