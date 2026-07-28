/**
 * Settings data-access layer. Same convention as dashboard-service.ts /
 * users-service.ts: read through these functions, not local state directly.
 */
import { config } from "@/lib/config"
import { apiFetch } from "@/lib/api-client"
import { CATEGORIES } from "@/data/users-data"

export interface UserSettings {
  notifyLowStock: boolean
  notifyOrderUpdate: boolean
  notifyPoApproval: boolean
  language: string
  timezone: string
}

export interface Category {
  id: number
  name: string
}

const defaultSettings: UserSettings = {
  notifyLowStock: true,
  notifyOrderUpdate: true,
  notifyPoApproval: true,
  language: "English",
  timezone: "UTC",
}

let mockCategories: Category[] = CATEGORIES.map((name, id) => ({ id, name }))

export async function getMySettings(): Promise<UserSettings> {
  if (config.useMock) return { ...defaultSettings }
  return apiFetch<UserSettings>("/users/me/settings")
}

export async function updateMySettings(data: Partial<UserSettings>): Promise<UserSettings> {
  if (config.useMock) return { ...defaultSettings, ...data }
  return apiFetch<UserSettings>("/users/me/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function getCategories(): Promise<Category[]> {
  if (config.useMock) return [...mockCategories]
  return apiFetch<Category[]>("/categories")
}

export async function createCategory(name: string): Promise<Category> {
  if (config.useMock) {
    const category = { id: Math.max(0, ...mockCategories.map((c) => c.id)) + 1, name }
    mockCategories = [...mockCategories, category]
    return category
  }
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export async function deleteCategory(id: number): Promise<void> {
  if (config.useMock) {
    mockCategories = mockCategories.filter((c) => c.id !== id)
    return
  }
  await apiFetch(`/categories/${id}`, { method: "DELETE" })
}
