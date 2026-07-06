import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasMinRole } from "@/lib/permissions"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Role } from "@prisma/client"

const createSchema = z.object({
  name:        z.string().min(2),
  sku:         z.string().min(1),
  description: z.string().optional(),
  price:       z.number().positive("Preço deve ser positivo"),
  cost:        z.number().optional(),
  stock:       z.number().int().default(0),
  minStock:    z.number().int().default(0),
  categoryId:  z.string().optional(),
})

// ─── GET /api/produtos ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search     = searchParams.get("search") ?? ""
  const categoryId = searchParams.get("categoryId") ?? undefined
  const lowStock   = searchParams.get("lowStock") === "true"

  const products = await db.product.findMany({
    where: {
      active: true,
      ...(search     ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(categoryId ? { categoryId }                                       : {}),
      ...(lowStock   ? { stock: { lte: db.product.fields.minStock } }      : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(products)
}

// ─── POST /api/produtos ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const role = session.user.role as Role
  if (!hasMinRole(role, "MANAGER")) {
    return NextResponse.json({ error: "Apenas gerentes podem criar produtos" }, { status: 403 })
  }

  const body  = await req.json()
  const parse = createSchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 })
  }

  // Verifica SKU duplicado
  const existing = await db.product.findUnique({ where: { sku: parse.data.sku } })
  if (existing) {
    return NextResponse.json({ error: "SKU já cadastrado" }, { status: 409 })
  }

  const product = await db.product.create({ data: parse.data })

  await db.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     "CREATE",
      resource:   "Product",
      resourceId: product.id,
      metadata:   { name: product.name, sku: product.sku },
    },
  })

  return NextResponse.json(product, { status: 201 })
}
