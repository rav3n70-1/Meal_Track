# MealTracker Next (Next.js + NextAuth + Prisma + Postgres)

## Setup
1. Create `.env.local` in `next/` with:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-strong-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
GOOGLE_PROJECT_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

2. Install and generate Prisma:
```
cd next
npm i
npm run prisma:generate
```

3. Create DB schema (locally or in Vercel Postgres):
```
npx prisma migrate deploy
```

4. Run the app:
```
npm run dev
```

## Firestore → Postgres Migration
Run once after configuring Firestore Admin env vars:
```
npm run migrate:firestore
```
This migrates collections: `users`, `households/*/{members,expenses,debts,rentBills,rentBillMembers}`, and `personalExpenses`.

## Notes
- NextAuth route: `app/api/auth/[...nextauth]/route.ts`
- Prisma schema: `prisma/schema.prisma`
- DB client: `lib/prisma.ts`
- Simple API routes: `app/api/users/me`, `app/api/households`

