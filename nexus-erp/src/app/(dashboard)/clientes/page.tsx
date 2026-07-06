export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { hasMinRole } from "@/lib/permissions"
import type { Role } from "@prisma/client"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role as Role
  const canManage = hasMinRole(role, "MANAGER")

  const customers = await db.customer.findMany({
    include: {
      company:    { select: { id: true, name: true } },
      _count:     { select: { deals: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <Header title="Clientes" subtitle="Gerencie seus clientes e prospects" />
      <CustomersClient customers={customers} canManage={canManage} />
    </div>
  )
}
