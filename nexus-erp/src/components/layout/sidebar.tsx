"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Users, Package, TrendingUp, FileText,
  CheckSquare, Settings, LogOut, X, Menu, ChevronDown,
  Building2, BarChart2,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/permissions"
import type { Role } from "@prisma/client"

// ─── Estrutura de navegação ───────────────────────────────────────────────────

interface NavChild { key: string; href: string; label: string }
interface NavItem  { key: string; href: string; label: string; icon: React.ElementType; children?: NavChild[] }
interface NavSection { label: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Principal",
    items: [
      { key: "dashboard", href: "/",         label: "Dashboard",  icon: LayoutDashboard },
    ],
  },
  {
    label: "Comercial",
    items: [
      { key: "customers", href: "/clientes", label: "Clientes",   icon: Users },
      { key: "crm",       href: "/crm",      label: "CRM",        icon: Building2 },
      {
        key: "quotes", href: "/vendas", label: "Vendas", icon: TrendingUp,
        children: [
          { key: "quotes/list",   href: "/vendas/cotacoes", label: "Cotações" },
          { key: "quotes/orders", href: "/vendas/pedidos",  label: "Pedidos"  },
        ],
      },
    ],
  },
  {
    label: "Operacional",
    items: [
      { key: "products", href: "/produtos",  label: "Produtos",   icon: Package   },
      { key: "tasks",    href: "/tarefas",   label: "Tarefas",    icon: CheckSquare },
      { key: "reports",  href: "/relatorios",label: "Relatórios", icon: BarChart2 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { key: "settings", href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
]

// ─── Componente ───────────────────────────────────────────────────────────────

function SidebarContent({
  allowedModules,
  onClose,
}: {
  allowedModules: string[]
  onClose?: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    if (pathname.startsWith("/vendas/")) init["quotes"] = true
    return init
  })

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href
  }

  function isParentActive(item: NavItem) {
    if (pathname === item.href) return true
    return item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  }

  function toggleOpen(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => allowedModules.includes(item.key))
      .map((item) => ({
        ...item,
        children: item.children?.filter((c) => allowedModules.includes(c.key)),
      })),
  })).filter((s) => s.items.length > 0)

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#1e2a3a" }}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            NX
          </div>
          <span className="text-white font-semibold text-sm">Nexus ERP</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleSections.map((section, si) => (
          <div key={section.label} className={si > 0 ? "mt-4" : ""}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon        = item.icon
                const hasChildren = item.children && item.children.length > 0
                const parentActive = isParentActive(item)
                const isOpen      = openItems[item.key] ?? parentActive

                return (
                  <li key={item.key}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => toggleOpen(item.key)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                            parentActive
                              ? "text-white bg-white/10"
                              : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <ul className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                            <li>
                              <Link href={item.href} onClick={onClose}
                                className={cn("flex items-center px-2 py-1.5 rounded-md text-xs transition-colors",
                                  isActive(item.href) ? "text-white bg-blue-600 font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-white/8"
                                )}>
                                Visão geral
                              </Link>
                            </li>
                            {item.children!.map((child) => (
                              <li key={child.key}>
                                <Link href={child.href} onClick={onClose}
                                  className={cn("flex items-center px-2 py-1.5 rounded-md text-xs transition-colors",
                                    isActive(child.href) ? "text-white bg-blue-600 font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-white/8"
                                  )}>
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link href={item.href} onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          isActive(item.href) ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {getInitials(session?.user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {session?.user?.name ?? "Usuário"}
            </p>
            <p className="text-slate-500 text-xs leading-tight">
              {ROLE_LABELS[(session?.user?.role as Role) ?? "EMPLOYEE"]}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-500 hover:text-white transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ allowedModules }: { allowedModules: string[] }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 flex-col h-screen sticky top-0 flex-shrink-0">
        <SidebarContent allowedModules={allowedModules} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: "#1e2a3a" }}>
        <button onClick={() => setMobileOpen(true)} className="text-slate-300 hover:text-white p-1">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">NX</div>
          <span className="text-white font-semibold text-sm">Nexus ERP</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <SidebarContent allowedModules={allowedModules} onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50" />
        </div>
      )}
    </>
  )
}
