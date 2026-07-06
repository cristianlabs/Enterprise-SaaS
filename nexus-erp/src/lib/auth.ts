import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { Role } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "E-mail",  type: "email"    },
        password: { label: "Senha",   type: "password" },
        otp:      { label: "Código",  type: "text"     },
      },

      async authorize(credentials) {
        const { email, password, otp } = credentials as {
          email: string
          password: string
          otp?: string
        }

        if (!email || !password) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user || !user.password || !user.active) return null

        const passwordOk = await bcrypt.compare(password, user.password)
        if (!passwordOk) return null

        // Validação OTP (2FA)
        if (otp) {
          const token = await db.twoFactorToken.findFirst({
            where: { email, token: otp, used: false },
          })

          if (!token || token.expiresAt < new Date()) return null

          await db.twoFactorToken.update({
            where: { id: token.id },
            data:  { used: true },
          })
        }

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          image: user.image,
          role:  user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role: Role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
})

// Augment NextAuth types
declare module "next-auth" {
  interface User { role: Role }
  interface Session { user: { id: string; role: Role; name?: string | null; email?: string | null; image?: string | null } }
}

declare module "next-auth/jwt" {
  interface JWT { id: string; role: Role }
}
