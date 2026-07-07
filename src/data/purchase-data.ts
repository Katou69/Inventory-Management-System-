import { PurchaseOrder } from "@/types/purchases";

export const purchases: PurchaseOrder[] = [
  { id: "PO-2001", supplier: "Grand Royal Group International", warehouseId: 1, items: "Grand Royal Black", quantity: 23000, total: 343000, status: "received", date: "2026-06-08" },
  { id: "PO-2002", supplier: "Grand Royal Group International", warehouseId: 2, items: "Grand Royal Signature", quantity: 20000, total: 834000, status: "draft", date: "2026-06-09" },
  { id: "PO-2003", supplier: "Grand Royal Group International", warehouseId: 3, items: "Grand Royal Smooth", quantity: 14000, total: 73000, status: "received", date: "2026-06-10" },
  { id: "PO-2004", supplier: "Grand Royal Group International", warehouseId: 4, items: "Grand Royal SRW", quantity: 11000, total: 28000, status: "received", date: "2026-06-11" },
  { id: "PO-2005", supplier: "Grand Royal Group International", warehouseId: 5, items: "Grand Royal Sherry Cask", quantity: 7000, total: 23000, status: "draft", date: "2026-06-12" },
  { id: "PO-2006", supplier: "Grand Royal Group International", warehouseId: 6, items: "Glan Master Double Smooth", quantity: 3500, total: 63000, status: "approved", date: "2026-06-13" },
  { id: "PO-2007", supplier: "Grand Royal Group International", warehouseId: 7, items: "Glan Master Finest", quantity: 1000000, total: 38000, status: "submitted", date: "2026-06-14" },
];
