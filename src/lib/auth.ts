export type UserRole = 'ADMIN' | 'OPERATOR' | 'VISITOR';

export interface UserSession {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  walletBalance: number;
}

export const DEMO_USERS: Record<UserRole, UserSession> = {
  ADMIN: {
    userId: 1,
    fullName: 'Chief Operations Director',
    email: 'admin@themepark.com',
    role: 'ADMIN',
    walletBalance: 1000.00,
  },
  OPERATOR: {
    userId: 2,
    fullName: 'Sarah Turnstile Lead',
    email: 'staff.sarah@themepark.com',
    role: 'OPERATOR',
    walletBalance: 250.00,
  },
  VISITOR: {
    userId: 4,
    fullName: 'Alex Johnson (VIP Visitor)',
    email: 'visitor.alex@gmail.com',
    role: 'VISITOR',
    walletBalance: 450.00,
  },
};

export function checkRoleAuthorization(currentRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(currentRole);
}
