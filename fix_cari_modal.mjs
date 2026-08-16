import fs from 'fs';
let c = fs.readFileSync('src/components/cariler/CariModal.tsx', 'utf8');

c = c.replace(/\} else if \(\!null\) \{/g, "} else {");

fs.writeFileSync('src/components/cariler/CariModal.tsx', c);
