const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/pos/PosView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">/g,
  '<div className="grid grid-cols-2 2xl:grid-cols-4 gap-3">'
);

content = content.replace(
  /flex flex-col sm:flex-row items-center/g,
  'flex flex-col items-center'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed PosView');
