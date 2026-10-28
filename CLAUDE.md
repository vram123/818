# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static marketing site for 818 Accounting Serve (818accountingserve.com). Plain HTML, CSS and vanilla JS: no build step, package manager, linter or tests.

## Commands

- Preview: `open index.html`, or serve the root with `python3 -m http.server 8000` and visit http://localhost:8000 (use the server when checking links between pages).
- Deploy: GitHub Pages builds from the `main` branch root (repo `vram123/818`). Work happens on the `full` branch and goes live when merged into `main`. `main` holds the `CNAME` file for the custom domain; do not delete it.

## Architecture

- `index.html` must stay in the repo root because Pages serves from `/ (root)`. Every other page lives in `pages/` and references assets with `../src/...` and the home page with `../index.html`; links between subpages are bare filenames (`contact.html`).
- `src/css/styles.css` is shared by every page except `pages/coming-soon.html`, which is self-contained with inline styles. Colors are tokens on `:root` (blue and white palette).
- The header (top bar with phone and email, nav menu) and footer (logo, contact, quick links, newsletter, Instagram and LinkedIn, legal links) are duplicated in every page. A change to either must be made in `index.html` and every file in `pages/`, adjusting relative paths.
- `services.html`, `why-us.html`, `reviews.html` and `contact.html` contain the same sections as the matching sections of `index.html`, with the section `<h2>` promoted to `<h1>` and the class `page-top` added. Keep the copies in sync when editing that content.
- Service cards carry ids (`tax-preparation`, `business-taxes`, `bookkeeping`, `payroll`, `tax-planning`, `irs-notices`); the services panel in the hero links to `pages/services.html#<id>`, and `.card:target` outlines the card it lands on. Renaming an id breaks those links.
- Forms: the site has no backend, so `src/js/main.js` turns the contact form (`#contact-form`) and newsletter form (`#newsletter-form`) into `mailto:` links addressed to `CONTACT_EMAIL`.

## Content rules

- Contact details: phone 310-854-2876 (`tel:+13108542876`), email garog@818accountingserve.com. The email also appears as `CONTACT_EMAIL` in `main.js`.
- No em dashes anywhere in site copy.
- The testimonials in `index.html` and `pages/reviews.html` are marked placeholders ("Client Name"). Replace them only with real client reviews; never invent reviews.
- The Instagram and LinkedIn links still point to the generic sites, and `tax-guide.html` has a placeholder comment for Garo's credentials. Do not make up profile URLs or credentials.
