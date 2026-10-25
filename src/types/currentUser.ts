import { Role } from '@prisma/client';

// The logged-in user as known from the JWT (set by the authenticate middleware)
export interface CurrentUser {
  id: number;
  role: Role;
}
