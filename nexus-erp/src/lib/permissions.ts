import type { Role } from "@prisma/client"

// Hierarquia de roles: posição menor = mais permissões
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER:    1,
  ADMIN:    2,
  MANAGER:  3,
  SELLER:   4,
  EMPLOYEE: 5,
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER:    "Proprietário",
  ADMIN:    "Administrador",
  MANAGER:  "Gerente",
  SELLER:   "Vendedor",
  EMPLOYEE: "Colaborador",
}

/**
 * Verifica se `userRole` tem pelo menos o nível de `minRole`.
 * Ex: hasMinRole("MANAGER", "SELLER") === true (gerente tem mais que vendedor)
 *     hasMinRole("EMPLOYEE", "MANAGER") === false
 */
export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[minRole]
}

// Permissões padrão por módulo — podem ser sobrescritas via ModulePermission no banco
export const DEFAULT_MODULE_PERMISSIONS: Record<string, Role[]> = {
  dashboard:  ["OWNER", "ADMIN", "MANAGER", "SELLER", "EMPLOYEE"],
  customers:  ["OWNER", "ADMIN", "MANAGER", "SELLER"],
  products:   ["OWNER", "ADMIN", "MANAGER", "SELLER", "EMPLOYEE"],
  quotes:     ["OWNER", "ADMIN", "MANAGER", "SELLER"],
  orders:     ["OWNER", "ADMIN", "MANAGER", "SELLER"],
  crm:        ["OWNER", "ADMIN", "MANAGER", "SELLER"],
  tasks:      ["OWNER", "ADMIN", "MANAGER", "SELLER", "EMPLOYEE"],
  reports:    ["OWNER", "ADMIN", "MANAGER"],
  settings:   ["OWNER", "ADMIN"],
}
