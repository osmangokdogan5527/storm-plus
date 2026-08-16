import fs from 'fs';
let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '1.4.3';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
