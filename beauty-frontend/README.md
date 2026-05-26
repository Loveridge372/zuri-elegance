# Zuri Elegance Frontend

React and Vite storefront for Zuri Elegance.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set:

```bash
VITE_API_BASE_URL=http://127.0.0.1:5000
VITE_PAYSTACK_PUBLIC_KEY=pk_test_or_live_key
```

## Production Build

```bash
npm run build
```

The production output is created in `dist`.

## Deployment

For Vercel:
- Root directory: `beauty-frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_BASE_URL` to your deployed backend URL.
- Set `VITE_PAYSTACK_PUBLIC_KEY` to your live Paystack public key.

For Netlify:
- Root directory: `beauty-frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- The included `netlify.toml` handles React Router page refreshes.

The included `vercel.json` handles React Router page refreshes on Vercel.
