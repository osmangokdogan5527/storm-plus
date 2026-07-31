import { VirtualFile } from '../types';

const STORAGE_KEY = 'storm_plus_vfs_v1';

const DEFAULT_FILES: VirtualFile[] = [
  {
    id: 'root-docs',
    name: 'Documents',
    path: '/Documents',
    type: 'folder',
    size: 0,
    lastModified: Date.now(),
    content: '',
    children: [
      {
        id: 'doc-1',
        name: 'StormPlus_Notes.txt',
        path: '/Documents/StormPlus_Notes.txt',
        type: 'file',
        fileType: 'text',
        size: 240,
        lastModified: Date.now(),
        content: `⚡ Welcome to Storm Plus PC Desktop Edition!

Features in this release:
1. Drag & Drop ZIP archives to inspect & extract contents.
2. Edit code and preview web apps directly inside windows.
3. System monitor, terminal commands, and customization options.
4. Seamless responsive PC desktop environment.`,
      },
      {
        id: 'doc-2',
        name: 'system_manifest.json',
        path: '/Documents/system_manifest.json',
        type: 'file',
        fileType: 'json',
        size: 150,
        lastModified: Date.now(),
        content: JSON.stringify(
          {
            system: 'Storm Plus OS',
            platform: 'PC Desktop Edition',
            status: 'Optimal',
            version: '2.5.0',
            developerMode: true,
          },
          null,
          2
        ),
      },
    ],
  },
  {
    id: 'root-downloads',
    name: 'Downloads',
    path: '/Downloads',
    type: 'folder',
    size: 0,
    lastModified: Date.now(),
    content: '',
    children: [],
  },
  {
    id: 'root-extracted',
    name: 'Extracted_ZIPs',
    path: '/Extracted_ZIPs',
    type: 'folder',
    size: 0,
    lastModified: Date.now(),
    content: '',
    children: [],
  },
];

export class VirtualFileSystem {
  private static files: VirtualFile[] = [];

  public static initialize(): VirtualFile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.files = JSON.parse(saved);
        return this.files;
      }
    } catch (e) {
      console.error('Failed to load VFS from localStorage', e);
    }

    this.files = DEFAULT_FILES;
    this.save();
    return this.files;
  }

  public static save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.files));
    } catch (e) {
      console.error('Failed to save VFS', e);
    }
  }

  public static getFiles(): VirtualFile[] {
    if (this.files.length === 0) {
      return this.initialize();
    }
    return this.files;
  }

  public static addFile(parentFolderPath: string, name: string, content: string, fileType: VirtualFile['fileType'] = 'text'): VirtualFile {
    const newFile: VirtualFile = {
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      path: `${parentFolderPath}/${name}`.replace('//', '/'),
      type: 'file',
      fileType,
      size: new Blob([content]).size,
      lastModified: Date.now(),
      content,
    };

    const parent = this.findFolderByPath(this.files, parentFolderPath);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(newFile);
    } else {
      // Add to root
      this.files.push(newFile);
    }

    this.save();
    return newFile;
  }

  public static addFolder(parentFolderPath: string, name: string): VirtualFile {
    const newFolder: VirtualFile = {
      id: 'folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      path: `${parentFolderPath}/${name}`.replace('//', '/'),
      type: 'folder',
      size: 0,
      lastModified: Date.now(),
      content: '',
      children: [],
    };

    const parent = this.findFolderByPath(this.files, parentFolderPath);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(newFolder);
    } else {
      this.files.push(newFolder);
    }

    this.save();
    return newFolder;
  }

  public static updateFileContent(fileId: string, content: string): boolean {
    const file = this.findFileById(this.files, fileId);
    if (file) {
      file.content = content;
      file.size = new Blob([content]).size;
      file.lastModified = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  public static deleteItem(itemId: string): boolean {
    const deleted = this.removeItemRecursive(this.files, itemId);
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  public static importZipContents(folderName: string, zipEntries: { path: string; content?: string; isDir: boolean }[]): VirtualFile {
    const targetFolder = this.addFolder('/Extracted_ZIPs', folderName);

    for (const entry of zipEntries) {
      if (entry.isDir) continue;
      const parts = entry.path.split('/').filter(Boolean);
      const fileName = parts.pop() || 'unnamed';

      let currentPath = targetFolder.path;
      for (const subDir of parts) {
        let sub = this.findFolderByPath(this.files, `${currentPath}/${subDir}`);
        if (!sub) {
          sub = this.addFolder(currentPath, subDir);
        }
        currentPath = sub.path;
      }

      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      let fileType: VirtualFile['fileType'] = 'text';
      if (['html', 'js', 'css', 'ts', 'tsx', 'jsx', 'json'].includes(ext)) fileType = 'code';
      if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) fileType = 'image';

      this.addFile(currentPath, fileName, entry.content || '', fileType);
    }

    this.save();
    return targetFolder;
  }

  private static findFolderByPath(items: VirtualFile[], path: string): VirtualFile | null {
    for (const item of items) {
      if (item.type === 'folder' && item.path === path) return item;
      if (item.children) {
        const found = this.findFolderByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  private static findFileById(items: VirtualFile[], id: string): VirtualFile | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = this.findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private static removeItemRecursive(items: VirtualFile[], id: string): boolean {
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }

    for (const item of items) {
      if (item.children && this.removeItemRecursive(item.children, id)) {
        return true;
      }
    }
    return false;
  }
}
