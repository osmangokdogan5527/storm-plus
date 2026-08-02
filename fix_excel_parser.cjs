const fs = require('fs');
let file = fs.readFileSync('src/utils/excelParser.ts', 'utf8');

const broken = `    let currency: 'TRY' = 'TRY';
    const curVal = currencyCol ? String(row[currencyCol] || '').toUpperCase() : '';
    const combinedSearchStr = \`\${curVal} \${rawBalStr} \${rawNotes}\`.toUpperCase();

     else {
      currency = 'TRY';
    }`;

const fixed = `    let currency: 'TRY' = 'TRY';
    const curVal = currencyCol ? String(row[currencyCol] || '').toUpperCase() : '';
    const combinedSearchStr = \`\${curVal} \${rawBalStr} \${rawNotes}\`.toUpperCase();`;

file = file.replace(broken, fixed);
fs.writeFileSync('src/utils/excelParser.ts', file, 'utf8');
console.log('Fixed excel parser');
