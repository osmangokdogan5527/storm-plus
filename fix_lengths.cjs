const fs = require('fs');

function fixFile(file, regex, replacement) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed ${file}`);
    }
}

fixFile('src/components/pos/PosParkedSalesModal.tsx', /sale\.items\.length/g, '(sale.items || []).length');
fixFile('src/components/pos/PosParkedSalesModal.tsx', /sale\.items\.reduce/g, '(sale.items || []).reduce');
fixFile('src/components/stoklar/StockModal.tsx', /stoklar\.length/g, '(stoklar || []).length');
fixFile('src/components/dashboard/StatsGridWidget.tsx', /stoklar\.length/g, '(stoklar || []).length');
fixFile('src/components/dashboard/StatsGridWidget.tsx', /cariler\.length/g, '(cariler || []).length');
fixFile('src/components/dashboard/StatsGridWidget.tsx', /islemler\.length/g, '(islemler || []).length');
