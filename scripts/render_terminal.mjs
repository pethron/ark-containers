import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function validateCapture(capture) {
  if (!capture || typeof capture.title !== 'string' || !capture.title.trim()
      || typeof capture.capturedAt !== 'string' || !Number.isFinite(Date.parse(capture.capturedAt))
      || typeof capture.dockerVersion !== 'string' || !capture.dockerVersion
      || (capture.note !== undefined && typeof capture.note !== 'string')
      || !Array.isArray(capture.entries) || !capture.entries.length) {
    throw new Error('Capture needs a title, capture date, Docker version and entries');
  }
  for (const entry of capture.entries) {
    if (!entry || typeof entry.command !== 'string' || !entry.command
        || typeof entry.output !== 'string'
        || (entry.label !== undefined && typeof entry.label !== 'string')
        || !Number.isInteger(entry.exitCode)
        || entry.exitCode !== (entry.expectedExitCode ?? 0)) {
      throw new Error(`Invalid or failed captured command: ${entry?.command}`);
    }
  }
}

const escape = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
})[character]);

export function transcript(capture) {
  validateCapture(capture);
  return capture.entries.map(entry => [
    ...(entry.label ? [`[${entry.label}]`] : []),
    `$ ${entry.command}`,
    entry.output,
  ].filter(Boolean).join('\n')).join('\n\n');
}

export function renderCapture(capture) {
  validateCapture(capture);
  const rows = [];
  for (const entry of capture.entries) {
    if (rows.length) rows.push({text: '', color: '#dbe4ee'});
    if (entry.label) rows.push({text: entry.label, color: '#94a3b8'});
    rows.push({text: `$ ${entry.command}`, color: '#5eead4'});
    for (const line of entry.output.split('\n')) {
      rows.push({text: line.replace(/\t/g, '    '), color: '#dbe4ee'});
    }
  }
  const wrapped = rows.flatMap(row => {
    const lines = [];
    const text = row.text || ' ';
    for (let offset = 0; offset < text.length; offset += 116) {
      lines.push({...row, text: text.slice(offset, offset + 116)});
    }
    return lines;
  });
  const width = Math.max(700, Math.min(116, Math.max(...wrapped.map(row => row.text.length))) * 8.5 + 48);
  const height = 98 + wrapped.length * 22;
  const footer = `${capture.capturedAt.slice(0, 10)} | Docker ${capture.dockerVersion} | IDs and times may differ`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${escape(capture.title)}</title>
<desc id="description">${escape(transcript(capture))}</desc>
<rect width="${width}" height="${height}" rx="12" fill="#0c1220"/>
<path d="M0 44H${width}" stroke="#334155"/>
<text x="24" y="28" fill="#cbd5e1" font-family="Consolas,monospace" font-size="15">${escape(capture.title)}</text>
${wrapped.map((row, index) => `<text x="24" y="${70 + index * 22}" fill="${row.color}" font-family="Consolas,monospace" font-size="14" xml:space="preserve">${escape(row.text)}</text>`).join('\n')}
<text x="24" y="${height - 15}" fill="#94a3b8" font-family="Consolas,monospace" font-size="12">${escape(footer)}</text>
</svg>
`;
}

export function writeRenderedCapture(filename) {
  const capture = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const base = filename.replace(/\.json$/, '');
  if (base === filename) throw new Error('Capture filename must end in .json');
  fs.writeFileSync(`${base}.svg`, renderCapture(capture));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filenames = process.argv.slice(2);
  if (!filenames.length) {
    throw new Error('Usage: node scripts/render_terminal.mjs <capture.json> [capture.json ...]');
  }
  for (const filename of filenames) {
    writeRenderedCapture(path.resolve(filename));
    console.log(`Rendered ${path.basename(filename)}`);
  }
}
