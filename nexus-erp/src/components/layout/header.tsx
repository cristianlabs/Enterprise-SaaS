import { Bell } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface HeaderProps {
  title: string
  subtitle?: string
}

export async function Header({ title, subtitle }: HeaderProps) {
  const session = await auth()

  // Conta notificações não lidas do usuário
  const unread = session?.user?.id
    ? await db.notification.count({
        where: { userId: session.user.id, read: false },
      }).catch(() => 0)
    : 0

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
