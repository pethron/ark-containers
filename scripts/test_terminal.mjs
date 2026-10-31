import assert from 'node:assert/strict';
import test from 'node:test';
import {renderCapture, transcript, validateCapture} from './render_terminal.mjs';

const capture = {
  title: 'Container identity',
  capturedAt: '2026-10-31T12:00:00.000Z',
  dockerVersion: '29.6.1',
  entries: [{command: "docker inspect --format '{{.Id}}' ark-ops", output: 'sha256:abc', exitCode: 0}],
};

test('keeps the full captured text in the image description', () => {
  assert.equal(transcript(capture), "$ docker inspect --format '{{.Id}}' ark-ops\nsha256:abc");
  assert.ok(renderCapture(capture).includes(
    "<desc id=\"description\">$ docker inspect --format &apos;{{.Id}}&apos; ark-ops\nsha256:abc</desc>"));
});

test('escapes content for SVG without losing the captured text', () => {
  const input = {...capture, title: '<Captured & checked>', entries: [
    {command: 'echo "<>&"', output: '<script>&"\'', exitCode: 0},
  ]};
  const svg = renderCapture(input);
  assert.ok(svg.includes('&lt;script&gt;&amp;&quot;&apos;'));
  assert.ok(!svg.includes('<script>'));
  assert.ok(transcript(input).includes('<script>&"\''));
});

test('rejects incomplete captures and unexpected failures', () => {
  assert.throws(() => validateCapture({...capture, capturedAt: 'unknown'}));
  assert.throws(() => validateCapture({...capture, capturedAt: 42}));
  assert.throws(() => validateCapture({...capture, note: {}}));
  assert.throws(() => validateCapture({...capture, entries: []}));
  assert.throws(() => validateCapture({...capture, entries: [null]}));
  assert.throws(() => validateCapture({...capture, entries: [
    {...capture.entries[0], exitCode: 1},
  ]}));
  assert.throws(() => validateCapture({...capture, entries: [
    {...capture.entries[0], label: 42},
  ]}));
});

test('supports explicitly verified expected failures', () => {
  const input = {...capture, entries: [
    {command: 'docker exec ark-ops cat /tmp/ark-note', output: 'No such file or directory', exitCode: 1, expectedExitCode: 1},
  ]};
  assert.ok(renderCapture(input).includes('No such file or directory'));
});

test('wraps the image without truncating long captured lines', () => {
  const output = 'a'.repeat(250);
  const input = {...capture, entries: [{...capture.entries[0], output}]};
  const lines = renderCapture(input).split('\n').filter(line => line.startsWith('<text '));
  assert.equal(lines.filter(line => /a{116}</.test(line)).length, 2);
  assert.ok(transcript(input).includes(output));
});
