import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        return {
          id: 'demo-user',
          name: 'Collabo Fan',
          email: credentials.email,
          role: 'fan'
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'placeholder'
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? 'placeholder',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? 'placeholder'
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? 'fan';
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.role) {
        token.role = 'fan';
      }
      return token;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
