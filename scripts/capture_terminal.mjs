import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {writeRenderedCapture} from './render_terminal.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = process.argv.slice(2);
if (options.some(option => option !== '--verify-only')) {
  throw new Error('Usage: node scripts/capture_terminal.mjs [--verify-only]');
}
const verifyOnly = options.includes('--verify-only');
const owner = randomUUID();
const ownerLabel = 'org.ark.terminal-capture';
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'ark-terminal-'));
const containers = new Set();
const images = new Map();
const captures = [];
const projectDirectory = path.join(scratch, 'compose-stack');
let composeStarted = false;
const advancedDirectory = path.join(scratch, 'application');
const advancedProject = `arkcw-capture-${owner.slice(0, 8)}`;
const advancedArgs = ['compose', '-p', advancedProject, '-f', 'compose.yaml', '-f', 'compose.cache.yaml'];
const advancedOptions = {cwd: advancedDirectory, env: {...process.env, WEB_PORT: '8080'}};
let advancedStarted = false;
let dockerVersion;
let baseImageID;
const courseImage = 'ghcr.io/pethron/ark-message:1';

function docker(args, {cwd = root, env = process.env, expectedExitCode = 0, label, outputFilter} = {}) {
  const result = spawnSync('docker', args, {cwd, env, encoding: 'utf8', timeout: 300000, maxBuffer: 8 * 1024 * 1024});
  if (result.error) throw result.error;
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').replace(/\r\n/g, '\n').trimEnd();
  if (result.status !== expectedExitCode) {
    throw new Error(`docker ${args.join(' ')} exited ${result.status}:\n${output}`);
  }
  const quote = argument => /[\s{}]/.test(argument) ? `'${argument.replace(/'/g, "''")}'` : argument;
  return {
    command: `docker ${args.map(quote).join(' ')}`,
    output: outputFilter ? outputFilter(output) : output,
    exitCode: result.status,
    ...(expectedExitCode ? {expectedExitCode} : {}),
    ...(label ? {label} : {}),
  };
}

function unusedContainer(name) {
  if (docker(['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).output) {
    throw new Error(`Container ${name} already exists; it will not be changed`);
  }
}

function unusedImage(tag) {
  if (docker(['image', 'ls', '-q', tag]).output) {
    throw new Error(`Image tag ${tag} already exists; it will not be changed`);
  }
}

function startContainer(name, args) {
  unusedContainer(name);
  containers.add(name);
  docker(['run', '-d', '--name', name, '--label', `${ownerLabel}=${owner}`, ...args]);
}

function removeContainer(name) {
  const match = docker(['ps', '-a', '--filter', `label=${ownerLabel}=${owner}`, '--filter', `name=^/${name}$`, '--format', '{{.Names}}']).output;
  if (match) docker(['rm', '-f', name]);
  containers.delete(name);
}

function rememberImage(tag) {
  images.set(tag, docker(['image', 'inspect', '--format', '{{.Id}}', tag]).output);
}

function getResponse(route) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:8080${route}`, result => {
      let body = '';
      result.setEncoding('utf8');
      result.on('data', chunk => { body += chunk; });
      result.on('end', () => resolve({status: result.statusCode, body}));
      result.on('error', reject);
    });
    request.setTimeout(1500, () => request.destroy(Object.assign(
      new Error(`HTTP request timed out at ${route}`), {code: 'ETIMEDOUT'},
    )));
    request.on('error', reject);
  });
}

async function response(route, expected) {
  let last = 'No response';
  for (let attempt = 0; attempt < 80; attempt++) {
    let result;
    try {
      result = await getResponse(route);
    } catch (error) {
      if (!['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code)) throw error;
      last = error.message;
    }
    if (result) {
      const body = result.body;
      last = `HTTP ${result.status}: ${body}`;
      if (result.status === 200 && expected(JSON.parse(body))) return body;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Application check failed at ${route}: ${last}`);
}

function save(relative, title, entries, note) {
  const filename = path.join(root, relative);
  const capture = {title, capturedAt: new Date().toISOString(), dockerVersion, entries, ...(note ? {note} : {})};
  captures.push({filename, capture});
}

function buildExcerpt(output) {
  const lines = output.split('\n');
  const step = lines.find(line => /#\d+ \[\d+\/\d+\] RUN pip install/.test(line));
  if (!step) throw new Error('Build output did not contain the dependency installation step');
  const id = step.match(/^#\d+/)[0];
  const selected = lines.filter(line => line.startsWith(`${id} `));
  if (!selected.some(line => /\b(CACHED|DONE)\b/.test(line))) {
    throw new Error('Build output did not report the installation result');
  }
  return selected.filter(line => /\] RUN pip install|\bCACHED\b|\bDONE\b|Successfully installed/.test(line)).join('\n');
}

try {
  dockerVersion = docker(['version', '--format', '{{.Server.Version}}']).output;
  docker(['compose', 'version']);
  baseImageID = docker(['image', 'inspect', '--format', '{{.Id}}', courseImage]).output;

  startContainer('ark-message', ['-p', '127.0.0.1:8080:8000', courseImage]);
  await response('/', body => body.message === 'Hello from ARK' && typeof body.served_by === 'string');
  await response('/health', body => body.status === 'ok');
  save('01-why-containers/images/terminal-first-service.json', 'The service process and its log', [
    docker(['ps', '--filter', 'name=ark-message', '--format', 'table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}']),
    docker(['logs', 'ark-message']),
  ], 'The process listing selects the columns relevant here. HTTP was checked before capturing the log.');
  removeContainer('ark-message');

  const launchOps = message => startContainer('ark-ops', ['-e', `MESSAGE=${message}`, '-p', '127.0.0.1:8080:8000', courseImage]);
  launchOps('Ready for the next shift');
  await response('/', body => body.message === 'Ready for the next shift');
  const insideView = docker(['exec', 'ark-ops', 'ps'], {label: 'Inside the container'});
  if (!/^\s*1\s+\S+\s+\S+\s+python \/app\/app\.py$/m.test(insideView.output)) {
    throw new Error(`The server is not PID 1 inside the container:\n${insideView.output}`);
  }
  const hostView = docker(['top', 'ark-ops', '-o', 'pid,args'], {label: 'From the host'});
  const hostPid = docker(['inspect', '--format', '{{.State.Pid}}', 'ark-ops'], {label: 'The host PID Docker recorded'});
  if (hostPid.output === '1' || !new RegExp(`^${hostPid.output}\\s+python /app/app\\.py$`, 'm').test(hostView.output)) {
    throw new Error(`Host PID ${hostPid.output} does not identify the server:\n${hostView.output}`);
  }
  save('02-running-containers/images/terminal-process-ids.json', 'One server process, two PID numbers', [insideView, hostView, hostPid],
    'Captured while the server was running. Inside the container the server is PID 1; docker top and docker inspect report its PID on the host side. Your host PID will differ.');
  docker(['exec', 'ark-ops', 'sh', '-c', 'echo "A note from the shell" > /tmp/ark-note']);
  const before = docker(['inspect', '--format', '{{.Id}}', 'ark-ops'], {label: 'Before restart'});
  docker(['restart', 'ark-ops']);
  await response('/', body => body.message === 'Ready for the next shift');
  docker(['exec', 'ark-ops', 'cat', '/tmp/ark-note']);
  const restarted = docker(['inspect', '--format', '{{.Id}}', 'ark-ops'], {label: 'After restart'});
  if (before.output !== restarted.output) throw new Error('Restart changed container identity');
  docker(['stop', 'ark-ops']);
  removeContainer('ark-ops');
  launchOps('Configured replacement');
  await response('/', body => body.message === 'Configured replacement');
  const replaced = docker(['inspect', '--format', '{{.Id}}', 'ark-ops'], {label: 'After stop, remove and replacement'});
  if (before.output === replaced.output) throw new Error('Replacement retained container identity');
  docker(['exec', 'ark-ops', 'cat', '/tmp/ark-note'], {expectedExitCode: 1});
  save('02-running-containers/images/terminal-container-identity.json', 'Restart and replacement: actual container IDs', [before, restarted, replaced],
    'These are three observations around the restart and replacement steps in the chapter. Setup, HTTP checks and lifecycle commands are omitted from the image; labels identify each observation.');
  removeContainer('ark-ops');

  unusedImage('ark-message:handover');
  docker(['tag', courseImage, 'ark-message:handover']);
  rememberImage('ark-message:handover');
  const original = docker(['image', 'inspect', '--format', '{{.Id}}', courseImage]);
  const alias = docker(['image', 'inspect', '--format', '{{.Id}}', 'ark-message:handover']);
  if (original.output !== alias.output) throw new Error('Tag did not preserve image identity');
  save('03-images-and-registries/images/terminal-shared-image.json', 'Two references, one local image ID', [original, alias]);

  const hubTag = 'ark-message:hub';
  unusedImage(hubTag);
  docker(['build', '--progress=plain', '-t', hubTag, '.'], {cwd: path.join(root, '04-building-images', 'message-service')});
  rememberImage(hubTag);
  startContainer('ark-hub-check', ['-e', 'MESSAGE=A published ARK image', '-p', '127.0.0.1:8080:8000', hubTag]);
  await response('/', body => body.message === 'A published ARK image');
  await response('/health', body => body.status === 'ok');
  if (docker(['inspect', '--format', '{{json .Mounts}}', 'ark-hub-check']).output !== '[]') {
    throw new Error('Hub application check unexpectedly used a mount');
  }
  const temporaryHubTag = `ark-terminal-hub-${owner.slice(0, 8)}:lab`;
  unusedImage(temporaryHubTag);
  docker(['tag', hubTag, temporaryHubTag]);
  rememberImage(temporaryHubTag);
  if (images.get(hubTag) !== images.get(temporaryHubTag)) throw new Error('Hub handover tag changed the image');
  removeContainer('ark-hub-check');
  console.log('Hub recipe build, local tag identity, non-mounted run and HTTP verified; no login or upload attempted.');

  const template = path.join(scratch, 'template-service');
  fs.cpSync(path.join(root, '04-building-images', 'template-service'), template, {recursive: true});
  for (const tag of ['ark-template:baseline', 'ark-template:cached']) unusedImage(tag);
  const baselineArgs = ['build', '--progress=plain', '-f', 'Dockerfile.baseline', '-t', 'ark-template:baseline', '.'];
  const cachedArgs = ['build', '--progress=plain', '-t', 'ark-template:cached', '.'];
  docker(baselineArgs, {cwd: template});
  rememberImage('ark-template:baseline');
  docker(cachedArgs, {cwd: template});
  rememberImage('ark-template:cached');
  fs.appendFileSync(path.join(template, 'serve.py'), `\n# rebuild observation ${owner}\n`);
  const baseline = docker(baselineArgs, {cwd: template, label: 'Baseline after an application-only edit', outputFilter: buildExcerpt});
  rememberImage('ark-template:baseline');
  const cached = docker(cachedArgs, {cwd: template, label: 'Dependency-first recipe after the same edit', outputFilter: buildExcerpt});
  rememberImage('ark-template:cached');
  if (baseline.output.includes('CACHED') || !cached.output.includes('CACHED')) {
    throw new Error('The source-edit comparison did not invalidate only the baseline installation');
  }
  save('04-building-images/images/terminal-build-cache.json', 'Dependency installation after a source edit', [baseline, cached],
    'Only the real dependency-installation step is shown; other build steps are omitted. The edit was made in a temporary fixture copy, not in the supplied source. Timings are observations, not a speed target.');

  fs.cpSync(path.join(root, '07-compose', 'stack'), projectDirectory, {recursive: true});
  for (const name of ['ark-api-1', 'ark-web-1']) unusedContainer(name);
  for (const tag of ['ark-api:latest', 'ark-web:latest']) unusedImage(tag);
  if (docker(['network', 'ls', '--filter', 'name=^ark_default$', '--format', '{{.Name}}']).output) {
    throw new Error('Compose network ark_default already exists; it will not be changed');
  }
  fs.writeFileSync(path.join(projectDirectory, 'compose.override.yaml'), JSON.stringify({services: {
    api: {labels: {[ownerLabel]: owner}},
    web: {labels: {[ownerLabel]: owner}},
  }}));
  composeStarted = true;
  docker(['compose', 'up', '-d', '--build'], {cwd: projectDirectory});
  rememberImage('ark-api:latest');
  rememberImage('ark-web:latest');
  await response('/', body => body.backend?.status === 'ok' || body.status === 'ok');
  save('07-compose/images/terminal-compose-status.json', 'Compose starts the two-service application', [
    docker(['compose', 'ps', '--format', 'table {{.Name}}\\t{{.Service}}\\t{{.State}}\\t{{.Ports}}'], {cwd: projectDirectory}),
  ], 'The real Compose listing selects the service, state and published-port columns; HTTP was checked as well.');
  docker(['compose', 'down'], {cwd: projectDirectory});
  composeStarted = false;

  fs.cpSync(path.join(root, 'advanced', 'compose-workflows', 'application'), advancedDirectory, {
    recursive: true,
    filter: source => !['.env', 'db-password.txt', 'backups', '__pycache__'].includes(path.basename(source)),
  });
  fs.copyFileSync(path.join(advancedDirectory, 'secrets', 'db-password.example'), path.join(advancedDirectory, 'secrets', 'db-password.txt'));
  if (docker(['ps', '-a', '--filter', `label=com.docker.compose.project=${advancedProject}`, '--format', '{{.Names}}']).output
      || docker(['volume', 'ls', '--filter', `label=com.docker.compose.project=${advancedProject}`, '--format', '{{.Name}}']).output
      || docker(['network', 'ls', '--filter', `label=com.docker.compose.project=${advancedProject}`, '--format', '{{.Name}}']).output) {
    throw new Error(`Project ${advancedProject} already exists; it will not be changed`);
  }
  const config = JSON.parse(docker([...advancedArgs, 'config', '--format', 'json'], advancedOptions).output);
  const builtImages = Object.entries(config.services).filter(([, service]) => service.build)
    .map(([name, service]) => service.image ?? `${advancedProject}-${name}:latest`);
  for (const tag of builtImages) unusedImage(tag);
  advancedStarted = true;
  docker([...advancedArgs, 'up', '-d', '--build', '--wait'], advancedOptions);
  for (const tag of builtImages) rememberImage(tag);
  await response('/api/ready', body => body.ready === true);
  await response('/api/books', body => Array.isArray(body.books));
  const applicationStatus = docker([...advancedArgs, 'ps', '--format', '{{.Service}}: {{.State}} ({{.Health}}) {{.Ports}}'], advancedOptions);
  const statusLines = applicationStatus.output.split('\n').filter(Boolean);
  if (statusLines.length !== 4 || !['api', 'cache', 'db', 'proxy'].every(
    service => statusLines.some(line => line.startsWith(`${service}: running (healthy) `)),
  )) {
    throw new Error(`Expected all four application services running and healthy:\n${applicationStatus.output}`);
  }
  save('advanced/compose-workflows/images/terminal-application-stack.json', 'The database, API, cache and proxy are running', [
    applicationStatus,
  ], 'Captured from a temporary copy of the supplied application after adding the cache. The unique project name is chosen for the capture. The listing formats real service, state, health and port fields; API readiness and the book-list response were checked separately. Only the proxy publishes a host port.');

  for (const {filename, capture} of captures) {
    if (verifyOnly) {
      console.log(`Verified ${capture.title}; no image written`);
      continue;
    }
    fs.mkdirSync(path.dirname(filename), {recursive: true});
    fs.writeFileSync(filename, `${JSON.stringify(capture, null, 2)}\n`);
    writeRenderedCapture(filename);
    console.log(`Captured and rendered ${path.relative(root, filename)}`);
  }
} finally {
  const errors = [];
  const clean = operation => {
    try { operation(); } catch (error) { errors.push(error); }
  };
  if (advancedStarted) clean(() => docker([...advancedArgs, 'down', '--volumes', '--remove-orphans'], advancedOptions));
  if (composeStarted) clean(() => {
    const names = docker(['ps', '-a', '--filter', 'label=com.docker.compose.project=ark', '--format', '{{.Names}}']).output.split('\n').filter(Boolean);
    const owned = new Set(docker(['ps', '-a', '--filter', `label=${ownerLabel}=${owner}`, '--format', '{{.Names}}']).output.split('\n'));
    if (names.some(name => !owned.has(name))) throw new Error('Compose ownership changed; refusing project cleanup');
    docker(['compose', 'down'], {cwd: projectDirectory});
  });
  for (const name of containers) clean(() => removeContainer(name));
  for (const [tag, id] of images) clean(() => {
    const current = docker(['image', 'inspect', '--format', '{{.Id}}', tag]).output;
    if (current !== id) throw new Error(`Image ${tag} changed ownership; it will not be removed`);
    docker(['image', 'rm', tag]);
  });
  if (baseImageID) clean(() => {
    const current = docker(['image', 'inspect', '--format', '{{.Id}}', courseImage]).output;
    if (current !== baseImageID) throw new Error('Course image reference changed during capture');
  });
  clean(() => fs.rmSync(scratch, {recursive: true}));
  if (errors.length) throw new AggregateError(errors, 'Terminal capture cleanup failed');
}
