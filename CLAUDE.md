# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static marketing site for 818 Accounting Serve (818accountingserve.com). Plain HTML, CSS and vanilla JS: no build step, package manager, linter or tests.

## Commands

- Chat API locally: `cd worker && npx wrangler dev --port 8787` (needs `worker/.dev.vars` with `GEMINI_API_KEY`).
- Preview: `open index.html`, or serve the root with `python3 -m http.server 8000` and visit http://localhost:8000 (use the server when checking links between pages).
- Deploy: GitHub Pages builds from the `main` branch root (repo `vram123/818`). Work happens on the `full` branch and goes live when merged into `main`. `main` holds the `CNAME` file for the custom domain; do not delete it.

## Architecture

- `index.html` must stay in the repo root because Pages serves from `/ (root)`. Every other page lives in `pages/` and references assets with `../src/...` and the home page with `../index.html`; links between subpages are bare filenames (`contact.html`).
- `src/css/styles.css` is shared by every page except `pages/coming-soon.html`, which is self-contained with inline styles. Colors are tokens on `:root` (blue and white palette).
- The header (top bar with phone and email, nav menu) and footer (logo, contact, quick links, newsletter, Instagram and LinkedIn, legal links) are duplicated in every page. A change to either must be made in `index.html` and every file in `pages/`, adjusting relative paths.
- `services.html`, `why-us.html`, `reviews.html` and `contact.html` contain the same sections as the matching sections of `index.html`, with the section `<h2>` promoted to `<h1>` and the class `page-top` added. Keep the copies in sync when editing that content.
- Service cards carry ids (`tax-preparation`, `business-taxes`, `bookkeeping`, `payroll`, `tax-planning`, `irs-notices`); the services panel in the hero links to `pages/services.html#<id>`, and `.card:target` outlines the card it lands on. Renaming an id breaks those links.
- `.env` is gitignored and `.env.example` is its committed template. Pages are static, so nothing in the site reads `.env`; never put secrets in HTML or JS, since Pages publishes every committed file.
- Chat assistant (named **Taxo** in the widget header, greeting and `SYSTEM_PROMPT`): `src/js/chat.js` (loaded on every page except `coming-soon.html`) builds the widget and POSTs `{messages:[{role,content}]}` to `CHAT_API_URL`; on localhost it uses `http://localhost:8787`. `worker/src/index.js` is a Cloudflare Worker that holds `GEMINI_API_KEY` (Worker secret in production, `worker/.dev.vars` locally) and calls the Gemini **Interactions API** (`/v1beta/interactions`, not `generateContent`: older models return 404 for this key). It tries `MODELS` in order on 404/429/503, only accepts origins in `ALLOWED_ORIGINS`, and the assistant's behavior (general answers, refer complex questions to Garo, stay on topic) is `SYSTEM_PROMPT`. Run with `cd worker && npx wrangler dev --port 8787`; deploy with `npx wrangler deploy`.
- Forms: the site has no backend, so `src/js/main.js` turns the contact form (`#contact-form`) and newsletter form (`#newsletter-form`) into `mailto:` links addressed to `CONTACT_EMAIL`.
- Free consultation: the home page "Free Consultation" button opens `pages/consultation.html`, a one-question-at-a-time questionnaire run by `src/js/consultation.js` (loaded only there, after `main.js` because it uses `CONTACT_EMAIL`). Steps are `.step` elements; `data-if-work` shows a step only for matching "work" answers. The income slider's tax estimate uses the `TAX` table of 2026 federal brackets and standard deductions, which must be updated each year. On submit it opens a `mailto:` to Garo with every answer.

## Content rules

- Contact details: phone 310-941-1144 (`tel:+13109411144`), email garog@818accountingserve.com. The email also appears as `CONTACT_EMAIL` in `main.js`.
- No em dashes anywhere in site copy.
- Testimonials (`index.html` and `pages/reviews.html`, kept identical): the first two quotes were supplied by the user. Each card shows the client's name (only Jason, given by the user) or client type, with the service they used underneath; the third card's quote is still a placeholder. Use only review text the user provides from real clients; never invent reviews or client names.
- The Instagram and LinkedIn links still point to the generic sites, and `tax-guide.html` has a placeholder comment for Garo's credentials. Do not make up profile URLs or credentials.
