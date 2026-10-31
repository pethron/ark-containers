import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {convertMarkdown, fencedBlocks} from './markup.mjs';
import {isPublicEntry, publicSections, root} from './stage.mjs';
import {createProcessorUncached} from '@docusaurus/mdx-loader/lib/processor.js';
import config from '../docusaurus.config.js';
import {redirects} from './redirects.mjs';
import {withNoIndex} from './site-html.mjs';
import {verifyLocalUrl} from './site-links.mjs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require = createRequire(import.meta.url);

test('ordinary Markdown stays CommonMark; only generated home gets a slug', () => {
  const original = '# Heading\n\nA {value}, <example>, and `inline {code}`.\n';
  assert.equal(convertMarkdown(original, 'chapter.md'), original);
  assert.equal(convertMarkdown(original, 'index.md'), `---\nslug: /\n---\n\n${original}`);
});

test('nested tabs, details and checkpoints preserve fenced commands and select MDX', () => {
  const original = [
    '---', 'title: Example', '---', '',
    '???+ note "Outer & details"', '',
    '    !!! success "Checkpoint"', '',
    '        === "Linux (Bash)"', '',
    '            ??? note "Inner"', '',
    '                ````bash', '                echo "{original}"',
    '                ```', '                === "not a tab"', '                ````', '',
    '        === "Windows (PowerShell)"', '',
    '            ```powershell', '            Write-Output "{original}"', '            ```', '',
    'After {details}. Open <http://127.0.0.1:8080>. Keep `<http://literal>`.',
  ].join('\n');
  const result = convertMarkdown(original, 'nested.md');
  assert.match(result, /title: Example\nmdx:\n  format: mdx/);
  assert.equal((result.match(/import Tabs /g) ?? []).length, 1);
  assert.match(result, /<details open>\n<summary>Outer &amp; details<\/summary>/);
  assert.match(result, /:::tip\[Checkpoint\]/);
  assert.match(result, /<TabItem value="windows"/);
  assert.match(result, /After &#123;details&#125;/);
  assert.ok(result.includes('[http://127.0.0.1:8080](http://127.0.0.1:8080)'));
  assert.ok(result.includes('`<http://literal>`'));
  assert.deepEqual(fencedBlocks(result), fencedBlocks(original));
});

test('nested callouts use distinct delimiters and plain details stay CommonMark', () => {
  const result = convertMarkdown('!!! note "Outer"\n\n    !!! success "Inner"\n\n        Content.\n', 'callouts.md');
  assert.match(result, /::::note\[Outer\]/);
  assert.match(result, /:::tip\[Inner\]/);
  assert.doesNotMatch(result, /format: mdx/);
  assert.match(convertMarkdown('??? note "Answer"\n\n    Text.\n', 'details.md'), /<details>\n<summary>Answer<\/summary>/);
});

test('source markup inside long or tilde fences is untouched', () => {
  for (const marker of ['````', '~~~~']) {
    const original = `${marker}text\n\`\`\`\n=== "invalid"\n??? bad syntax\n!!! unknown "Callout"\n{ .md-button }\n](Dockerfile)\n${marker}\n`;
    assert.equal(convertMarkdown(original, 'fence.md'), original);
  }
});

test('Docusaurus compiles nested OS tabs/details and nested CommonMark callouts', async () => {
  const options = {
    siteDir: root,
    staticDirs: [path.join(root, 'static')],
    admonitions: true,
    markdownConfig: {
      anchors: {maintainCase: false},
      mdx1Compat: {comments: true},
      hooks: {onBrokenMarkdownLinks: 'throw', onBrokenMarkdownImages: 'throw'},
    },
  };
  for (const format of ['md', 'mdx']) {
    const source = format === 'md'
      ? '??? note "Answer"\n\n    !!! note "Outer"\n\n        !!! success "Inner"\n\n            Content.\n'
      : '??? note "Answer"\n\n    === "Linux (Bash)"\n\n        ??? note "Inner"\n\n            ```bash\n            echo "{command}"\n            ```\n\n    === "Windows (PowerShell)"\n\n        !!! success "Checkpoint"\n\n            ```powershell\n            Write-Output "{command}"\n            ```\n';
    const processor = await createProcessorUncached({format, options});
    const result = await processor.process({
      content: convertMarkdown(source, `example.${format}`),
      filePath: path.join(root, `example.${format}`),
      frontMatter: {},
      compilerName: 'server',
    });
    assert.match(result.content, /details/i);
    assert.match(result.content, /admonition/);
    if (format === 'mdx') {
      assert.match(result.content, /TabItem/);
      assert.match(result.content, /command/);
    }
  }
});

test('compiled downloads render file URLs without slashes while document routes retain them', async () => {
  const {transformSync} = require('@babel/core');
  function loadModule(code, dependencies) {
    const result = transformSync(code, {
      babelrc: false,
      configFile: false,
      presets: [require.resolve('@babel/preset-react')],
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    });
    const module = {exports: {}};
    new Function('require', 'module', 'exports', result.code)(dependencies, module, module.exports);
    return module.exports;
  }
  const client = path.join(path.dirname(require.resolve('@docusaurus/core/package.json')), 'lib', 'client', 'exports');
  const isInternalUrl = loadModule(fs.readFileSync(path.join(client, 'isInternalUrl.js'), 'utf8'), require).default;
  const RouterLink = ({to, children}) => React.createElement('a', {href: to}, children);
  // Render the actual Docusaurus Link; only site/router hooks are supplied by the test.
  const Link = loadModule(fs.readFileSync(path.join(client, 'Link.js'), 'utf8'), (name) => {
    const dependencies = {
      'react-router-dom': {Link: RouterLink, NavLink: RouterLink},
      './useDocusaurusContext': () => ({siteConfig: {...config, future: {experimental_router: 'browser'}}}),
      './isInternalUrl': isInternalUrl,
      './ExecutionEnvironment': {canUseIntersectionObserver: false, canUseDOM: false},
      './useBrokenLinks': () => ({collectLink() {}, collectAnchor() {}}),
      './useBaseUrl': {useBaseUrlUtils: () => ({withBaseUrl: (url) =>
        url.startsWith(config.baseUrl) ? url : `${config.baseUrl}${url.replace(/^\//, '')}`})},
    };
    return dependencies[name] ?? require(name);
  }).default;
  const source = [
    '[JSON](@site/scripts/legacy-routes.json?download=1#capture)',
    '[Text](@site/04-building-images/template-service/requirements.txt)',
    '[YAML](@site/07-compose/stack/compose.yaml)',
    '[Document](/lesson)',
  ].join('\n\n');
  for (const format of ['md', 'mdx']) {
    const processor = await createProcessorUncached({
      format,
      options: {
        siteDir: root,
        staticDirs: [path.join(root, 'static')],
        remarkPlugins: config.presets[0][1].docs.remarkPlugins,
        markdownConfig: {
          anchors: {maintainCase: false},
          mdx1Compat: {comments: true},
          hooks: {onBrokenMarkdownLinks: 'throw', onBrokenMarkdownImages: 'throw'},
        },
      },
    });
    const compiled = await processor.process({
      content: source,
      filePath: path.join(root, `downloads.${format}`),
      frontMatter: {},
      compilerName: 'server',
    });
    assert.match(compiled.content, /pathname:\/\//);
    const MDX = loadModule(compiled.content, (name) => {
      if (name === '@mdx-js/react') return {useMDXComponents: () => ({})};
      if (name.includes('file-loader')) {
        const extension = name.match(/\.(json|txt|yaml)(?:\?|$)/)?.[1];
        assert.ok(extension, `Unexpected asset require: ${name}`);
        return {default: `${config.baseUrl}assets/files/fixture.${extension}${name.includes('?download=1') ? '?download=1' : ''}`};
      }
      return require(name);
    }).default;
    const html = renderToStaticMarkup(React.createElement(MDX, {components: {a: Link}}));
    assert.ok(html.includes('href="/ark-containers/assets/files/fixture.json?download=1#capture"'), html);
    for (const extension of ['txt', 'yaml']) assert.ok(html.includes(`href="/ark-containers/assets/files/fixture.${extension}"`), html);
    assert.ok(html.includes('href="/ark-containers/lesson/"'), html);
    assert.doesNotMatch(html, /fixture\.(?:json|txt|yaml)\//);
  }
});

test('output verifier rejects trailing-slash files without treating dotted document routes as assets', () => {
  const build = path.join(root, 'build');
  const file = {isFile: () => true, isDirectory: () => false};
  const directory = {isFile: () => false, isDirectory: () => true};
  const entries = new Map([
    ...['capture.json', 'requirements.txt', 'compose.yaml', 'Dockerfile'].map((name) => [path.resolve(build, 'assets', name), file]),
    [path.resolve(build, 'lesson.v1'), directory],
    [path.resolve(build, 'lesson.v1', 'index.html'), file],
  ]);
  const options = {
    build, baseUrl: config.baseUrl, source: 'generated.html',
    stat: (target) => {
      if (entries.has(target)) return entries.get(target);
      throw Object.assign(new Error('missing'), {code: 'ENOENT'});
    },
  };
  for (const name of ['capture.json', 'requirements.txt', 'compose.yaml', 'Dockerfile']) {
    const url = `${config.baseUrl}assets/${name}`;
    assert.doesNotThrow(() => verifyLocalUrl(`${url}?download=1#section`, options));
    for (const suffix of ['/', '/?download=1#section', '%2F']) {
      assert.throws(() => verifyLocalUrl(`${url}${suffix}`, options), /File asset URL has trailing slash/);
    }
  }
  assert.doesNotThrow(() => verifyLocalUrl(`${config.baseUrl}lesson.v1/`, options));
  assert.throws(() => verifyLocalUrl(`${config.baseUrl}missing.json`, options), /Missing generated/);
});

test('malformed markup fails visibly instead of silently dropping content', () => {
  assert.throws(() => convertMarkdown('=== "Linux (Bash)"\n\n    Text.\n', 'bad.md'), /expected both/);
  assert.throws(() => convertMarkdown('=== "Other"\n\n    Text.\n', 'bad.md'), /Unexpected tab/);
  assert.throws(() => convertMarkdown('??? missing title\n', 'bad.md'), /Unsupported/);
  assert.throws(() => convertMarkdown('```sh\ntrue\n', 'bad.md'), /Unclosed/);
});

test('legacy version anchor is an alias, leaving the original heading intact', () => {
  const original = '## 4. Passing --version to two images\n\nAnswer.\n';
  const result = convertMarkdown(original, '04-building-images/check-your-understanding.md');
  assert.match(result, /id="4-passing-version-to-two-images"/);
  assert.ok(result.includes(original));
});

test('public staging excludes hidden files, caches, private sources and secrets', () => {
  for (const directory of ['.git', '__pycache__', 'node_modules', 'sources', 'private', 'secrets']) {
    assert.equal(isPublicEntry(directory, true), false, directory);
  }
  for (const file of ['.env', '.env.example', 'Dockerfile.secret', 'credentials.json', 'api-token.txt', 'private.pem', 'app.pyc', 'backup.tar', 'id_rsa']) {
    assert.equal(isPublicEntry(file, false), false, file);
  }
  for (const file of ['README.md', 'Dockerfile', 'Dockerfile.multistage', 'app.py', 'compose.yaml', 'package.json', 'diagram.svg']) {
    assert.equal(isPublicEntry(file, false), true, file);
  }
});

test('production config keeps Pages and localhost paths, private indexing and strict links', () => {
  assert.equal(config.baseUrl, '/ark-containers/');
  assert.equal(config.trailingSlash, true);
  assert.equal(config.onBrokenLinks, 'throw');
  assert.equal(config.onBrokenAnchors, 'throw');
  assert.equal(config.markdown.hooks.onBrokenMarkdownLinks, 'throw');
  assert.ok(config.themeConfig.metadata.some(({name, content}) => name === 'robots' && content === 'noindex, nofollow'));
  assert.equal(config.presets[0][1].sitemap, false);
  const search = config.themes[0][1];
  assert.equal(search.docsDir, '.site-docs');
  assert.equal(search.forceIgnoreNoIndex, true);
  const packages = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(packages.scripts.start, /stage && docusaurus start --host 127\.0\.0\.1/);
  assert.match(packages.scripts.serve, /--host 127\.0\.0\.1 --port 4173/);
});

test('noindex sanitizer covers normal/error/search and implicit-head application HTML', () => {
  for (const html of [
    '<html><head><title>Search</title></head><body></body></html>',
    '<html><head><meta name="robots" content="index, follow"></head><body>404</body></html>',
    '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<title>UI</title>\n<h1>UI</h1>',
  ]) {
    const result = withNoIndex(html);
    assert.ok(result.includes('<meta name="robots" content="noindex, nofollow">'));
    assert.equal((result.match(/name="robots"/g) ?? []).length, 1);
    assert.equal(withNoIndex(result), result);
    assert.doesNotMatch(result, /content="index, follow"/);
  }
  assert.throws(() => withNoIndex('not HTML'), /neither/);
});

test('all 105 historical routes have source pages, intentional placeholders or redirects', () => {
  const routes = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'legacy-routes.json'), 'utf8'));
  assert.equal(routes.length, 105);
  assert.equal(new Set(routes).size, 105);
  for (const route of routes) {
    if (['08-security/index.html', '09-production-and-troubleshooting/index.html'].includes(route)) continue;
    if (redirects[route]) {
      const parts = redirects[route].split('/').filter(Boolean);
      const sources = [path.join(root, ...parts), path.join(root, 'web', ...parts)];
      assert.ok(sources.some((destination) => fs.existsSync(`${destination}.md`) || fs.existsSync(path.join(destination, 'README.md'))), `Redirect has no source: ${route}`);
      continue;
    }
    const relative = route === 'index.html' ? 'index.md' : route.replace(/\/index\.html$/, '.md');
    const overview = route.replace(/index\.html$/, 'README.md');
    const candidates = [
      path.join(root, 'web', relative),
      path.join(root, relative),
      path.join(root, overview),
    ];
    assert.ok(candidates.some((file) => fs.existsSync(file)), `Historical route has no source: ${route}`);
  }
});

test('all current public source pages preserve every fenced code block', () => {
  let pages = 0;
  function visit(directory, relative = '') {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      if (!isPublicEntry(entry.name, entry.isDirectory())) continue;
      const source = path.join(directory, entry.name);
      const target = path.join(relative, entry.name);
      if (entry.isDirectory()) visit(source, target);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const original = fs.readFileSync(source, 'utf8');
        const result = convertMarkdown(original, target.replaceAll('\\', '/'));
        assert.deepEqual(fencedBlocks(result), fencedBlocks(original), target);
        pages += 1;
      }
    }
  }
  visit(path.join(root, 'web'));
  for (const section of publicSections) visit(path.join(root, section), section);
  assert.ok(pages >= 100, `Unexpected source coverage: ${pages}`);
});
