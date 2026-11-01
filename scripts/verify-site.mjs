import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import config from '../docusaurus.config.js';
import sidebars from '../sidebars.js';
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
for (const directory of ['.site-docs', 'static']) {
  if (fs.existsSync(path.join(root, directory, 'capstone'))) throw new Error(`Withdrawn project staged in ${directory}`);
}
for (const file of files(path.join(build, 'capstone'))) {
  const route = path.relative(build, file).replaceAll('\\', '/');
  if (!Object.hasOwn(redirects, route)) throw new Error(`Withdrawn project content published: ${route}`);
}
for (const file of searchIndexes) {
  const index = JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (index.includes('/capstone/')) throw new Error(`Withdrawn project in search index: ${file}`);
}

const core = sidebars.courseSidebar.find((item) => item.label === 'Core course');
const guided = core.items.flatMap((module) => module.items
  .filter((item) => item.type === 'doc' && !item.id.endsWith('/fast-track') && !item.label.startsWith('Optional:'))
  .map((item) => item.id));
guided.push('glossary');
const routeFor = (id) => `${id.replace(/\/README$/, '')}/`;
for (let index = 0; index < guided.length; index += 1) {
  const id = guided[index];
  const html = fs.readFileSync(path.join(build, ...routeFor(id).split('/'), 'index.html'), 'utf8');
  const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag);
  for (const [direction, target] of [['prev', guided[index - 1]], ['next', guided[index + 1]]]) {
    if (!target) continue;
    const anchor = anchors.find((tag) => tag.includes(`pagination-nav__link--${direction}`));
    const href = anchor?.match(/\bhref=["']([^"']+)["']/)?.[1];
    const expected = `${config.baseUrl}${routeFor(target)}`;
    if (href !== expected) throw new Error(`${id}: guided ${direction} is ${href}, expected ${expected}`);
  }
}
console.log(`Verified ${htmlPages.length} HTML pages: noindex/nofollow, baseUrl, local links/assets, all 105 historical routes, source routes, legacy anchor, local search, project withdrawal and guided pagination.`);
