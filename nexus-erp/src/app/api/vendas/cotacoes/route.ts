import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasMinRole } from "@/lib/permissions"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Role } from "@prisma/client"

const itemSchema = z.object({
  productId: z.string(),
  quantity:  z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount:  z.number().min(0).max(100).default(0),
})

const createSchema = z.object({
  customerId: z.string().optional(),
  dealId:     z.string().optional(),
  validUntil: z.string().optional(),
  notes:      z.string().optional(),
  items:      z.array(itemSchema).min(1, "Adicione ao menos um item"),
})

// ─── GET /api/vendas/cotacoes ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") ?? undefined

  const quotes = await db.quote.findMany({
    where: { ...(status ? { status: status as "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" } : {}) },
    include: {
      customer:  { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      items:     { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(quotes)
}

// ─── POST /api/vendas/cotacoes ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const role = session.user.role as Role
  if (!hasMinRole(role, "SELLER")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body  = await req.json()
  const parse = createSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
  }

  const { items, ...quoteData } = parse.data

  // Calcula totais
  const total = items.reduce((sum, item) => {
    const discounted = item.unitPrice * (1 - item.discount / 100)
    return sum + discounted * item.quantity
  }, 0)

  // Gera número sequencial
  const count  = await db.quote.count()
  const number = `COT-${String(count + 1).padStart(5, "0")}`

  const quote = await db.quote.create({
    data: {
      number,
      totalValue:  total,
      createdById: session.user.id,
      customerId:  quoteData.customerId || null,
      dealId:      quoteData.dealId     || null,
      validUntil:  quoteData.validUntil ? new Date(quoteData.validUntil) : null,
      notes:       quoteData.notes      || null,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity:  item.quantity,
          unitPrice: item.unitPrice,
          discount:  item.discount,
          total:     item.unitPrice * (1 - item.discount / 100) * item.quantity,
        })),
      },
    },
    include: {
      items:    { include: { product: { select: { id: true, name: true, sku: true } } } },
      customer: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(quote, { status: 201 })
}
