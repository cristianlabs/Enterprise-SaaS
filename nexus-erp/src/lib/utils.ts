import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Retorna as iniciais do nome (máx. 2 letras) */
export function getInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("")
}

/** Formata um valor em Real brasileiro */
export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

/** Formata uma data para exibição em pt-BR */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

/** Gera número sequencial formatado (ex: COT-00042) */
export function formatSequential(prefix: string, n: number, pad = 5): string {
  return `${prefix}-${String(n).padStart(pad, "0")}`
}
