# Aster Tech Solutions

The website for Aster Tech Solutions: web design, development and SEO from Nairobi.

A static site: plain HTML and CSS, no build step and no JavaScript yet. Netlify publishes the
`public/` folder as it is (see `netlify.toml`).

## Folders

```
aster/
├── netlify.toml          Netlify settings: publish public/, no build
├── README.md             this file (not published)
├── tools/placer.html     drag the hero's cards into place, then copy the CSS (not published)
└── public/               everything the website serves
    ├── index.html        the home page
    ├── 404.html          shown for any address that doesn't exist
    ├── css/styles.css    fonts, design tokens, header, hero and its card stack
    ├── css/sections.css  everything below the hero: services, work, process, about, FAQ, contact, footer
    ├── fonts/            self-hosted Playfair Display, Inter, Roboto Condensed, IBM Plex Mono
    ├── images/work/      portfolio screenshots (640 / 960 / 1400 px wide)
    ├── favicon.svg       the star mark, dark or light to match the browser tab
    ├── apple-touch-icon.png   180×180 icon for phone home screens
    ├── robots.txt        lets search engines in
    └── _headers          security policy and caching rules for Netlify
```

## Working on it locally

Double-click `public/index.html`: it opens styled, because its links to the CSS, fonts and
images are relative (`css/styles.css`, not `/css/styles.css`). Keep them that way.

`404.html` is the exception: Netlify shows it at any missing address (like `/old/page`), so its
links must start with `/`. To preview it, run a local server from this folder:

```
python -m http.server 8000 --directory public
```

then open http://localhost:8000/404.html.

## Arranging the hero's cards

`tools/placer.html` opens the real home page with the cards made movable: drag to move, drag
the blue ↻ dot to tilt, scroll to resize, shift-click to bring forward. Pick a width at the top
(the phone layout has its own positions), then **Copy CSS**. From this folder:

```
python -m http.server 8000
```

then open http://localhost:8000/tools/placer.html (it can't work by double-clicking: a browser
won't let a page reach into a frame opened from the disk).

## Conventions

- Mobile-first, semantic HTML, accessible by default (contrast, focus rings, reduced motion).
- Fonts are self-hosted: no requests to Google or any other third party.
- New images: WebP, in two or three widths with `srcset`, named `what-it-shows-WIDTH.webp`.

## To do

- Register the domain, then add `<link rel="canonical">`, Open Graph tags (link previews) and a sitemap.
- Fill in the placeholders on the page: [KSh PRICE] (twice, in Services) and [X–Y] weeks (FAQ), and add your photo in About.
- Once there is a domain, consider a matching email address instead of the Gmail one.
