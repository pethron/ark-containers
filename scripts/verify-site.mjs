import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import config from '../docusaurus.config.js';
import {redirects} from './redirects.mjs';
import {withNoIndex} from './site-html.mjs';
import {verifyLocalUrl} from './site-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function files(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
const build = path.join(root, 'build');
for (const [route, destination] of Object.entries(redirects)) {
  const target = path.join(build, ...destination.split('/'), 'index.html');
  if (!fs.existsSync(target)) throw new Error(`Missing redirect destination: ${destination}`);
  const output = path.join(build, ...route.split('/'));
  const url = `${config.baseUrl}${destination}`;
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta http-equiv="refresh" content="0;url=${url}"><link rel="canonical" href="${url}"><title>Page moved</title></head><body><a href="${url}">Continue to the current chapter</a><script>location.replace(${JSON.stringify(url)} + location.search + location.hash)</script></body></html>`);
}
const legacyRoutes = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'legacy-routes.json'), 'utf8'));
if (legacyRoutes.length !== 105 || new Set(legacyRoutes).size !== 105) throw new Error('Invalid historical route fixture');
for (const route of legacyRoutes) {
  if (!fs.existsSync(path.join(build, ...route.split('/')))) throw new Error(`Missing historical page route: ${route}`);
}
const htmlPages = files(build).filter((file) => file.endsWith('.html'));
if (!htmlPages.length) throw new Error('Build produced no HTML pages');
// Downloadable application HTML bypasses the Docusaurus theme metadata.
for (const file of htmlPages) {
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, withNoIndex(html));
}
for (const file of htmlPages) {
  const html = fs.readFileSync(file, 'utf8');
  const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/gi) ?? [];
  if (!robots.some((meta) => /content=["']noindex,\s*nofollow["']/.test(meta))) {
    throw new Error(`Missing noindex/nofollow: ${file}`);
  }
  for (const match of html.matchAll(/(?:href|src)=["'](\/[^"'#]*)["']/g)) {
    verifyLocalUrl(match[1], {build, baseUrl: config.baseUrl, source: file});
  }
}
for (const file of files(path.join(root, '.site-docs')).filter((target) => target.endsWith('.md'))) {
  let relative = path.relative(path.join(root, '.site-docs'), file);
  relative = relative === 'index.md' ? 'index.html' : relative.replace(/README\.md$/, 'index.html').replace(/\.md$/, `${path.sep}index.html`);
  if (!fs.existsSync(path.join(build, relative))) throw new Error(`Missing original page route: ${relative}`);
}
for (const special of ['404.html', path.join('search', 'index.html')]) {
  if (!fs.existsSync(path.join(build, special))) throw new Error(`Missing special page: ${special}`);
}
const compatibility = fs.readFileSync(path.join(build, '04-building-images', 'check-your-understanding', 'index.html'), 'utf8');
if (!compatibility.includes('id="4-passing-version-to-two-images"')) throw new Error('Legacy --version anchor missing');
const searchIndexes = files(build).filter((file) => /search-index.*\.json$/.test(path.basename(file)));
if (!searchIndexes.length || !searchIndexes.some((file) => fs.statSync(file).size > 1000)) throw new Error('Local search index missing or empty');
console.log(`Verified ${htmlPages.length} HTML pages: noindex/nofollow, baseUrl, local links/assets, all 105 historical routes, source routes, legacy anchor and local search.`);
