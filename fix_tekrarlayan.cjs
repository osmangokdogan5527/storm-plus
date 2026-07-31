const fs = require('fs');

function fixFile(file, regex, replacement) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(regex, replacement);
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed ${file}`);
    }
}

fixFile('src/components/tekrarlayan/TekrarlayanManager.tsx', /recurringTransactions\.filter/g, '(recurringTransactions || []).filter');
fixFile('src/components/tekrarlayan/TekrarlayanManager.tsx', /pendingItems\.length/g, '(pendingItems || []).length');
