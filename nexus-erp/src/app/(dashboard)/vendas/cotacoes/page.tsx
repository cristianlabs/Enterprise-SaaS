export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { hasMinRole } from "@/lib/permissions"
import type { Role } from "@prisma/client"

export default async function QuotesPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role      = session.user.role as Role
  const canCreate = hasMinRole(role, "SELLER")

  const quotes = await db.quote.findMany({
    include: {
      customer:  { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count:    { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div>
      <Header title="Cotações" subtitle="Gerencie suas cotações e propostas" />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{quotes.length} cotações encontradas</p>
            {canCreate && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                + Nova cotação
              </button>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Número</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Criado por</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3.5 font-mono text-sm text-blue-600">{q.number}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-900">{q.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500 hidden md:table-cell">{q.createdBy.name}</td>
                  <td className="px-4 py-3.5">
                    <QuoteStatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(q.totalValue))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function QuoteStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT:    "bg-gray-100 text-gray-600",
    SENT:     "bg-blue-100 text-blue-700",
    ACCEPTED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-700",
    EXPIRED:  "bg-yellow-100 text-yellow-700",
  }
  const labels: Record<string, string> = {
    DRAFT: "Rascunho", SENT: "Enviada", ACCEPTED: "Aceita", DECLINED: "Recusada", EXPIRED: "Expirada",
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  )
}
