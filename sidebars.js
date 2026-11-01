const fs = require('node:fs');
const path = require('node:path');

const doc = (id, label) => ({type: 'doc', id, label});
const group = (label, items) => ({type: 'category', label, collapsed: true, items});
const heading = label => ({type: 'html', value: label, className: 'sidebar-group-heading', defaultStyle: true});

// Sidebar labels come from each page's title, so the two cannot drift apart.
const pageTitle = id => {
  const source = fs.readFileSync(path.join(__dirname, `${id}.md`), 'utf8');
  const match = source.match(/^title:\s*"((?:[^"\\]|\\.)*)"\s*$/m);
  if (!match) throw new Error(`Missing quoted title in ${id}.md`);
  return match[1].replace(/\\"/g, '"');
};

// Chapters are numbered in order across a module's groups; optional pages and
// ready-made doc entries are not.
const numberedChapters = (prefix, directory, sections) => {
  let count = 0;
  const entry = file => {
    if (typeof file === 'object') return file;
    const id = file.startsWith('advanced/') ? file : `${directory}/${file}`;
    if (file.startsWith('optional/')) return doc(id, `Optional: ${pageTitle(id)}`);
    count += 1;
    return doc(id, `${prefix}${count} ${pageTitle(id)}`);
  };
  return sections.flatMap(([title, files]) => [...(title ? [heading(title)] : []), ...files.map(entry)]);
};

// Deep dives sit in the module whose work raises their question, unnumbered and collapsed.
const deepDive = (label, directory, pages) => group(label, pages.map(([file, title]) => doc(`advanced/${directory}/${file}`, title)));
const underTheHood = dives => dives.length ? [group('Under the hood (optional)', dives)] : [];

const coreModule = (number, label, directory, sections, kata, dives = [], practice = [
  doc(`${directory}/katas/README`, kata),
  doc(`${directory}/check-your-understanding`, 'Check your understanding'),
]) => group(
  `${String(number).padStart(2, '0')}: ${label}`, [
    doc(`${directory}/README`, 'Overview'),
    doc(`${directory}/fast-track`, 'Fast track'),
    ...numberedChapters(`${number}.`, directory, sections),
    ...underTheHood(dives),
    heading('Practice'),
    ...practice,
  ]);

// The application lives under advanced/ so its fixture paths and doc ids stay stable.
const app = file => `advanced/compose-workflows/${file}`;

module.exports = {
  courseSidebar: [
    doc('index', 'Start here'),
    doc('syllabus', 'Syllabus'),
    doc('before-you-start', 'Before you start'),
    doc('advanced/README', 'About the deep dives'),
    group('Core course', [
      coreModule(1, 'Why containers', '01-why-containers', [
        [null, ['01-the-problem-containers-solve']],
        ['Your first container', ['03-your-first-application', '04-make-it-yours', '05-running-but-unreachable']],
        ['What a container is', [
          '06-from-physical-servers-to-virtual-machines',
          '07-a-short-history-of-isolation-chroot-to-oci',
          '08-virtual-machines-vs-containers',
        ]],
      ], 'Kata: a service handover'),
      coreModule(2, 'Running containers', '02-running-containers', [
        ['Inside a running container', ['01-pick-up-the-service', '02-inside-the-running-container']],
        ['The container lifecycle', ['03-restarting-isnt-replacing', '04-stopping-a-service', '05-choose-the-fix']],
        ['How it works', ['06-from-docker-run-to-a-process', '07-namespaces-and-cgroups']],
      ], 'Kata: a repeatable service change', [
        deepDive('Linux boundaries', 'linux-primitives', [
          ['02-namespaces', 'Namespaces in detail'],
          ['03-cgroups-v2', 'cgroups v2 in detail'],
          ['shutdown-service/README', 'Optional: application shutdown'],
        ]),
      ]),
      coreModule(3, 'Images and registries', '03-images-and-registries', [
        ['Images on your machine', [
          '01-find-the-image-behind-the-container',
          '02-one-image-several-names',
          '04-transfer-an-image-locally',
        ]],
        ['How it works', [
          '03-what-an-image-contains',
          '05-choose-the-reference-to-hand-over',
          '06-how-a-registry-serves-an-image',
        ]],
      ], 'Kata: artifact handover', [
        deepDive('Images and distribution', 'images-and-distribution', [
          ['README', 'Overview'],
          ['versioning-and-tagging-strategies', 'Versioning and tagging strategies'],
          ['digests-manifests-and-multi-arch-images', 'Digests, manifests and multi-arch images'],
          ['registry-contracts-and-authentication', 'Registry contracts and authentication'],
          ['platforms-and-execution-compatibility', 'Platforms and execution compatibility'],
        ]),
        deepDive('Image standards', 'runtime-architecture', [
          ['04-oci-image-and-distribution-specs', 'OCI images and distribution'],
        ]),
      ]),
      coreModule(4, 'Building images', '04-building-images', [
        ['Build a supplied recipe', ['01-package-the-service-in-an-image', '02-build-cache-and-build-context']],
        ['Write your own', [
          '03-write-the-services-dockerfile',
          '05-dependencies-and-build-cache',
          '04-commands-and-signals',
        ]],
        ['How it works', ['06-what-buildkit-does']],
        ['Optional publishing', ['optional/publish-to-docker-hub']],
      ], 'Kata: a build you can hand over', [
        deepDive('Image builds', 'image-builds', [
          ['README', 'Overview'],
          ['buildkit-stages-and-cache-mounts', 'Multi-stage builds and cache mounts'],
          ['reproducible-build-inputs', 'Reproducible build inputs'],
        ]),
      ]),
      coreModule(5, 'Storage', '05-storage', [
        ['Keep the data', ['01-give-the-service-a-memory']],
        ['Choose and protect', ['03-choose-a-volume-bind-mount-or-tmpfs', '04-back-up-and-restore-the-notes']],
        ['How it works', ['02-where-container-files-live', '05-how-a-mount-appears']],
      ], 'Kata: notes from the old release', [
        deepDive('Image layers', 'images-and-distribution', [
          ['image-content-and-writable-layers', 'Image content and writable layers'],
        ]),
      ]),
      coreModule(6, 'Networking', '06-networking', [
        ['Connect and diagnose', ['01-connect-two-services', '03-diagnose-a-broken-connection']],
        ['How it works', ['02-how-the-request-finds-the-api', '04-bridges-and-published-ports']],
      ], 'Kata: reconnect the services', [
        deepDive('Container networking', 'container-networking', [
          ['README', 'Overview'],
          ['bridges-ports-and-network-drivers', 'Bridges, ports and network drivers'],
        ]),
      ]),
      coreModule(7, 'Compose', '07-compose', [
        ['Start the stack', ['01-describe-the-stack-in-a-file']],
        ['How it works', ['02-what-compose-manages-for-you', '03-what-compose-asks-the-engine']],
        ['Try the small stack', [
          doc('07-compose/katas/README', 'Kata: add the notes service'),
          doc('07-compose/check-your-understanding', 'Check your understanding: the small stack'),
        ]],
        ['Compose in practice', [
          doc(app('README'), 'The reading-list application'),
          app('01-run-the-application-stack'),
          app('02-configuration-and-readiness'),
          app('03-persistence-backup-and-restore'),
          app('04-add-a-disposable-cache'),
          app('05-develop-and-rebuild'),
          app('06-diagnose-and-hand-over'),
        ]],
      ], 'Kata: add the notes service', [], [
        doc(app('katas/README'), 'Kata: application handover'),
        doc(app('check-your-understanding'), 'Check your understanding: the application'),
      ]),
    ]),
    doc('glossary', 'Glossary'),
    doc('references', 'References and versions'),
    doc('preview-status', 'Preview status'),
  ],
};
