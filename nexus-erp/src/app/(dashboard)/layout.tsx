export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DEFAULT_MODULE_PERMISSIONS } from "@/lib/permissions"
import { Sidebar } from "@/components/layout/sidebar"
import type { Role } from "@prisma/client"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role as Role

  // Permissões do banco sobrescrevem o padrão
  const dbPerms = await db.modulePermission.findMany()

  const allowedModules = Object.entries(DEFAULT_MODULE_PERMISSIONS)
    .filter(([module, defaultRoles]) => {
      const override = dbPerms.find((p) => p.module === module && p.role === role)
      if (override) return override.allowed
      return defaultRoles.includes(role)
    })
    .map(([module]) => module)

  // Adicionar sub-módulos de vendas se vendas estiver liberado
  if (allowedModules.includes("quotes")) {
    allowedModules.push("quotes/list", "quotes/orders")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar allowedModules={allowedModules} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
