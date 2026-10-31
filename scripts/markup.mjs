// Adapt generated copies only; course Markdown remains the authored source.
const tabValues = {'Linux (Bash)': 'linux', 'Windows (PowerShell)': 'windows'};
const calloutTypes = {success: 'tip', note: 'note', tip: 'tip', info: 'info', warning: 'warning', danger: 'danger'};

function fenceMarker(line) {
  return line.match(/^\s*(`{3,}|~{3,})(.*)$/);
}

function nextFence(fence, match) {
  if (!match) return fence;
  if (!fence) return {character: match[1][0], length: match[1].length};
  if (match[1][0] === fence.character && match[1].length >= fence.length && !match[2].trim()) return null;
  return fence;
}

function takeIndented(lines, start) {
  const contents = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) contents.push('');
    else if (line.startsWith('    ')) contents.push(line.slice(4));
    else break;
    index += 1;
  }
  while (contents.at(-1) === '') contents.pop();
  if (!contents.length) throw new Error(`Empty markup block at line ${start}`);
  return {contents, index};
}

const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function convertBlocks(lines) {
  const output = [];
  let index = 0;
  let fence = null;
  let hasTabs = false;
  while (index < lines.length) {
    const line = lines[index];
    const marker = fenceMarker(line);
    if (fence || marker) {
      fence = nextFence(fence, marker);
      output.push(line);
      index += 1;
      continue;
    }
    if (/^=== "/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const header = lines[index].match(/^=== "([^"]+)"\s*$/);
        if (!header) break;
        const label = header[1];
        if (!tabValues[label]) throw new Error(`Unexpected tab label: ${label}`);
        if (items.some((item) => item.label === label)) throw new Error(`Duplicate tab label: ${label}`);
        const block = takeIndented(lines, index + 1);
        const converted = convertBlocks(block.contents);
        items.push({label, text: converted.text});
        index = block.index;
      }
      if (items.length !== 2) throw new Error(`An OS tab group has ${items.length} tabs; expected both OS labels`);
      output.push(`<Tabs groupId="operating-systems">\n\n${items.map(({label, text}) =>
        `<TabItem value="${tabValues[label]}" label=${JSON.stringify(label)}>\n\n${text}\n\n</TabItem>`,
      ).join('\n\n')}\n\n</Tabs>`, '');
      hasTabs = true;
      continue;
    }
    const admonition = line.match(/^(\?\?\?\+?|!!!)\s+(\w+)\s+"([^"]+)"\s*$/);
    if (admonition) {
      const block = takeIndented(lines, index + 1);
      const converted = convertBlocks(block.contents);
      hasTabs ||= converted.hasTabs;
      if (admonition[1].startsWith('???')) {
        output.push(`<details${admonition[1] === '???+' ? ' open' : ''}>\n<summary>${escapeHtml(admonition[3])}</summary>\n\n${converted.text}\n\n</details>`, '');
      } else {
        const type = calloutTypes[admonition[2]];
        if (!type) throw new Error(`Unexpected callout type: ${admonition[2]}`);
        const longest = Math.max(2, ...converted.text.split('\n').map((child) => child.match(/^(:{3,})/)?.[1].length ?? 0));
        const delimiter = ':'.repeat(longest + 1);
        output.push(`${delimiter}${type}[${admonition[3]}]\n\n${converted.text}\n\n${delimiter}`, '');
      }
      index = block.index;
      continue;
    }
    if (/^(===|\?\?\?|!!!)/.test(line)) throw new Error(`Unsupported source markup: ${line}`);
    output.push(line.replace(/\{ \.md-button(?: \.md-button--primary)? \}/g, '')
      .replaceAll('](Dockerfile)', '](Dockerfile.txt)'));
    index += 1;
  }
  if (fence) throw new Error('Unclosed fenced code block');
  return {text: output.join('\n'), hasTabs};
}

function escapeMdxProse(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const marker = fenceMarker(line);
    if (fence || marker) {
      fence = nextFence(fence, marker);
      return line;
    }
    if (/^\s*(?:<Tabs|<\/Tabs|<TabItem|<\/TabItem)/.test(line)) return line;
    return line.split(/(`+[^`]*`+)/g).map((part) =>
      part.startsWith('`') ? part : part
        .replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, '[$1]($1)')
        .replaceAll('{', '&#123;').replaceAll('}', '&#125;'),
    ).join('');
  }).join('\n');
}

function addFrontMatter(text, metadata) {
  if (text.startsWith('---\n')) {
    const end = text.indexOf('\n---\n', 4);
    if (end === -1) throw new Error('Unclosed YAML front matter');
    return `${text.slice(0, end)}\n${metadata}---\n${text.slice(end + 5)}`;
  }
  return `---\n${metadata}---\n\n${text}`;
}

export function convertMarkdown(source, relative) {
  const converted = convertBlocks(source.replace(/\r\n/g, '\n').split('\n'));
  let result = converted.text;
  if (relative === '04-building-images/check-your-understanding.md') {
    const heading = '## 4. Passing --version to two images';
    if (!result.includes(heading)) throw new Error('Legacy --version anchor heading changed; review its alias');
    result = result.replace(heading, `<a id="4-passing-version-to-two-images"></a>\n\n${heading}`);
  }
  const metadata = `${converted.hasTabs ? 'mdx:\n  format: mdx\n' : ''}${relative === 'index.md' ? 'slug: /\n' : ''}`;
  if (converted.hasTabs) result = escapeMdxProse(result);
  if (metadata) result = addFrontMatter(result, metadata);
  if (converted.hasTabs) {
    const end = result.indexOf('\n---\n', 4);
    result = `${result.slice(0, end + 5)}\nimport Tabs from '@theme/Tabs';\nimport TabItem from '@theme/TabItem';\n${result.slice(end + 5)}`;
  }
  return result;
}

export function fencedBlocks(text) {
  const blocks = [];
  let fence = null;
  let contents = [];
  let indentation = 0;
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const marker = fenceMarker(line);
    if (!fence && marker) {
      fence = nextFence(null, marker);
      indentation = line.length - line.trimStart().length;
      contents = [line.trimStart()];
    } else if (fence) {
      contents.push(line.slice(0, indentation).trim() === '' ? line.slice(indentation) : line);
      fence = nextFence(fence, marker);
      if (!fence) blocks.push(contents.join('\n'));
    }
  }
  if (fence) throw new Error('Unclosed fenced code block');
  return blocks;
}
