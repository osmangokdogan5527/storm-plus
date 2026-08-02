const fs = require('fs');
let constants = fs.readFileSync('src/constants.tsx', 'utf8');
constants = constants.replace("export const APP_VERSION = '1.3.1';", "export const APP_VERSION = '1.3.2';");

const newChangelog = `export const changelogData = [
  {
    version: "1.3.2",
    date: "01.08.2026",
    changes: [
      "Hata Düzeltmeleri: Para birimi panelindeki hizalama ve görünüm sorunları giderildi.",
      "Geliştirmeler: Yeni özellikler için altyapı hazırlıkları yapıldı."
    ]
  },
  {`;
constants = constants.replace("export const changelogData = [\n  {", newChangelog);

fs.writeFileSync('src/constants.tsx', constants, 'utf8');

let pkg = fs.readFileSync('package.json', 'utf8');
pkg = pkg.replace('"version": "1.3.1",', '"version": "1.3.2",');
fs.writeFileSync('package.json', pkg, 'utf8');

console.log('Version updated');
