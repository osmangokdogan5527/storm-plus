const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Update ALL_WIDGETS spans
const targetStr = `id: "stats_grid",
    label: "Özet Finansal Göstergeler",
    description:
      "Kasa, Banka mevcudu, Net alacak/borç durumu, Net kar/zarar ve Stok toplam değer özet kartları.",
    span: "lg:col-span-3",`;
    
const replacementStr = `id: "stats_grid",
    label: "Özet Finansal Göstergeler",
    description:
      "Kasa, Banka mevcudu, Net alacak/borç durumu, Net kar/zarar ve Stok toplam değer özet kartları.",
    span: "lg:col-span-3 xl:col-span-4",`;

code = code.replace(targetStr, replacementStr);

// Also update the grid container
code = code.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/g, '<div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">');
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">/g, '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">');

// Update default span fallback in map
code = code.replace(/const spanClass = widgetDef\?\.span \|\| "lg:col-span-3";/g, 'const spanClass = widgetDef?.span || "lg:col-span-3 xl:col-span-4";');

fs.writeFileSync('src/components/DashboardView.tsx', code);
