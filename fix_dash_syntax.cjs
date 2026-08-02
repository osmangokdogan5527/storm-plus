const fs = require('fs');
let file = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

file = file.replace('      </div>\n      {/* Customizable Master Grid */}', '      )}\n      {/* Customizable Master Grid */}');

fs.writeFileSync('src/components/DashboardView.tsx', file, 'utf8');
console.log('Fixed dash syntax');
