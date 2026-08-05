const fs = require('fs');

// package.json
let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(/"version": "1.3.6"/, '"version": "1.3.7"');
fs.writeFileSync('package.json', pkg);

// constants.tsx
let consts = fs.readFileSync('src/constants.tsx', 'utf8');

consts = consts.replace(/export const APP_VERSION = '1.3.6';/, "export const APP_VERSION = '1.3.7';");
consts = consts.replace(/export const CHANGELOG = {\n  version: '1.3.6',\n  features: \[\n    "[^"]+"\n  \],\n  fixes: \[\]\n};/, `export const CHANGELOG = {
  version: '1.3.7',
  features: [
    "Geniş Ekran Optimizasyonu: Uygulama genişliği 1600px'e çıkarılarak büyük ekranlarda daha ferah bir kullanım sağlandı.",
    "Dashboard İyileştirmesi: Dashboard bileşenleri ekstra geniş ekranlarda 4 sütunlu yerleşime geçecek şekilde optimize edildi.",
    "Tema ve UI Düzeltmeleri: Temalardaki metin ve arkaplan zıtlık sorunları giderildi."
  ],
  fixes: []
};`);

const newChangelogEntry = `export const changelogData = [
  {
    version: "1.3.7",
    date: "05.08.2026",
    changes: [
      "Geniş Ekran Optimizasyonu: Uygulama ana kapsayıcı genişliği 1600px'e çıkarılarak büyük ekranlarda (1080p ve üzeri) daha ferah bir görünüm ve çalışma alanı sağlandı.",
      "Dashboard (Panel) İyileştirmesi: Dashboard içindeki özet kartları ve analiz bileşenleri ekstra geniş ekranlarda (XL) 4 sütunlu yerleşime uyumlu hale getirildi.",
      "Tema & UI Düzeltmeleri: Tema değişimlerinde bazı metinlerin ve arka planların görünmemesi veya okunaksız olması sorunları giderildi."
    ]
  },
  {`;

consts = consts.replace(/export const changelogData = \[\n  {/, newChangelogEntry);

fs.writeFileSync('src/constants.tsx', consts);
