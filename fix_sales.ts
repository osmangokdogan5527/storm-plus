const fs = require('fs');
let c = fs.readFileSync('src/components/raporlar/exportUtils.ts', 'utf8');
c = c.replace(/const grossProfitExVat/g, "const salesExVat = summaryStats.sales;\n      const costExVat = summaryStats.costOfSales;\n      const grossProfitExVat");
fs.writeFileSync('src/components/raporlar/exportUtils.ts', c);
