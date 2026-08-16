import fs from 'fs';
const files = [
  'src/components/CalisanlarView.tsx',
  'src/components/IslemlerView.tsx',
  'src/components/MasraflarView.tsx',
  'src/components/CarilerView.tsx',
  'src/components/StoklarView.tsx',
  'src/components/islemler/IslemModal.tsx',
  'src/components/cariler/CariModal.tsx',
  'src/components/stoklar/StockModal.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  // Just wipe out the entire use effects that have `[null]` or `[null,` as dependency
  c = c.replace(/useEffect\(\(\) => \{[\s\S]*?\}\, \[null[\s\S]*?\]\);/g, "");
  c = c.replace(/useEffect\(\(\) => \{[\s\S]*?\}\, \[\s*null\s*\]\);/g, "");
  
  // also, in modals, `} else if (null) { ... }` or `if (null) { ... }`
  c = c.replace(/\} else if \(null\) \{[\s\S]*?\}/g, "");
  c = c.replace(/if \(null\) \{[\s\S]*?\}/g, "");
  
  // also fix `[ isOpen, editingStock, (stoklar || []).length, null ]`
  c = c.replace(/, null\s*\]/g, "]");
  c = c.replace(/\[\s*null,/g, "[");
  c = c.replace(/,\s*null\s*,/g, ", ");
  
  // In CalisanlarView, IslemlerView, etc., the whole `if (null && null.islem === ...)` block inside `useEffect`
  // Actually, some effects might not be removed if their dependency array didn't *start* with null or end with it.
  
  fs.writeFileSync(file, c);
}
