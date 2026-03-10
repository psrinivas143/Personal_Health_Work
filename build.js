const fs = require('fs');
const path = require('path');
const { buildSync } = require('esbuild');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Create www if doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

// Folders to copy
const foldersToCopy = ['css', 'js', 'assets'];
const filesToCopy = ['index.html', 'manifest.json', 'sw.js'];

// Recursive copy function
function copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Execute
foldersToCopy.forEach(f => {
    const p = path.join(srcDir, f);
    if (fs.existsSync(p)) {
        copyRecursiveSync(p, path.join(destDir, f));
    }
});
filesToCopy.forEach(f => {
    const p = path.join(srcDir, f);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(destDir, f));
});

console.log('App successfully copied to www/ directory.');

// Bundle JS for Capacitor Webview using esbuild
try {
    buildSync({
        entryPoints: [path.join(srcDir, 'js', 'app.js')],
        bundle: true,
        minify: true,
        outfile: path.join(destDir, 'js', 'app.bundle.js'),
        format: 'esm'
    });
    console.log('App JS successfully bundled to www/js/app.bundle.js');
} catch (e) {
    console.error('Esbuild failed:', e);
    process.exit(1);
}
