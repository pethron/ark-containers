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

// Chapters are numbered in order across a module's groups; optional pages are not.
const numberedChapters = (prefix, directory, sections) => {
  let count = 0;
  const entry = file => {
    const id = `${directory}/${file}`;
    if (file.startsWith('optional/')) return doc(id, `Optional: ${pageTitle(id)}`);
    count += 1;
    return doc(id, `${prefix}${count} ${pageTitle(id)}`);
  };
  return sections.flatMap(([title, files]) => [...(title ? [heading(title)] : []), ...files.map(entry)]);
};

const coreModule = (number, label, directory, sections, kata) => group(
  `${String(number).padStart(2, '0')}: ${label}`, [
    doc(`${directory}/README`, 'Overview'),
    ...numberedChapters(`${number}.`, directory, sections),
    heading('Practice'),
    doc(`${directory}/katas/README`, kata),
    doc(`${directory}/check-your-understanding`, 'Check your understanding'),
  ]);

module.exports = {
  courseSidebar: [
    doc('index', 'Start here'),
    doc('syllabus', 'Syllabus'),
    doc('before-you-start', 'Before you start'),
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
      ], 'Kata: a repeatable service change'),
      coreModule(3, 'Images and registries', '03-images-and-registries', [
        ['Images on your machine', [
          '01-find-the-image-behind-the-container',
          '02-one-image-several-names',
          '03-what-an-image-contains',
        ]],
        ['Handing an image over', ['04-transfer-an-image-locally', '05-choose-the-reference-to-hand-over']],
      ], 'Kata: artifact handover'),
      coreModule(4, 'Building images', '04-building-images', [
        ['Build a supplied recipe', ['01-package-the-service-in-an-image', '02-build-cache-and-build-context']],
        ['Write your own', [
          '03-write-the-services-dockerfile',
          '04-commands-and-signals',
          '05-dependencies-and-build-cache',
          'optional/publish-to-docker-hub',
        ]],
      ], 'Kata: a build you can hand over'),
      coreModule(5, 'Storage', '05-storage', [
        ['Keep the data', ['01-give-the-service-a-memory', '02-where-container-files-live']],
        ['Choose and protect', ['03-choose-a-volume-bind-mount-or-tmpfs', '04-back-up-and-restore-the-notes']],
      ], 'Kata: notes from the old release'),
      coreModule(6, 'Networking', '06-networking', [
        [null, ['01-connect-two-services', '02-how-the-request-finds-the-api', '03-diagnose-a-broken-connection']],
      ], 'Kata: reconnect the services'),
      coreModule(7, 'Compose', '07-compose', [
        [null, ['01-describe-the-stack-in-a-file', '02-what-compose-manages-for-you']],
      ], 'Kata: add the notes service'),
      group('Final project', [
        doc('capstone/README', 'Project brief'),
        doc('capstone/rubric', 'Rubric'),
        doc('capstone/starter/README', 'Starter files'),
        doc('capstone/starter/REPORT-template', 'Report template'),
      ]),
    ]),
    group('Advanced application workflows', [
      doc('advanced/compose-workflows/README', 'Overview'),
      ...numberedChapters('', 'advanced/compose-workflows', [[null, [
        '01-run-the-application-stack',
        '02-configuration-and-readiness',
        '03-persistence-backup-and-restore',
        '04-add-a-disposable-cache',
        '05-develop-and-rebuild',
        '06-diagnose-and-hand-over',
      ]]]),
      heading('Practice'),
      doc('advanced/compose-workflows/katas/README', 'Kata: application handover'),
      doc('advanced/compose-workflows/check-your-understanding', 'Check your understanding'),
    ]),
    group('Under the hood (optional)', [
      doc('advanced/README', 'About these deep dives'),
      group('Images and distribution', [
        ['README', 'Overview'],
        ['versioning-and-tagging-strategies', 'Versioning and tagging strategies'],
        ['image-content-and-writable-layers', 'Image content and writable layers'],
        ['digests-manifests-and-multi-arch-images', 'Digests, manifests and multi-arch images'],
        ['registry-contracts-and-authentication', 'Registry contracts and authentication'],
        ['platforms-and-execution-compatibility', 'Platforms and execution compatibility'],
      ].map(([file, label]) => doc(`advanced/images-and-distribution/${file}`, label))),
      group('Image builds', [
        ['README', 'Overview'],
        ['buildkit-stages-and-cache-mounts', 'Multi-stage builds and cache mounts'],
        ['reproducible-build-inputs', 'Reproducible build inputs'],
        ['multi-platform-builds', 'Multi-platform builds'],
      ].map(([file, label]) => doc(`advanced/image-builds/${file}`, label))),
      group('Container networking', [
        doc('advanced/container-networking/README', 'Overview'),
        doc('advanced/container-networking/bridges-ports-and-network-drivers', 'Bridges, ports and network drivers'),
      ]),
      group('Linux primitives', [
        ['README', 'Overview'],
        ['01-a-container-is-just-a-process', 'A container is just a process'],
        ['02-namespaces', 'Namespaces'],
        ['03-cgroups-v2', 'cgroups v2'],
        ['04-capabilities-seccomp-and-lsms', 'Capabilities, seccomp and LSMs'],
        ['05-root-filesystems-chroot-and-pivot-root', 'Root filesystems'],
        ['06-inspecting-namespaces-and-cgroups', 'Inspecting boundaries'],
        ['shutdown-service/README', 'Optional: application shutdown'],
        ['katas/README', 'Katas: review and manual sandbox'],
      ].map(([file, label]) => doc(`advanced/linux-primitives/${file}`, label))),
      group('Runtime architecture', [
        ['README', 'Overview'],
        ['01-the-docker-engine', 'The Docker engine'],
        ['02-containerd-and-the-shim', 'containerd and the shim'],
        ['03-runc-and-the-oci-runtime-spec', 'runc and OCI runtime'],
        ['04-oci-image-and-distribution-specs', 'OCI images and distribution'],
        ['05-cri-and-the-wider-ecosystem', 'CRI and the ecosystem'],
        ['06-docker-nerdctl-and-ctr-side-by-side', 'Optional: direct containerd clients'],
        ['katas/README', 'Kata: runtime diagnosis'],
      ].map(([file, label]) => doc(`advanced/runtime-architecture/${file}`, label))),
    ]),
    doc('glossary', 'Glossary'),
    doc('references', 'References and versions'),
    doc('preview-status', 'Preview status'),
  ],
};
