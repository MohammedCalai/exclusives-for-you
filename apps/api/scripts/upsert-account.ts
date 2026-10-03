import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function run() {
  const email = process.env.ACCOUNT_EMAIL?.trim().toLowerCase();
  const password = process.env.ACCOUNT_PASSWORD;
  const role = (process.env.ACCOUNT_ROLE ?? 'CUSTOMER').toUpperCase() as Role;
  const firstName = process.env.ACCOUNT_FIRST_NAME?.trim() || (role === 'ADMIN' ? 'Store' : 'App');
  const lastName =
    process.env.ACCOUNT_LAST_NAME?.trim() || (role === 'ADMIN' ? 'Administrator' : 'Reviewer');

  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    throw new Error('ACCOUNT_EMAIL must be a valid email address');
  if (
    !password ||
    password.length < 10 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      'ACCOUNT_PASSWORD must be at least 10 characters and contain upper, lower and numeric characters',
    );
  }
  if (!Object.values(Role).includes(role))
    throw new Error('ACCOUNT_ROLE must be CUSTOMER or ADMIN');

  const passwordHash = await argon2.hash(password);
  const account = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, role, passwordHash, emailVerifiedAt: new Date() },
    create: { email, firstName, lastName, role, passwordHash, emailVerifiedAt: new Date() },
    select: { id: true, email: true, role: true },
  });
  console.log(`Account ready: ${account.email} (${account.role})`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Could not create account');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
