"use client"

import { useState } from "react"
import { Search, Plus, Building2, Phone, Mail, Users } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { CustomerStatus } from "@prisma/client"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: CustomerStatus
  createdAt: string
  company: { id: string; name: string } | null
  _count: { deals: number; orders: number }
}

const STATUS_LABELS: Record<CustomerStatus, string> = {
  PROSPECT: "Prospect",
  ACTIVE:   "Ativo",
  INACTIVE: "Inativo",
  CHURNED:  "Churned",
}

const STATUS_COLORS: Record<CustomerStatus, string> = {
  PROSPECT: "bg-yellow-100 text-yellow-700",
  ACTIVE:   "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  CHURNED:  "bg-red-100 text-red-700",
}

export function CustomersClient({
  customers,
  canManage,
}: {
  customers: Customer[]
  canManage: boolean
}) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "ALL">("ALL")

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou empresa..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CustomerStatus | "ALL")}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as CustomerStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {canManage && (
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Novo cliente
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Negócios</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Pedidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(customer.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {customer.company ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {customer.company.name}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}>
                      {STATUS_LABELS[customer.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm text-gray-600 hidden sm:table-cell">
                    {customer._count.deals}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm text-gray-600 hidden sm:table-cell">
                    {customer._count.orders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

