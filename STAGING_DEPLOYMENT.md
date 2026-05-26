# Staging Deployment Checklist

Use this checklist to create a safe staging version of Zuri Elegance before production.

## 1. Create Staging Services

Create separate staging services:

- Frontend: `zuri-elegance-staging`
- Backend: `zuri-elegance-api-staging`
- Database: `zuri_elegance_staging`

Do not point staging at your production database.

## 2. Backend Staging

Deploy the repository root.

Build/install command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
gunicorn app:app
```

Set environment variables using `.env.staging.example`.

Required staging values:

```bash
APP_ENV=staging
FRONTEND_URL=https://your-staging-frontend-url
BACKEND_URL=https://your-staging-backend-url
CORS_ORIGINS=https://your-staging-frontend-url
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_CALLBACK_URL=https://your-staging-frontend-url/payment-success
```

After deploy, open:

```bash
https://your-staging-backend-url/health
```

You should see `status: ok` and `environment: staging`.

## 3. Frontend Staging

Deploy the `beauty-frontend` folder.

Build command:

```bash
npm run build:staging
```

Output directory:

```bash
dist
```

Set frontend environment variables using `beauty-frontend/.env.staging.example`.

Required staging values:

```bash
VITE_API_BASE_URL=https://your-staging-backend-url
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```

## 4. Test Before Production

Test these on staging:

- Register and verify email
- Login
- Product listing and product details
- Wishlist
- Cart
- Checkout with Paystack test keys
- Payment success and failed pages
- Orders and tracking
- Contact page
- Admin products, orders, coupons, rewards, and notifications

## 5. Production Safety

Keep staging and production separate:

- Separate database
- Separate Paystack keys
- Separate backend URL
- Separate frontend URL
- Separate hosting environment variables

Rotate any secrets that were ever exposed locally before production.
