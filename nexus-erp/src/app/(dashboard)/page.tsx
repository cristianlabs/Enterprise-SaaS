export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { formatCurrency } from "@/lib/utils"
import { Users, Package, TrendingUp, CheckSquare } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [customers, products, openDeals, pendingTasks] = await Promise.all([
    db.customer.count({ where: { status: "ACTIVE" } }),
    db.product.count({ where: { active: true } }),
    db.deal.aggregate({
      where: { status: "OPEN" },
      _sum: { value: true },
      _count: true,
    }),
    db.task.count({
      where: {
        assignedToId: session.user.id,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),
  ])

  const stats = [
    {
      label:  "Clientes ativos",
      value:  customers.toString(),
      icon:   Users,
      color:  "text-blue-600",
      bg:     "bg-blue-50",
    },
    {
      label:  "Produtos ativos",
      value:  products.toString(),
      icon:   Package,
      color:  "text-purple-600",
      bg:     "bg-purple-50",
    },
    {
      label:  "Negócios em aberto",
      value:  formatCurrency(Number(openDeals._sum.value ?? 0)),
      sub:    `${openDeals._count} negócios`,
      icon:   TrendingUp,
      color:  "text-green-600",
      bg:     "bg-green-50",
    },
    {
      label:  "Minhas tarefas",
      value:  pendingTasks.toString(),
      sub:    "pendentes",
      icon:   CheckSquare,
      color:  "text-orange-600",
      bg:     "bg-orange-50",
    },
  ]

  return (
    <div>
      <Header
        title={`Bom dia, ${session.user.name?.split(" ")[0] ?? "usuário"} 👋`}
        subtitle="Aqui está o resumo de hoje"
      />

      <div className="p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
              </div>
            )
          })}
        </div>

        {/* Placeholder para gráficos futuros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-56 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Gráfico de vendas por período</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-56 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Pipeline de negócios por estágio</p>
          </div>
        </div>
      </div>
    </div>
  )
}
