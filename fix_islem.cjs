const fs = require('fs');

let file = fs.readFileSync('src/components/islemler/IslemModal.tsx', 'utf8');

file = file.replace(/if \(\(transactionCurrency === 'USD' \|\| transactionCurrency === 'EUR'\) && activeCariCurrency === 'TRY'\) \{\n      return Number\(\(amt \* exchangeRate\)\.toFixed\(2\)\);\n    \}\n    if \(transactionCurrency === 'TRY' && \(activeCariCurrency === 'USD' \|\| activeCariCurrency === 'EUR'\)\) \{\n      return Number\(\(amt \/ exchangeRate\)\.toFixed\(2\)\);\n    \}/g, '');

fs.writeFileSync('src/components/islemler/IslemModal.tsx', file, 'utf8');
console.log('Fixed IslemModal');
