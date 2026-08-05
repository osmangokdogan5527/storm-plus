const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');
const lines = code.split('\n');

for (let i = 320; i < 580; i++) {
  if (lines[i] && lines[i].includes('[data-design-style="clean-light"]')) {
    lines[i] = lines[i].replaceAll('[data-design-style="clean-light"]', '[data-design-style="pro-solid"]');
  }
}

fs.writeFileSync('src/index.css', lines.join('\n'));
