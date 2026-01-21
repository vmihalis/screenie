import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'screenie',
  description: 'Capture responsive screenshots across 57 device viewports',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:title', content: 'screenie Documentation' }],
    ['meta', { property: 'og:description', content: 'Capture responsive screenshots across 57 device viewports' }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'CLI Reference', link: '/cli-reference' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'CLI Reference', link: '/cli-reference' },
          { text: 'Examples', link: '/examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vmihalis/responsiveness-mcp' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present'
    }
  }
})
