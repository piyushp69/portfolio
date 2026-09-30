import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Public URL of the deployed site. Link previews (LinkedIn, X, Slack...) need
// absolute URLs, so canonical and og:image tags are only emitted once it is
// known: set SITE_URL, or let Vercel / Netlify provide it during their builds.
function resolveSiteUrl(env) {
  const url =
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (env.NETLIFY === 'true' && env.URL) ||
    ''
  return url.replace(/\/+$/, '')
}

function socialMeta(siteUrl) {
  const meta = (attrs) => ({ tag: 'meta', attrs, injectTo: 'head' })

  return {
    name: 'social-meta',
    transformIndexHtml() {
      if (!siteUrl) return []
      const image = `${siteUrl}/og-image.png`
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
        meta({ property: 'og:url', content: `${siteUrl}/` }),
        meta({ property: 'og:image', content: image }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({ property: 'og:image:alt', content: 'Piyush Priyanshu, Data Analyst' }),
        meta({ name: 'twitter:image', content: image }),
      ]
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Relative asset URLs, so the build works from a domain root or a
  // sub-folder (e.g. a GitHub Pages project site) without changes.
  base: './',
  plugins: [react(), socialMeta(resolveSiteUrl(loadEnv(mode, process.cwd(), '')))],
  server: {
    port: 5173,
    open: true,
  },
}))
