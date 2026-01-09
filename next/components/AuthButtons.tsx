"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <p>Loading session...</p>;
  if (!session) {
    return <button onClick={() => signIn('google')}>Sign in with Google</button>;
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span>Signed in as {session.user?.name || session.user?.email}</span>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}


