import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;
  const memberships = await prisma.member.findMany({ where: { userId }, include: { household: true } });
  return NextResponse.json({ households: memberships.map((m) => m.household) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const household = await prisma.household.create({ data: { name } });
  await prisma.member.create({
    data: {
      householdId: household.id,
      userId: (session.user as any).id,
      role: 'manager',
    },
  });
  return NextResponse.json({ household }, { status: 201 });
}


