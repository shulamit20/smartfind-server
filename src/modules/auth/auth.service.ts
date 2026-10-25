import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { conflict, unauthorized } from '../../lib/errors';
import { Role } from '../../config/constants';
import { toUserDto } from './auth.mapper';
import { LoginInput, RegisterInput } from './auth.schemas';

const SALT_ROUNDS = 10;

// Used when the email does not exist, so a wrong email takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

function authResult(user: User) {
  return { token: signToken({ userId: user.id, role: user.role }), user: toUserDto(user) };
}

export async function register(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('This email is already registered');

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      passwordHash: await bcrypt.hash(input.password, SALT_ROUNDS),
      role: Role.User, // never taken from the request
    },
  });
  return authResult(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });

  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  // Same message for "no such email" and "wrong password"
  if (!user || !passwordOk) throw unauthorized('Invalid email or password');

  return authResult(user);
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  return toUserDto(user);
}
