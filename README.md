# Website Cloner

A simple Next.js UI for [ditto.site](https://www.ditto.site) — enter a public URL, get back a runnable codebase generated from what the page actually renders, and download it as a ZIP.

## Setup

1. Put your ditto API key in `.env.local`:

   ```
   DTTO_API_KEY=dtto_live_...
   ```

   The key is only ever read server-side; it is never exposed to the browser.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:3000, enter a URL, and click **Clone**. When the job finishes you'll see the generated file list and a **Download ZIP** button.

## How it works

- `POST /api/clone` proxies to `POST https://api.ditto.site/v1/clones` and returns `{ jobId, status }`.
- The page polls `GET /api/clone/[jobId]` every 3 seconds until the job succeeds or fails. On success it returns file metadata (paths, types, sizes).
- `GET /api/clone/[jobId]/download` fetches the full result file map, writes text files and binary assets into a ZIP with jszip, and streams it back as `<site>.zip`.

## Options

| Option    | Values                | Default    |
| --------- | --------------------- | ---------- |
| Mode      | single page / multi   | single     |
| Styling   | tailwind / css        | tailwind   |
| Framework | Next.js / Vite React  | next       |

Set `DITTO_API_URL` in `.env.local` to point at a self-hosted ditto service (defaults to `https://api.ditto.site`).
