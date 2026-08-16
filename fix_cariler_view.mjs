import fs from 'fs';
let c = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');
const regex = /\/\/ Open modal with AI prefilled data\s*useEffect\(\(\) => \{[\s\S]*?\}, \[ safeCariler\.length, \(\(\) => \{\}\)\]\);/g;
c = c.replace(regex, "");
fs.writeFileSync('src/components/CarilerView.tsx', c);
