import fs from 'fs';
let content = fs.readFileSync('src/utils/posUtils.ts', 'utf8');
content = content.replace(/\.\/dateUtils/g, './DateUtils');
fs.writeFileSync('src/utils/posUtils.ts', content);
