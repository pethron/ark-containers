module.exports = {
  title: 'ARK: Containers',
  tagline: 'A practical course on containers',
  url: 'https://pethron.github.io',
  baseUrl: '/ark-containers/',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {format: 'detect', hooks: {onBrokenMarkdownLinks: 'throw'}},
  presets: [
    ['classic', {
      docs: {
        path: '.site-docs',
        routeBasePath: '/',
        sidebarPath: require.resolve('./sidebars.js'),
        numberPrefixParser: false,
        remarkPlugins: [require('./scripts/remark-downloads.js')],
      },
      blog: false,
      pages: false,
      sitemap: false,
      theme: {customCss: require.resolve('./src/css/custom.css')},
    }],
  ],
  themes: [
    [require.resolve('@easyops-cn/docusaurus-search-local'), {
      hashed: true,
      indexBlog: false,
      docsDir: '.site-docs',
      docsRouteBasePath: '/',
      language: ['en'],
      forceIgnoreNoIndex: true,
    }],
  ],
  themeConfig: {
    metadata: [{name: 'robots', content: 'noindex, nofollow'}],
    navbar: {
      title: 'ARK: Containers',
      items: [
        {type: 'docSidebar', sidebarId: 'courseSidebar', label: 'Course', position: 'left'},
        {href: 'https://github.com/pethron/ark-containers', label: 'GitHub', position: 'right'},
      ],
    },
    colorMode: {respectPrefersColorScheme: true},
    prism: {additionalLanguages: ['bash', 'docker', 'powershell', 'toml']},
  },
};
