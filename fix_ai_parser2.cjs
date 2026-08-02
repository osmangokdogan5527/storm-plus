const fs = require('fs');

let file = fs.readFileSync('src/utils/aiExcelParser.ts', 'utf8');

const broken = `          if (mapping.currencyColumnIndex !== null && mapping.currencyColumnIndex !== -1 && row[mapping.currencyColumnIndex]) {
             const currStr = row[mapping.currencyColumnIndex].toString().toUpperCase();
             
             
             else
              else currency = 'TRY';
          } else {
             
             
             else
          }`;

const fixed = `          if (mapping.currencyColumnIndex !== null && mapping.currencyColumnIndex !== -1 && row[mapping.currencyColumnIndex]) {
             currency = 'TRY';
          } else {
             currency = 'TRY';
          }`;

file = file.replace(broken, fixed);
fs.writeFileSync('src/utils/aiExcelParser.ts', file, 'utf8');
console.log('Fixed ai parser again');
