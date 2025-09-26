declare module 'next-auth/jwt' {
  interface JWT {
    role?: CollaboriumAuth.Role;
    permissions?: CollaboriumAuth.Permission[];
  }
}
