/**
 * Permissões por perfil (role)
 * ADMIN, SUPERVISOR, AGENT, VIEWER
 */

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT' | 'VIEWER'

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  AGENT: 'Atendente',
  VIEWER: 'Visualizador',
}

/** Quem pode ACESSAR cada módulo (ver no menu e entrar na página) */
export const CAN_ACCESS: Record<string, UserRole[]> = {
  dashboard: ['ADMIN', 'SUPERVISOR'],
  inbox: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
  contacts: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
  pipeline: ['ADMIN'],
  templates: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
  knowledge: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
  automation: ['ADMIN'],
  campaigns: ['ADMIN', 'SUPERVISOR'],
  reports: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
  users: ['ADMIN'],
  settings: ['ADMIN'],
  whatsappTest: ['ADMIN'],
  help: ['ADMIN', 'SUPERVISOR', 'AGENT', 'VIEWER'],
}

/** Quem pode EDITAR (vs apenas visualizar) em cada módulo */
export const CAN_EDIT: Record<string, UserRole[]> = {
  dashboard: ['ADMIN', 'SUPERVISOR', 'AGENT'],
  inbox: ['ADMIN', 'SUPERVISOR', 'AGENT'],
  contacts: ['ADMIN', 'SUPERVISOR', 'AGENT'],
  pipeline: ['ADMIN', 'SUPERVISOR', 'AGENT'],
  templates: ['ADMIN', 'SUPERVISOR'],
  knowledge: ['ADMIN', 'SUPERVISOR'],
  automation: ['ADMIN', 'SUPERVISOR'],
  campaigns: ['ADMIN', 'SUPERVISOR'],
  reports: ['ADMIN', 'SUPERVISOR'],
  users: ['ADMIN', 'SUPERVISOR'],
  settings: ['ADMIN'],
}

export function canAccess(role: string | undefined, module: string): boolean {
  if (!role) return false
  const allowed = CAN_ACCESS[module]
  return allowed ? allowed.includes(role as UserRole) : false
}

export function canEdit(role: string | undefined, module: string): boolean {
  if (!role) return false
  const allowed = CAN_EDIT[module]
  return allowed ? allowed.includes(role as UserRole) : false
}
