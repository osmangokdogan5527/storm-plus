import fs from 'fs';
let c = fs.readFileSync('src/components/MasraflarView.tsx', 'utf8');
c = c.replace(/cariler = \[\],\s*\}: MasraflarViewProps\) \{/g, "cariler = []\n}: MasraflarViewProps) {");
fs.writeFileSync('src/components/MasraflarView.tsx', c);
