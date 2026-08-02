const fs = require('fs');

let file = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

const regex = /\{\/\* Mini Currency Ticker \*\/\}(.|\n)*?\{\/\* Mini Currency Ticker End \*\/\}/m;

// wait, it doesn't have an end tag. Let's just remove the block exactly.
// I will just use sed to delete lines 606 to 658
