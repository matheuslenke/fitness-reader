# Fitness Reader

Vite frontend backed by Convex.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the local Convex backend:

   ```bash
   npm run convex:dev
   ```

3. In another terminal, start the frontend:

   ```bash
   npm run dev
   ```

The frontend reads `VITE_CONVEX_URL` from `.env.development.local`, while the
Convex CLI reads `CONVEX_DEPLOYMENT` from `.env.local`.

## Production deployment

### Backend

Deploy Convex functions and schema to the project's production deployment:

```bash
npx convex deploy
```

This project's production Convex URL is:

```text
https://stoic-wombat-323.convex.cloud
```

`npm run build` uses `.env.production`, so production builds point to the cloud
backend instead of localhost.

### Frontend

This app is a static Vite build. Any static host will work as long as the build
uses:

```text
VITE_CONVEX_URL=https://stoic-wombat-323.convex.cloud
```

Example with Vercel:

```bash
npm run build
npx vercel --prod
```

Use these settings if Vercel asks:

- Build command: `npm run build`
- Output directory: `dist`

Example with Netlify:

```bash
npm run build
```

Then publish the `dist/` directory with:

- Build command: `npm run build`
- Publish directory: `dist`
