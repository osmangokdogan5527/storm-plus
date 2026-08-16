import fs from 'fs';

let content = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

// Fix arguments to calculateCartSummary
content = content.replace(/discountMode,\n\s*globalTaxRate\n\s*\);/g, "discountMode\n  );");
content = content.replace(/discountMode,\s*globalTaxRate\s*\)/g, "discountMode)");

// Fix totalTax
content = content.replace(/totalTax: summary\.totalTax/g, "totalTax: 0");

fs.writeFileSync('src/components/pos/PosView.tsx', content);

