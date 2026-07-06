export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/layout/header"
import { hasMinRole } from "@/lib/permissions"
import { formatCurrency } from "@/lib/utils"
import type { Role } from "@prisma/client"
import { Package, AlertTriangle } from "lucide-react"

export default async function ProductsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role      = session.user.role as Role
  const canManage = hasMinRole(role, "MANAGER")

  const products = await db.product.findMany({
    where:   { active: true },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  })

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length

  return (
    <div>
      <Header title="Produtos" subtitle="Catálogo de produtos e controle de estoque" />
      <div className="p-6">
        {lowStockCount > 0 && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>{lowStockCount} produto{lowStockCount > 1 ? "s" : ""}</strong> com estoque abaixo do mínimo.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">{products.length} produtos</p>
            {canManage && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Package className="w-4 h-4" />
                Novo produto
              </button>
            )}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Preço</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => {
                const isLow = product.stock <= product.minStock
                return (
                  <tr key={product.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-sm text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{product.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500 hidden md:table-cell">{product.sku}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(Number(product.price))}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-medium ${isLow ? "text-red-600" : "text-gray-900"}`}>
                        {product.stock}
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 inline-block ml-1 text-red-500" />}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
