import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {convertMarkdown, fencedBlocks} from './markup.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const publicSections = [
  '01-why-containers', '02-running-containers', '03-images-and-registries',
  '04-building-images', '05-storage', '06-networking', '07-compose',
  'advanced', 'capstone',
];
const excludedDirectories = new Set(['__pycache__', 'node_modules', 'sources', 'private', 'secrets']);
const publicExtensions = new Set(['.md', '.py', '.sh', '.ps1', '.mjs', '.js', '.html', '.css', '.json', '.yaml', '.yml', '.txt', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif']);

export function isPublicEntry(name, isDirectory) {
  if (name.startsWith('.') || /(?:^|[._-])(?:secrets?|credentials?|tokens?|passwords?)(?:[._-]|$)/i.test(name)) return false;
  if (isDirectory) return !excludedDirectories.has(name.toLowerCase());
  return publicExtensions.has(path.extname(name).toLowerCase()) || /^Dockerfile(?:[.-][a-z-]+)?$/.test(name);
}

export function stage(course = root) {
  const docs = path.join(course, '.site-docs');
  const staticDir = path.join(course, 'static');
  for (const target of [docs, staticDir]) {
    if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error(`Refusing generated symlink: ${target}`);
    fs.rmSync(target, {recursive: true, force: true});
    fs.mkdirSync(target, {recursive: true});
  }
  let markdownFiles = 0;
  const excluded = [];
  function copyTree(source, relative = '') {
    for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
      const outputPath = path.join(relative, entry.name);
      if ((!entry.isFile() && !entry.isDirectory()) || !isPublicEntry(entry.name, entry.isDirectory())) {
        excluded.push(outputPath);
        continue;
      }
      const sourcePath = path.join(source, entry.name);
      if (entry.isDirectory()) {
        copyTree(sourcePath, outputPath);
      } else if (entry.name.endsWith('.md')) {
        const original = fs.readFileSync(sourcePath, 'utf8');
        const adapted = convertMarkdown(original, outputPath.replaceAll('\\', '/'));
        if (JSON.stringify(fencedBlocks(original)) !== JSON.stringify(fencedBlocks(adapted))) {
          throw new Error(`Source command changed while staging ${outputPath}`);
        }
        const destination = path.join(docs, outputPath);
        fs.mkdirSync(path.dirname(destination), {recursive: true});
        fs.writeFileSync(destination, adapted);
        markdownFiles += 1;
      } else {
        for (const target of [docs, staticDir]) {
          const destination = path.join(target, outputPath);
          fs.mkdirSync(path.dirname(destination), {recursive: true});
          fs.copyFileSync(sourcePath, destination);
          if (entry.name === 'Dockerfile') fs.copyFileSync(sourcePath, `${destination}.txt`);
        }
      }
    }
  }
  // Only these top-level paths are eligible; the repository root is never copied.
  const web = path.join(course, 'web');
  if (fs.lstatSync(web).isSymbolicLink()) throw new Error(`Refusing public web symlink: ${web}`);
  copyTree(web);
  for (const section of publicSections) {
    const source = path.join(course, section);
    if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Refusing public section symlink: ${source}`);
    copyTree(source, section);
  }
  // Retain the historical placeholder URLs without publishing unfinished modules.
  for (const section of ['08-security', '09-production-and-troubleshooting']) {
    const destination = path.join(docs, section, 'README.md');
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, `# ${section.slice(3).replaceAll('-', ' ')}\n\nThis module is in preparation.\n\n[Return to the first module](../01-why-containers/README.md).\n`);
    markdownFiles += 1;
  }
  console.log(`Staged ${markdownFiles} Markdown pages; all source fenced blocks preserved. Excluded ${excluded.length} non-public/cache/editor files.`);
  return {markdownFiles, excluded};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) stage();
