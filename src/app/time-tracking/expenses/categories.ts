/**
 * Categorias de gasto.
 *
 * Viven en su propio modulo y NO en actions.ts porque un archivo 'use server'
 * solo puede exportar funciones async. Exportar una constante desde ahi compila
 * sin problemas y revienta en produccion al invocar el server action, con
 * "A use server file can only export async functions, found object".
 */

export const EXPENSE_CATEGORIES = [
  'fuel', 'material', 'equipment', 'tools', 'permit', 'travel', 'meals', 'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  fuel: 'Fuel',
  material: 'Material',
  equipment: 'Equipment',
  tools: 'Tools',
  permit: 'Permit',
  travel: 'Travel',
  meals: 'Meals',
  other: 'Other',
}

/**
 * De donde salio el dinero. No es lo mismo un gasto pagado con el efectivo que
 * entrego el cliente que uno puesto del bolsillo: el primero se repone contra
 * el fondo y el segundo se reembolsa a la persona. La rendicion los separa por
 * este campo, asi que marcarlo mal mueve plata de una deuda a la otra.
 */
export const PAID_BY = ['employee', 'company_cash'] as const

export type PaidBy = (typeof PAID_BY)[number]

export const PAID_BY_LABEL: Record<PaidBy, string> = {
  employee: 'Own money — reimburse me',
  company_cash: 'Company cash advance',
}
