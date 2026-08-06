import { z } from "zod"

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Product name is required"),
  categoryId: z.number().nullable(),
  supplierId: z.number().nullable(),
  unitPrice: z.number().min(0, "Unit price must be 0 or more"),
  unitCost: z.number().min(0, "Unit cost must be 0 or more"),
  reorderLevel: z.number().int().min(0, "Reorder level must be 0 or more"),
  image: z.string().nullable(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
