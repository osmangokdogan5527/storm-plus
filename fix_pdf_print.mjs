import fs from 'fs';
let pdfPrint = fs.readFileSync('src/components/islemler/PdfPrintModal.tsx', 'utf8');
pdfPrint = pdfPrint.replace(/kdvBreakdown\n/g, "\n");
pdfPrint = pdfPrint.replace(/kdvBreakdown,/g, "");
fs.writeFileSync('src/components/islemler/PdfPrintModal.tsx', pdfPrint);
