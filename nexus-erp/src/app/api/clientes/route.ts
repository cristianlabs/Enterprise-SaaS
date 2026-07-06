import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasMinRole } from "@/lib/permissions"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Role } from "@prisma/client"

// ─── Schema de validação ──────────────────────────────────────────────────────

const createSchema = z.object({
  name:      z.string().min(2, "Nome obrigatório"),
  email:     z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone:     z.string().optional(),
  whatsapp:  z.string().optional(),
  document:  z.string().optional(),
  status:    z.enum(["PROSPECT", "ACTIVE", "INACTIVE", "CHURNED"]).default("PROSPECT"),
  companyId: z.string().optional(),
  notes:     z.string().optional(),
  tags:      z.array(z.string()).default([]),
})

// ─── GET /api/clientes ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? undefined
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit  = Math.min(100, Number(searchParams.get("limit") ?? 50))

  const where = {
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    ...(status ? { status: status as "PROSPECT" | "ACTIVE" | "INACTIVE" | "CHURNED" } : {}),
  }

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        _count:  { select: { deals: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.customer.count({ where }),
  ])

  return NextResponse.json({ items, total, page, limit })
}

// ─── POST /api/clientes ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const role = session.user.role as Role
  if (!hasMinRole(role, "SELLER")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body = await req.json()
  const parse = createSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
  }

  const data = parse.data

  const customer = await db.customer.create({
    data: {
      name:      data.name,
      email:     data.email || null,
      phone:     data.phone || null,
      whatsapp:  data.whatsapp || null,
      document:  data.document || null,
      status:    data.status,
      companyId: data.companyId || null,
      notes:     data.notes || null,
      tags:      data.tags,
    },
  })

  // Registra auditoria
  await db.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     "CREATE",
      resource:   "Customer",
      resourceId: customer.id,
      metadata:   { name: customer.name },
    },
  })

  return NextResponse.json(customer, { status: 201 })
}
