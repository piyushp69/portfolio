# Piyush Priyanshu · Portfolio

Personal portfolio site for Piyush Priyanshu, Data Analyst. It's a single page built with React 19 and Vite 8, with no UI or CSS libraries.

## Run it locally

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## Editing content

All of the site's text lives in [`src/data/portfolio.js`](src/data/portfolio.js). That includes the profile, stats, skills, projects (with live-demo links), training, certificates (with credential links), achievements, education and navigation. Components only render that data, so updating the site rarely means touching JSX.

Files in `public/` are served as-is:

| File | Purpose |
| --- | --- |
| `Piyush_Priyanshu_Resume.pdf` | Downloaded by every "Resume" button. Replace it with a new PDF of the same name. |
| `og-image.png` | 1200×630 preview shown when the link is shared on LinkedIn, X, Slack and similar. |
| `favicon.svg` | Browser tab icon. |

## Contact form

By default the form opens the visitor's mail app with their message pre-filled. To receive messages directly instead, create a form at a service that accepts JSON posts, such as [Formspree](https://formspree.io). Then set its endpoint as `VITE_CONTACT_ENDPOINT` (see [`.env.example`](.env.example)).

## Deploying

`npm run build` produces a static `dist/` folder that uses relative paths, so it works from a domain root or a sub-folder.

- **Vercel or Netlify:** import the repository. Use the build command `npm run build` and the output directory `dist`. The site URL used for link previews is detected automatically.
- **GitHub Pages:** publish `dist/` with a Pages workflow ([Vite's guide](https://vite.dev/guide/static-deploy#github-pages)). Set `SITE_URL` in the build step's environment, for example `https://piyushp69.github.io/Portfolio`.
- **Any other static host:** upload `dist/`, and set `SITE_URL` when building.

`SITE_URL` adds the canonical link and the `og:image` tag. Link previews need an absolute image URL, so those tags are left out when the URL is unknown.

## Project structure

```
src/
  data/portfolio.js      all site content
  components/            one component per section, plus Icon, Backdrop and Section/Reveal helpers
  hooks/usePortfolio.js  scroll spy, reveal-on-scroll, typewriter, bubble hover, clipboard and scroll helpers
  styles/index.css       design tokens (including the glass surfaces) and styles
public/                  resume, social preview image, favicon
```
