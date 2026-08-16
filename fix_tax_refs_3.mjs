import fs from 'fs';

let islemModal = fs.readFileSync('src/components/islemler/IslemModal.tsx', 'utf8');
islemModal = islemModal.replace(/\s*taxRate: scannedStock\.\n/g, "\n");
fs.writeFileSync('src/components/islemler/IslemModal.tsx', islemModal);

let exportUtils = fs.readFileSync('src/components/raporlar/exportUtils.ts', 'utf8');
exportUtils = exportUtils.replace(/\s*'KDV Oranı \(\%\)': s\.taxRate \|\| 0,\n/g, "\n");
exportUtils = exportUtils.replace(/\(\$\{it\.taxRate\}\% KDV\)/g, "");
fs.writeFileSync('src/components/raporlar/exportUtils.ts', exportUtils);

let defaultTemplate = fs.readFileSync('src/components/islemler/print-templates/DefaultTemplate.tsx', 'utf8');
defaultTemplate = defaultTemplate.replace(/%\{item\.taxRate \|\| 20\}/g, "");
fs.writeFileSync('src/components/islemler/print-templates/DefaultTemplate.tsx', defaultTemplate);

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/\/\/ including tax \(quantity \* price \* \(1 \+ taxRate\/100\)\)/g, "");
fs.writeFileSync('src/types.ts', types);

