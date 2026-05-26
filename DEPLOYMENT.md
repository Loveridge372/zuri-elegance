# Zuri Elegance Deployment

## Frontend

Deploy the `beauty-frontend` folder to Vercel or Netlify.

Build settings:

```bash
npm install
npm run build
```

Output directory:

```bash
dist
```

Required frontend environment variables:

```bash
VITE_API_BASE_URL=https://your-backend-domain.example.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_replace_with_your_public_key
```

`beauty-frontend/vercel.json` and `beauty-frontend/netlify.toml` are included so React Router routes work after refresh.

## Backend

Deploy the repository root as a Flask app.

Start command:

```bash
gunicorn app:app
```

Required backend environment variables are listed in `.env.example`.

Important production values:

```bash
FRONTEND_URL=https://your-frontend-domain.example.com
BACKEND_URL=https://your-backend-domain.example.com
CORS_ORIGINS=https://your-frontend-domain.example.com
PAYSTACK_CALLBACK_URL=https://your-frontend-domain.example.com/payment-success
```

Use live Paystack keys for production. Keep `.env` private and set secrets inside your hosting provider dashboard.

## Staging

Use staging to test changes before production. Staging should have its own frontend URL, backend URL, database, and test payment keys.

Staging files:

```bash
.env.staging.example
beauty-frontend/.env.staging.example
```

Frontend staging build command:

```bash
npm run build:staging
```

Frontend staging environment variables:

```bash
VITE_API_BASE_URL=https://your-staging-backend-url
VITE_PAYSTACK_PUBLIC_KEY=pk_test_replace_with_your_paystack_test_public_key
```

Backend staging environment variables:

```bash
APP_ENV=staging
FRONTEND_URL=https://your-staging-frontend-url
BACKEND_URL=https://your-staging-backend-url
CORS_ORIGINS=https://your-staging-frontend-url
PAYSTACK_SECRET_KEY=sk_test_replace_with_your_paystack_test_secret_key
PAYSTACK_CALLBACK_URL=https://your-staging-frontend-url/payment-success
DB_NAME=zuri_elegance_staging
```

Recommended staging flow:

1. Create a separate staging database.
2. Deploy the backend using `gunicorn app:app`.
3. Visit `https://your-staging-backend-url/health` and confirm it returns `status: ok`.
4. Deploy the frontend with `npm run build:staging`.
5. Register a test user and complete checkout with Paystack test keys.
6. Only copy changes to production after staging checkout, login, admin, products, and rewards work.
