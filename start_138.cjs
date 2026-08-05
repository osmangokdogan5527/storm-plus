const fs = require('fs');

// package.json
let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace(/"version": "1.3.7"/, '"version": "1.3.8"');
fs.writeFileSync('package.json', pkg);

// constants.tsx
let consts = fs.readFileSync('src/constants.tsx', 'utf8');

consts = consts.replace(/export const APP_VERSION = '1.3.7';/, "export const APP_VERSION = '1.3.8';");
consts = consts.replace(/export const CHANGELOG = {\n  version: '1.3.7',\n  features: \[\n    [^\]]*\n  \],\n  fixes: \[\]\n};/m, `export const CHANGELOG = {
  version: '1.3.8',
  features: [
    "1.3.8 sürümü için geliştirme altyapısı hazırlandı."
  ],
  fixes: []
};`);

const newChangelogEntry = `export const changelogData = [
  {
    version: "1.3.8",
    date: "05.08.2026",
    changes: [
      "1.3.8 sürümü geliştirmeleri ve altyapı hazırlıkları başladı."
    ]
  },
  {`;

consts = consts.replace(/export const changelogData = \[\n  {/, newChangelogEntry);

fs.writeFileSync('src/constants.tsx', consts);
