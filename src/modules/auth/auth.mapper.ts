import { User } from '@prisma/client';

// What the client receives about a user. passwordHash is never included.
export function toUserDto(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export type UserDto = ReturnType<typeof toUserDto>;
