const fs = require('fs');

function fixFile(file, regex, replacement) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed ${file}`);
    }
}

fixFile('src/components/pos/PosTableManagementModal.tsx', /tables\.length/g, '(tables || []).length');
fixFile('src/components/pos/PosTableManagementModal.tsx', /tables\.filter/g, '(tables || []).filter');
fixFile('src/components/pos/PosView.tsx', /tables\.filter/g, '(tables || []).filter');
fixFile('src/components/pos/PosView.tsx', /parkedSales\.length/g, '(parkedSales || []).length');
