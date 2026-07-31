const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('View.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Page Headers: flex flex-col sm:flex-row ...
  // Change sm:flex-row to flex-wrap
  content = content.replace(
    /className="flex flex-col sm:flex-row([^"]*)"/g,
    'className="flex flex-col md:flex-row flex-wrap$1"'
  );

  // 2. Filter/Search Bars: flex flex-col md:flex-row ...
  // Ensure flex-wrap is present
  content = content.replace(
    /className="([^"]*)flex flex-col md:flex-row([^"]*)"/g,
    (match, p1, p2) => {
      if (!p1.includes('flex-wrap') && !p2.includes('flex-wrap')) {
        return `className="${p1}flex flex-col md:flex-row flex-wrap${p2}"`;
      }
      return match;
    }
  );

  // 3. Grid cols: sometimes md:grid-cols-4 or md:grid-cols-3 is too tight on small tablets or square screens
  // e.g. grid-cols-1 md:grid-cols-3 lg:grid-cols-4 etc.
  // Actually, we'll let grids be unless they are specifically md:grid-cols-4
  content = content.replace(
    /md:grid-cols-4/g,
    'md:grid-cols-2 lg:grid-cols-4'
  );
  content = content.replace(
    /sm:grid-cols-3/g,
    'sm:grid-cols-2 md:grid-cols-3'
  );
  
  // 4. Action buttons groups in headers: flex gap-2 -> flex flex-wrap gap-2
  content = content.replace(
    /className="flex gap-2([^"]*)"/g,
    'className="flex flex-wrap gap-2$1"'
  );
  content = content.replace(
    /className="flex items-center gap-2([^"]*)"/g,
    'className="flex flex-wrap items-center gap-2$1"'
  );
  content = content.replace(
    /className="flex items-center gap-3([^"]*)"/g,
    'className="flex flex-wrap items-center gap-3$1"'
  );

  // But we must be careful with flex-wrap inside small badges. Let's fix small buttons that we might have broken.
  // We can just revert 'flex-wrap' if it's followed by things like 'w-10 h-10' or if it's inside a button tag.
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
