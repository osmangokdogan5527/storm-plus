const fs = require('fs');

let code = fs.readFileSync('src/constants.tsx', 'utf8');

// The changelogData starts at `export const changelogData = [` and ends at `];`
const startIdx = code.indexOf('export const changelogData = [');
if (startIdx !== -1) {
  const endIdx = code.indexOf('];', startIdx);
  if (endIdx !== -1) {
    const changelogStr = code.substring(startIdx + 'export const changelogData = '.length, endIdx + 1);
    try {
      // Need to parse it as JS, eval it or use new Function
      const data = new Function('return ' + changelogStr)();
      const filtered = data.filter(item => item.version.startsWith('1.3.'));
      
      const newChangelogStr = 'export const changelogData = [\n' + filtered.map(item => {
        return `  {
    version: "${item.version}",
    date: "${item.date}",
    changes: [
${item.changes.map(c => `      ${JSON.stringify(c)}`).join(',\n')}
    ]
  }`;
      }).join(',\n') + '\n];';
      
      code = code.substring(0, startIdx) + newChangelogStr + code.substring(endIdx + 2);
      fs.writeFileSync('src/constants.tsx', code);
      console.log('Successfully filtered changelog');
    } catch (e) {
      console.error('Error parsing/writing changelog:', e);
    }
  }
}

