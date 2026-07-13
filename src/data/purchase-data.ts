import { PurchaseOrder } from "@/types/purchases";

export const purchases: PurchaseOrder[] = [
  {
    id: "PO-2001",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Grand Royal Black", quantity: 12000 },
      { product: "Grand Royal Smooth", quantity: 11000 },
    ],
    total: 343000,
    status: "completed",
    date: "2026-06-08",
  },

  {
    id: "PO-2002",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Grand Royal Signature", quantity: 10000 },
      { product: "Grand Royal SRW", quantity: 10000 },
    ],
    total: 834000,
    status: "pending",
    date: "2026-06-09",
  },

  {
    id: "PO-2003",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Grand Royal Smooth", quantity: 8000 },
      { product: "Grand Royal Sherry Cask", quantity: 6000 },
    ],
    total: 73000,
    status: "completed",
    date: "2026-06-10",
  },

  {
    id: "PO-2004",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Grand Royal SRW", quantity: 11000 },
    ],
    total: 28000,
    status: "completed",
    date: "2026-06-11",
  },

  {
    id: "PO-2005",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Grand Royal Sherry Cask", quantity: 4000 },
      { product: "Glan Master Finest", quantity: 3000 },
    ],
    total: 23000,
    status: "cancelled",
    date: "2026-06-12",
  },

  {
    id: "PO-2006",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Glan Master Double Smooth", quantity: 3500 },
    ],
    total: 63000,
    status: "pending",
    date: "2026-06-13",
  },

  {
    id: "PO-2007",
    supplier: "Grand Royal Group International",
    items: [
      { product: "Glan Master Finest", quantity: 500000 },
      { product: "Grand Royal Black", quantity: 500000 },
    ],
    total: 38000,
    status: "completed",
    date: "2026-06-14",
  },
];