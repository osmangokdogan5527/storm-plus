import fs from 'fs';
let c = fs.readFileSync('src/components/stoklar/StockModal.tsx', 'utf8');

c = c.replace(/      \`,\n          barcode: null\.barcode \|\| '',\n[\s\S]*?\} else \{/g, "      } else {");

fs.writeFileSync('src/components/stoklar/StockModal.tsx', c);
