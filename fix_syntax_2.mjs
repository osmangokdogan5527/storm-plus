import fs from 'fs';

const filesToFix = [
  'src/components/islemler/print-templates/ClassicTemplate.tsx',
  'src/components/islemler/print-templates/DefaultTemplate.tsx',
  'src/components/islemler/print-templates/ElegantTemplate.tsx',
  'src/components/islemler/print-templates/ModernTemplate.tsx'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{activeTemplate\?\.showDiscountRate && \}/g, "");
    content = content.replace(/\{activeTemplate\?\.showVatRate && \(\s*\)\}/g, "");
    content = content.replace(/\{activeTemplate\?\.showVatRate && \s*\}/g, "");
    fs.writeFileSync(file, content);
  }
}
