const fs = require('fs');
let file = fs.readFileSync('src/components/islemler/IslemModal.tsx', 'utf8');

const strStart = '{/* Farklı Para Birimi checkbox trigger */}';
const startIdx = file.indexOf(strStart);

// find the closing </div> of the !isInvoice block
// It is after `)}` (the isMultiCurrency block)
// let's just do a regex replace using multiline.

const reg = /\{\/\* Farklı Para Birimi checkbox trigger \*\/\}\n\s*\{\!isInvoice.*?\}\)\}/s;

file = file.replace(reg, '');

// Also remove `isMultiCurrency ? transactionCurrency : activeCariCurrency` and just use `activeCariCurrency`
file = file.replace(/\{isMultiCurrency \? transactionCurrency : activeCariCurrency\}/g, '{activeCariCurrency}');

fs.writeFileSync('src/components/islemler/IslemModal.tsx', file, 'utf8');
console.log('Fixed IslemModal UI');
