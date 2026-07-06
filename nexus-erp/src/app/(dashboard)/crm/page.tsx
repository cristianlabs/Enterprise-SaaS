export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function CrmPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [pipelines, deals] = await Promise.all([
    db.pipeline.findMany({ orderBy: { order: "asc" } }),
    db.deal.findMany({
      where:   { status: "OPEN" },
      include: {
        customer: { select: { id: true, name: true } },
        owner:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Agrupa deals por pipeline
  const byPipeline = pipelines.map((p) => ({
    ...p,
    deals: deals.filter((d) => d.pipelineId === p.id),
    total: deals
      .filter((d) => d.pipelineId === p.id)
      .reduce((sum, d) => sum + Number(d.value ?? 0), 0),
  }))

  return (
    <div>
      <Header title="CRM — Pipeline" subtitle="Acompanhe seus negócios por estágio" />
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {byPipeline.map((pipeline) => (
            <div key={pipeline.id} className="w-72 flex-shrink-0">
              {/* Pipeline header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pipeline.color }} />
                  <h3 className="font-semibold text-sm text-gray-800">{pipeline.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                    {pipeline.deals.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formatCurrency(pipeline.total)}</p>
              </div>

              {/* Deals */}
              <div className="space-y-2">
                {pipeline.deals.map((deal) => (
                  <div key={deal.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
                    <p className="font-medium text-sm text-gray-900 mb-1">{deal.title}</p>
                    {deal.customer && (
                      <p className="text-xs text-gray-500 mb-2">{deal.customer.name}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-600">
                        {deal.value ? formatCurrency(Number(deal.value)) : "—"}
                      </span>
                      {deal.expectedClose && (
                        <span className="text-xs text-gray-400">{formatDate(deal.expectedClose)}</span>
                      )}
                    </div>
                    {deal.owner && (
                      <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                        {deal.owner.name}
                      </p>
                    )}
                  </div>
                ))}

                {pipeline.deals.length === 0 && (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 text-center">
                    <p className="text-xs text-gray-400">Nenhum negócio aqui</p>
                  </div>
                )}

                <button className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  + Adicionar negócio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
