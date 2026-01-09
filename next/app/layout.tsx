import React from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'MealTracker Next',
  description: 'Next.js app with NextAuth and Prisma',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


