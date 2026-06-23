# CrowdSpark

A full-stack crowdfunding / donation platform. Users register, browse fundraising **campaigns**, and **donate** with real card payments via Stripe. Admins manage campaigns, users, and view platform-wide reports.

Built as a decoupled **single-page app + REST API**:

- **Frontend** — React 18 + TypeScript (Vite), Ant Design, Zustand, React Router, Stripe Elements, Firebase Storage.
- **Backend** — Node.js + Express (ESM), MongoDB/Mongoose, JWT auth, Stripe, bcrypt.

---

## Architecture

```
React SPA  ──/api/*──▶  Express REST API  ──▶  MongoDB (Mongoose)
(Vite)                   │
                         ├──▶ Stripe        (payment verification)
                         └──▶ Firebase Storage (campaign images, uploaded from the browser)
```

- In development, Vite proxies `/api/*` to the backend, so the browser sees a single origin.
- Auth is a **JWT in an HttpOnly cookie**, set by the server on login and verified on each request via middleware.

---

## Features

- **Auth** — register, login (with "remember me"), logout. Passwords hashed with bcrypt; JWT stored in an HttpOnly cookie.
- **Campaigns** — browse, view detail, and (for owners/admins) create, edit, and delete. Images uploaded to Firebase Storage.
- **Donations** — card payment via Stripe; the server verifies the payment with Stripe before recording the donation and updating the campaign total.
- **User area** — profile, donation history, and personal reports.
- **Admin area** — manage users, manage all campaigns, and view platform-wide reports. Admin actions are enforced **server-side** (not just hidden in the UI).

---

## Security

This codebase has been hardened with a focus on the client/server trust boundary:

- **Server-side authorization** — admin and owner-scoped actions are enforced on the API, not just the UI.
- **Verified payments** — donations are only recorded after the Stripe PaymentIntent is confirmed succeeded and the amount matches; the donor is derived from the auth token, not the request body.
- **HttpOnly auth cookie** — the JWT is never exposed to client-side JavaScript, defending against XSS token theft.
- **No sensitive data leakage** — password hashes are stripped from all API responses at the schema level.
- **Correct auth semantics** — invalid/expired sessions return `401`; deactivated accounts cannot log in.

---

## Getting started (local)

### Prerequisites
- Node.js 20+
- A MongoDB connection string (local or MongoDB Atlas)
- A Stripe account (test keys)
- A Firebase project with Storage enabled

### 1. Backend

```bash
cd crowdspark-backend-master
npm install
```

Create a `.env` file in `crowdspark-backend-master/`:

```ini
DATABASE_URL=your-mongodb-connection-string
JWT_SECRET=a-long-random-string
STRIPE_SECRET_KEY=sk_test_...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=a-secret-for-the-make-admin-endpoint
FRONTEND_URL=http://localhost:5173
PORT=5050
# NODE_ENV=production   # set this only in deployment (enables the Secure cookie flag)
```

Seed the database (creates the admin user, a demo user, and sample campaigns/donations), then start the server:

```bash
npm run seed     # one-off: wipes and re-seeds the collections
npm run dev      # starts the API on http://localhost:5050
```

### 2. Frontend

```bash
cd crowdspark-frontend-master
npm install
```

Create a `.env` file in `crowdspark-frontend-master/` with your Vite/Stripe/Firebase keys:

```ini
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> Use Stripe **test** keys, and make sure the backend `STRIPE_SECRET_KEY` and the frontend `VITE_STRIPE_PUBLISHABLE_KEY` come from the **same** Stripe account.

Start the dev server:

```bash
npm run dev      # http://localhost:5173
```

### 3. Log in

- **Demo user:** `demo@crowdspark.com` / `Demo@123`
- **Admin:** the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in the backend `.env`

---

## Testing payments

Use Stripe's test cards (test mode only):

| Scenario | Card number |
|---|---|
| Success | `4242 4242 4242 4242` |
| Requires authentication | `4000 0025 0000 3155` |
| Declined | `4000 0000 0000 0002` |

Use any future expiry, any CVC, and any US billing address.

---

## Scripts

**Backend** (`crowdspark-backend-master`)
- `npm run dev` — start with nodemon
- `npm start` — start with node
- `npm run seed` — wipe and re-seed the database

**Frontend** (`crowdspark-frontend-master`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — ESLint

---

## Deployment

The app is designed to deploy as two services:

- **Frontend** → a static host (e.g. Vercel) that rewrites `/api/*` to the backend.
- **Backend** → a Node host (e.g. Render) with the environment variables above. Set `NODE_ENV=production` so the auth cookie gets the `Secure` flag.
- **Database** → MongoDB Atlas.
