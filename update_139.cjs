const fs = require('fs');

// package.json
let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(/"version": "1.3.8"/, '"version": "1.3.9"');
fs.writeFileSync('package.json', pkg);

// constants.tsx
let consts = fs.readFileSync('src/constants.tsx', 'utf8');

consts = consts.replace(/export const APP_VERSION = '1.3.8';/, "export const APP_VERSION = '1.3.9';");
consts = consts.replace(/export const CHANGELOG = {\n  version: '1.3.8',\n  features: \[\n    [^\]]*\n  \],\n  fixes: \[\]\n};/m, `export const CHANGELOG = {
  version: '1.3.9',
  features: [
    "Kritik Senkronizasyon Çözümü: Bilgisayar (Electron) versiyonunda girilen verilerin (müşteri, stok vb.) ön izleme (Web) ekranına düşmesini engelleyen eski önbellek sorunu kesin olarak çözüldü."
  ],
  fixes: []
};`);

consts = consts.replace(/export const changelogData = \[\n  {\n    version: "1\.3\.8",/, `export const changelogData = [
  {
    version: "1.3.9",`);

fs.writeFileSync('src/constants.tsx', consts);
