import { z } from "zod"

export const warehouseStatus = z.enum(["Active", "Under Maintenance", "Closed"])

const phone = z.string().refine(
  (v) => v === "" || /^\+?[0-9\s-]{7,}$/.test(v),
  "Enter a valid phone number",
)

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required"),
  location: z.string().trim().min(1, "Location is required"),
  manager: z.string(),
  phone,
  status: warehouseStatus,
  image: z.string().nullable(),
})

export const updateWarehouseSchema = z.object({
  manager: z.string().trim().min(1, "Manager is required"),
  address: z.string().trim().min(1, "Address is required"),
  phone: z.string().trim().min(1, "Phone is required").refine(
    (v) => /^\+?[0-9\s-]{7,}$/.test(v),
    "Enter a valid phone number",
  ),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  nextInspection: z.string().trim().min(1, "Next inspection is required"),
  status: warehouseStatus,
  image: z.string().optional(),
})

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseProfileInput = z.infer<typeof updateWarehouseSchema>
