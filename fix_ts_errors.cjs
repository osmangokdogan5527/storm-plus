const fs = require('fs');

let calisanlar = fs.readFileSync('src/components/CalisanlarView.tsx', 'utf8');
calisanlar = calisanlar.replace(/balances\[emp\.id\] = \{ TRY: 0, USD: 0, EUR: 0 \};/g, 'balances[emp.id] = { TRY: 0 };');
calisanlar = calisanlar.replace(/balances\[tx\.employeeId\] = \{ TRY: 0, USD: 0, EUR: 0 \};/g, 'balances[tx.employeeId] = { TRY: 0 };');
fs.writeFileSync('src/components/CalisanlarView.tsx', calisanlar, 'utf8');

let aiExcelParser = fs.readFileSync('src/utils/aiExcelParser.ts', 'utf8');
aiExcelParser = aiExcelParser.replace(/if \(currStr\.includes\('USD'\) \|\| currStr === '\$'\) currency = 'USD';/g, '');
aiExcelParser = aiExcelParser.replace(/if \(currStr\.includes\('EUR'\) \|\| currStr === '€'\) currency = 'EUR';/g, '');
aiExcelParser = aiExcelParser.replace(/if \(rowStr\.includes\('USD'\) \|\| rowStr\.includes\('\$'\)\) currency = 'USD';/g, '');
aiExcelParser = aiExcelParser.replace(/if \(rowStr\.includes\('EUR'\) \|\| rowStr\.includes\('€'\) \|\| rowStr\.includes\('EURO'\)\) currency = 'EUR';/g, '');
fs.writeFileSync('src/utils/aiExcelParser.ts', aiExcelParser, 'utf8');

let excelParser = fs.readFileSync('src/utils/excelParser.ts', 'utf8');
excelParser = excelParser.replace(/if \(combinedSearchStr\.includes\('USD'\) \|\| combinedSearchStr\.includes\('DOLAR'\) \|\| combinedSearchStr\.includes\('\$'\)\) \{\n      currency = 'USD';\n    \} else if \(combinedSearchStr\.includes\('EUR'\) \|\| combinedSearchStr\.includes\('EURO'\) \|\| combinedSearchStr\.includes\('€'\)\) \{\n      currency = 'EUR';\n    \}/g, '');
fs.writeFileSync('src/utils/excelParser.ts', excelParser, 'utf8');

console.log('Fixed');
