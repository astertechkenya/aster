# Aster Tech Solutions

The website for Aster Tech Solutions: web design, development and SEO from Nairobi.

A static site: plain HTML and CSS, no build step and no JavaScript yet. Netlify publishes the
`public/` folder as it is (see `netlify.toml`).

## Folders

```
aster/
├── netlify.toml          Netlify settings: publish public/, no build
├── README.md             this file (not published)
└── public/               everything the website serves
    ├── index.html        the home page
    ├── 404.html          shown for any address that doesn't exist
    ├── css/styles.css    all styles: fonts, design tokens, then each section in page order
    ├── fonts/            self-hosted Playfair Display, Inter, Roboto Condensed, IBM Plex Mono
    ├── images/work/      portfolio screenshots (640 / 960 / 1400 px wide)
    ├── favicon.svg       the star mark, dark or light to match the browser tab
    ├── apple-touch-icon.png   180×180 icon for phone home screens
    ├── robots.txt        lets search engines in
    └── _headers          security policy and caching rules for Netlify
```

## Working on it locally

From this folder:

```
python -m http.server 8000 --directory public
```

then open http://localhost:8000. Paths start with `/`, so open the page through a server like
this rather than by double-clicking the file.

## Conventions

- Mobile-first, semantic HTML, accessible by default (contrast, focus rings, reduced motion).
- Fonts are self-hosted: no requests to Google or any other third party.
- New images: WebP, in two or three widths with `srcset`, named `what-it-shows-WIDTH.webp`.

## To do

- Register the domain, then add `<link rel="canonical">`, Open Graph tags (link previews) and a sitemap.
- Confirm `hello@astertechsolutions.com` receives mail before the site goes live.
