/*
  One-time Firestore -> Postgres migration using Prisma.
  Requires env vars: DATABASE_URL, GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
*/
import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PrismaClient } from '@prisma/client';

type FirestoreUser = {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  householdId?: string | null;
};

const prisma = new PrismaClient();

async function initFirestore() {
  if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Firestore admin env vars');
  }
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.GOOGLE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

async function migrateUsers(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const data = doc.data() as Partial<FirestoreUser>;
    const userId = data.uid || doc.id;
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: data.email ?? null,
        name: data.displayName ?? null,
        image: data.photoURL ?? null,
        displayName: data.displayName ?? null,
        householdId: data.householdId ?? null,
      },
      create: {
        id: userId,
        email: data.email ?? null,
        name: data.displayName ?? null,
        image: data.photoURL ?? null,
        displayName: data.displayName ?? null,
        householdId: data.householdId ?? null,
      },
    });
  }
}

async function migrateHouseholds(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('households').get();
  for (const doc of snap.docs) {
    const hId = doc.id;
    const h = doc.data() as any;
    await prisma.household.upsert({
      where: { id: hId },
      update: { name: h.name ?? 'Household', inviteCode: h.inviteCode ?? null },
      create: { id: hId, name: h.name ?? 'Household', inviteCode: h.inviteCode ?? null },
    });

    // members
    const membersSnap = await db.collection('households').doc(hId).collection('members').get();
    for (const m of membersSnap.docs) {
      const md = m.data() as any;
      const userId = md.userId ?? m.id; // some models use docId as userId
      await prisma.member.upsert({
        where: { id: m.id },
        update: {
          householdId: hId,
          userId,
          role: md.role ?? 'member',
          nickname: md.nickname ?? null,
        },
        create: {
          id: m.id,
          householdId: hId,
          userId,
          role: md.role ?? 'member',
          nickname: md.nickname ?? null,
        },
      });
    }

    // expenses
    const expensesSnap = await db.collection('households').doc(hId).collection('expenses').get();
    for (const e of expensesSnap.docs) {
      const ed = e.data() as any;
      await prisma.expense.upsert({
        where: { id: e.id },
        update: {
          householdId: hId,
          createdById: ed.createdById ?? ed.userId ?? null,
          amount: ed.amount ?? 0,
          date: ed.date?.toDate ? ed.date.toDate() : new Date(ed.date ?? Date.now()),
          category: ed.category ?? null,
          notes: ed.notes ?? null,
        },
        create: {
          id: e.id,
          householdId: hId,
          createdById: ed.createdById ?? ed.userId ?? 'unknown-user',
          amount: ed.amount ?? 0,
          date: ed.date?.toDate ? ed.date.toDate() : new Date(ed.date ?? Date.now()),
          category: ed.category ?? null,
          notes: ed.notes ?? null,
        },
      });
    }

    // debts
    const debtsSnap = await db.collection('households').doc(hId).collection('debts').get();
    for (const d of debtsSnap.docs) {
      const dd = d.data() as any;
      await prisma.debt.upsert({
        where: { id: d.id },
        update: {
          householdId: hId,
          fromUserId: dd.fromUserId ?? dd.from ?? 'unknown-user',
          toUserId: dd.toUserId ?? dd.to ?? 'unknown-user',
          amount: dd.amount ?? 0,
          description: dd.description ?? null,
        },
        create: {
          id: d.id,
          householdId: hId,
          fromUserId: dd.fromUserId ?? dd.from ?? 'unknown-user',
          toUserId: dd.toUserId ?? dd.to ?? 'unknown-user',
          amount: dd.amount ?? 0,
          description: dd.description ?? null,
        },
      });
    }

    // rent bills
    const billsSnap = await db.collection('households').doc(hId).collection('rentBills').get();
    for (const b of billsSnap.docs) {
      const bd = b.data() as any;
      await prisma.rentBill.upsert({
        where: { id: b.id },
        update: {
          householdId: hId,
          month: bd.month ?? 1,
          year: bd.year ?? 1970,
          totalAmount: bd.totalAmount ?? 0,
        },
        create: {
          id: b.id,
          householdId: hId,
          month: bd.month ?? 1,
          year: bd.year ?? 1970,
          totalAmount: bd.totalAmount ?? 0,
        },
      });
    }

    // rent members
    const rentMembersSnap = await db.collection('households').doc(hId).collection('rentBillMembers').get();
    for (const rm of rentMembersSnap.docs) {
      const rmd = rm.data() as any;
      const userId = rmd.userId ?? rm.id;
      await prisma.rentBillMember.upsert({
        where: { id: rm.id },
        update: { householdId: hId, userId, shareAmount: rmd.shareAmount ?? 0 },
        create: { id: rm.id, householdId: hId, userId, shareAmount: rmd.shareAmount ?? 0 },
      });
    }
  }
}

async function migratePersonalExpenses(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection('personalExpenses').get();
  for (const doc of snap.docs) {
    const d = doc.data() as any;
    await prisma.personalExpense.upsert({
      where: { id: doc.id },
      update: {
        userId: d.userId ?? 'unknown-user',
        amount: d.amount ?? 0,
        date: d.date?.toDate ? d.date.toDate() : new Date(d.date ?? Date.now()),
        note: d.note ?? d.notes ?? null,
      },
      create: {
        id: doc.id,
        userId: d.userId ?? 'unknown-user',
        amount: d.amount ?? 0,
        date: d.date?.toDate ? d.date.toDate() : new Date(d.date ?? Date.now()),
        note: d.note ?? d.notes ?? null,
      },
    });
  }
}

async function main() {
  const db = await initFirestore();
  console.log('Starting migration...');
  await migrateUsers(db);
  await migrateHouseholds(db);
  await migratePersonalExpenses(db);
  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


