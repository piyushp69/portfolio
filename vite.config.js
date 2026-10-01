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
  build: {
    // Keep fonts as files even when tiny: inlined into the CSS they would
    // delay first paint, and only the subsets a page needs get downloaded.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
    // three.js (~710 kB) and React Three Fiber load lazily with the About
    // section's 3D sphere as the section comes into view, never on first
    // paint. The warning is for chunks on the critical path.
    chunkSizeWarningLimit: 750,
    rolldownOptions: {
      // Debug logging is dropped from production builds; warnings and errors
      // stay, so real problems still show in the console.
      treeshake: { manualPureFunctions: ['console.log', 'console.info', 'console.debug'] },
      output: {
        // Libraries in their own chunks, so a content or style change doesn't
        // make returning visitors download them again. React and Motion load
        // with the page; three.js and React Three Fiber only with the sphere.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion)[\\/]/ },
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            {
              name: 'react-three',
              test: /node_modules[\\/](@react-three|zustand|its-fine|react-use-measure|suspend-react|use-sync-external-store)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
}))
