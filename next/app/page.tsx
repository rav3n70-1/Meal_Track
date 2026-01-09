export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>MealTracker (Next.js)</h1>
      <p>NextAuth + Prisma + Postgres scaffold is being set up.</p>
      <div style={{ marginTop: 16 }}>
        {/* @ts-expect-error Client component in Server Component tree */}
        <AuthSection />
      </div>
    </main>
  );
}

function AuthSection() {
  // dynamic import avoids layout rework; inline for brevity
  const { AuthButtons } = require('../components/AuthButtons');
  return <AuthButtons />;
}


