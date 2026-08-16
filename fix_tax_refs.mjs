import fs from 'fs';

const filesToWipeTax = [
  'src/components/islemler/print-templates/DefaultTemplate.tsx',
  'src/components/islemler/print-templates/ElegantTemplate.tsx',
  'src/components/islemler/print-templates/ModernTemplate.tsx',
  'src/components/islemler/print-templates/ClassicTemplate.tsx'
];

for (const file of filesToWipeTax) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // We can just remove the TH and TD for tax.
    content = content.replace(/<th[^>]*>KDV<\/th>/gi, "");
    content = content.replace(/<td[^>]*>%\{item\.taxRate \|\| 20\}<\/td>/g, "");
    content = content.replace(/\{activeTemplate\?\.showVatRate && <th[^>]*>KDV<\/th>\}/gi, "");
    content = content.replace(/\{activeTemplate\?\.showVatRate && <td[^>]*>%\{item\.taxRate \|\| 20\}<\/td>\}/g, "");
    fs.writeFileSync(file, content);
  }
}

let pdfPrint = fs.readFileSync('src/components/islemler/PdfPrintModal.tsx', 'utf8');
pdfPrint = pdfPrint.replace(/const kdvBreakdown = \(\(\) => \{[\s\S]*?\}\)\(\);\s*/, "");
pdfPrint = pdfPrint.replace(/kdvBreakdown,/g, "");
fs.writeFileSync('src/components/islemler/PdfPrintModal.tsx', pdfPrint);

let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/\s*taxRate: number;.*?\n/g, "\n");
fs.writeFileSync('src/types.ts', types);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/\s*taxRate: [0-9]+,?\n/g, "\n");
fs.writeFileSync('src/App.tsx', app);

let posUtils = fs.readFileSync('src/types/pos.ts', 'utf8');
posUtils = posUtils.replace(/\s*taxRate: number;.*?\n/g, "\n");
fs.writeFileSync('src/types/pos.ts', posUtils);

