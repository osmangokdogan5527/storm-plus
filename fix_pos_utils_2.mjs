import fs from 'fs';

let content = fs.readFileSync('src/utils/posUtils.ts', 'utf8');
content = content.replace(/ymentSplit\) \{/, "export function calculatePaymentBalance(grandTotal: number, payment: PosPaymentSplit) {");
fs.writeFileSync('src/utils/posUtils.ts', content);
