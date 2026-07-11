import { Order } from "@/types/orders";

export const orders: Order[] = [
  {
    id: "ORD-001",
    customer: "The Grand Hotel",
    items: [
      { product: "Grand Royal Black", quantity: 12000 },
      { product: "Grand Royal Signature", quantity: 8000 },
      { product: "Grand Royal Smooth", quantity: 3000 },
    ],
    total: 343000,
    status: "completed",
    date: "2026-06-10",
  },

  {
    id: "ORD-002",
    customer: "City Bar & Grill",
    items: [
      { product: "Grand Royal Signature", quantity: 12000 },
      { product: "Grand Royal Sherry Cask", quantity: 8000 },
    ],
    total: 834000,
    status: "cancelled",
    date: "2026-06-11",
  },

  {
    id: "ORD-003",
    customer: "Metro Supermarket",
    items: [
      { product: "Grand Royal Smooth", quantity: 9000 },
      { product: "Glan Master Finest", quantity: 5000 },
    ],
    total: 73000,
    status: "completed",
    date: "2026-06-12",
  },

  {
    id: "ORD-004",
    customer: "Riverside Restaurant",
    items: [
      { product: "Grand Royal SRW", quantity: 6000 },
      { product: "Grand Royal Black", quantity: 5000 },
    ],
    total: 28000,
    status: "pending",
    date: "2026-06-13",
  },

  {
    id: "ORD-005",
    customer: "Downtown Café",
    items: [
      { product: "Grand Royal Sherry Cask", quantity: 7000 },
    ],
    total: 23000,
    status: "pending",
    date: "2026-06-14",
  },

  {
    id: "ORD-006",
    customer: "The Lounge Club",
    items: [
      { product: "Glan Master Double Smooth", quantity: 2000 },
      { product: "Glan Master Finest", quantity: 1500 },
    ],
    total: 63000,
    status: "pending",
    date: "2026-06-15",
  },

  {
    id: "ORD-007",
    customer: "Park Inn Hotel",
    items: [
      { product: "Glan Master Finest", quantity: 700000 },
      { product: "Grand Royal Black", quantity: 300000 },
    ],
    total: 38000,
    status: "cancelled",
    date: "2026-06-16",
  },
];