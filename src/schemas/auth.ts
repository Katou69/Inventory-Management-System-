import { z } from "zod"

const ALLOWED_EMAIL_DOMAIN = "@grandroyal.com"

const email = z
  .string()
  .trim()
  .min(1, "Enter a valid email address")
  .email("Enter a valid email address")
  .refine(
    (v) => v.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN),
    `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`,
  )

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol")

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email,
  password,
  warehouseId: z.number().int(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
