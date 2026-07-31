import JSZip from 'jszip';
import { ZipFileInfo } from '../types';

/**
 * Extracts a `.zip` File or ArrayBuffer into an array of ZipFileInfo items
 */
export async function readZipFile(fileOrBuffer: File | ArrayBuffer): Promise<ZipFileInfo[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(fileOrBuffer);
  const filesList: ZipFileInfo[] = [];

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    const promise = (async () => {
      let content = '';
      let fileType = 'text';

      // Guess file type based on extension
      const ext = relativePath.split('.').pop()?.toLowerCase() || '';
      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);
      const isBinary = ['exe', 'dll', 'bin', 'pdf', 'zip', 'rar'].includes(ext);

      if (!zipEntry.dir) {
        if (isImage) {
          fileType = 'image';
          try {
            const base64 = await zipEntry.async('base64');
            const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
            content = `data:${mime};base64,${base64}`;
          } catch {
            content = '[Binary Image Data]';
          }
        } else if (!isBinary) {
          fileType = 'code';
          try {
            content = await zipEntry.async('string');
          } catch {
            content = '[Unable to read text file]';
          }
        } else {
          fileType = 'binary';
          content = '[Binary File]';
        }
      }

      filesList.push({
        name: zipEntry.name.split('/').filter(Boolean).pop() || zipEntry.name,
        path: relativePath,
        size: (zipEntry as any)._data?.uncompressedSize || content.length || 0,
        isDir: zipEntry.dir,
        date: zipEntry.date || new Date(),
        content,
        type: fileType,
      });
    })();

    filePromises.push(promise);
  });

  await Promise.all(filePromises);

  // Sort directories first, then files alphabetically
  return filesList.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.path.localeCompare(b.path);
  });
}

/**
 * Creates a downloadable .zip File blob from an array of files/folders
 */
export async function createZipFile(files: { path: string; content: string | Blob; isDir?: boolean }[]): Promise<Blob> {
  const zip = new JSZip();

  for (const item of files) {
    if (item.isDir) {
      zip.folder(item.path);
    } else {
      zip.file(item.path, item.content);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates a sample demo "Storm Plus Starter Web App" ZIP
 */
export async function createSampleZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  zip.file('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Storm Plus App Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 40px; }
    .card { background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155; display: inline-block; max-width: 400px; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 12px; }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1>⚡ Storm Plus Desktop</h1>
    <p>This is a sample web app extracted from a ZIP package inside Storm Plus!</p>
    <button onclick="alert('Hello from extracted Storm Plus App!')">Click Me</button>
  </div>
</body>
</html>`);

  zip.file('style.css', `/* Storm Plus Demo Stylesheet */
:root {
  --primary: #3b82f6;
  --bg: #0f172a;
}
`);

  zip.file('app.js', `console.log("Storm Plus App Initialized!");
function getSystemStatus() {
  return "Storm Plus OS Running Smoothly";
}
`);

  zip.file('README.md', `# Storm Plus Desktop Package

Welcome to **Storm Plus Desktop Edition**!

## Included Files
- \`index.html\`: Main HTML entry point
- \`style.css\`: Application theme stylesheet
- \`app.js\`: Core application logic
- \`config.json\`: Project manifest configuration

This package was extracted seamlessly inside Storm Plus Virtual Desktop environment.
`);

  zip.file('config.json', JSON.stringify({
    appName: "Storm Plus Client",
    version: "1.0.0",
    author: "Storm Developer",
    environment: "PC Desktop Edition",
    status: "Active"
  }, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}
