const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('View.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // fix double flex-wrap
  content = content.replace(/flex-wrap flex-wrap/g, 'flex-wrap');
  content = content.replace(/flex flex-wrap items-center gap-2 flex-wrap/g, 'flex flex-wrap items-center gap-2');
  content = content.replace(/flex flex-wrap items-center gap-3 flex-wrap/g, 'flex flex-wrap items-center gap-3');

  // remove flex-wrap from standard button classes
  // A button or a tag with flex-wrap might break icon-text alignment.
  // We can find all className="flex flex-wrap items-center gap-2" and if it has text-xs px-4 py-3 we might want to remove it.
  content = content.replace(
    /className="([^"]*)flex flex-wrap items-center gap-2([^"]*(?:bg-|px-|py-|text-xs|text-sm)[^"]*)"/g,
    'className="$1flex items-center gap-2$2"'
  );
  content = content.replace(
    /className="([^"]*)flex flex-wrap items-center gap-3([^"]*(?:bg-|px-|py-|text-xs|text-sm)[^"]*)"/g,
    'className="$1flex items-center gap-3$2"'
  );

  // remove flex-wrap from tags that have inline-flex
  content = content.replace(
    /className="([^"]*)inline-flex flex-wrap([^"]*)"/g,
    'className="$1inline-flex$2"'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
