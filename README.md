# Anish Lohani — portfolio

A hand-built editorial portfolio for Anish Lohani: Biological Sciences student at
Carnegie Mellon University in Qatar, splicing researcher, and builder of bench-ware.

## Run it

**Zero setup (recommended):** just open `index.html` in a browser. The site is fully
static — animation libraries (GSAP, Lenis, SplitType) load from a CDN, and every
interaction degrades gracefully if they can't load.

**With Vite (dev server + hot reload):**

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build   # outputs to dist/
npm run preview
```

## Deploy

The build uses a relative base (`./`), so it works on any static host — GitHub Pages
(including subfolder paths), Netlify, Vercel, Cloudflare Pages — just upload the
`dist/` folder, or drop the repo into a static host that builds with Vite.

## Stack

- Plain HTML/CSS/JS + [Vite](https://vitejs.dev/) for the dev server and builds
- [GSAP](https://gsap.com/) + ScrollTrigger — scroll choreography
- [Lenis](https://github.com/darkroomengineering/lenis) — inertial smooth scrolling
- [SplitType](https://github.com/lukePeavQuinn/split-type) — word-level text reveals
- Typefaces: Instrument Serif (display), Space Grotesk (UI), IBM Plex Mono (labels)
- Two themes: warm paper (light) and lab notebook (dark), persisted to localStorage

## Structure

```
index.html           — single page, all content
blog.html            — blog page (posts fetched from a Google Doc feed)
src/style.css        — design system (tokens, themes, components)
src/main.js          — interactions (guarded; runs with or without the CDN libs)
src/blog.js          — blog feed fetcher + renderer
apps-script/Code.gs  — Google Apps Script that turns a Google Doc into a JSON feed
```

## Editing content

Everything lives in `index.html` — copy, roles, links, projects. Colour tokens and
type scale live at the top of `src/style.css`.

## Blog — auto-updating posts from a Google Doc

The blog page (`blog.html`) renders posts fetched from a Google Doc, so you can
write in Docs and the site updates without a redeploy. Two pieces:

1. **Apps Script web app** (`apps-script/Code.gs`) — reads the doc, returns JSON.
2. **Client renderer** (`src/blog.js`) — fetches the feed and builds the post cards.

### One-time setup

1. **Create the Google Doc** with this format:
   - `Heading 1` = a post title (each new Heading 1 starts a post)
   - `Heading 2` = a subheading inside a post
   - normal text = paragraphs, bulleted items = bullets
   - optional first line `DATE: 2026-08-20` shows a date on the post card
   - anything before the first Heading 1 is ignored
2. **Deploy the script**: [script.google.com](https://script.google.com) → New
   project → paste `apps-script/Code.gs` → set `DEFAULT_DOC_ID` to your doc's ID
   (the long string between `/d/` and `/edit` in the doc URL).
3. **Publish as a web app**: Deploy → New deployment → Web app → *Execute as: Me*,
   *Who has access: Anyone* → Deploy. Copy the `/exec` URL.
4. **Wire it up**: paste that URL into the `FEED_URL` constant at the top of
   `src/blog.js`. Done.

From then on: edit the doc → refresh the site → new posts. With no posts or an
unconfigured feed, the page shows the coming-soon state (with the video) instead.

Debugging: run `test()` in the Apps Script editor (View → Log) to preview the JSON,
or open the `/exec` URL directly in a browser.
