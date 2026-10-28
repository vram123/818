# 818

Website for 818accountingserve.com, hosted on GitHub Pages from the `main` branch root.

```
index.html            Landing page
pages/
  services.html       Services
  why-us.html         Why choose us
  reviews.html        Client reviews
  contact.html        Contact form
  coming-soon.html    Coming soon page
  privacy.html        Privacy Policy
  terms.html          Terms of Use
  tax-guide.html      Tax guide with table of contents
src/
  css/styles.css      Shared styles
  js/main.js          Contact form, newsletter, footer year
  js/chat.js          Chat assistant widget (bottom right of every page)
  img/logo.svg        Logo and favicon
worker/               Cloudflare Worker that answers chat questions with Gemini
```

## Chat assistant

The site is static, so the Gemini API key lives in a Cloudflare Worker, never in the site files.

Run locally (key comes from `worker/.dev.vars`, gitignored):

```
cd worker && npx wrangler dev --port 8787     # chat API on http://localhost:8787
python3 -m http.server 8000                   # site on http://localhost:8000 (from repo root)
```

Deploy once:

```
cd worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY        # paste the key from .env
npx wrangler deploy                           # prints the Worker URL
```

Then set `CHAT_API_URL` in `src/js/chat.js` to the printed Worker URL and push. The assistant's instructions are `SYSTEM_PROMPT` in `worker/src/index.js`.
