export type PurchaseStatus = "Received" | "Cancelled" | "Pending";

export interface Purchase {
  id: number;
  poId: string;
  itemName: string;
  cost: string;
  quantity: string;
  status: PurchaseStatus;
}

export const purchases: Purchase[] = [
  { id: 1, poId: "PO-2001", itemName: "Grand Royal Black", cost: "343K", quantity: "23K", status: "Received" },
  { id: 2, poId: "PO-2002", itemName: "Grand Royal Signature", cost: "834K", quantity: "20K", status: "Cancelled" },
  { id: 3, poId: "PO-2003", itemName: "Grand Royal Smooth", cost: "73K", quantity: "14K", status: "Received" },
  { id: 4, poId: "PO-2004", itemName: "Grand Royal SRW", cost: "28K", quantity: "11K", status: "Received" },
  { id: 5, poId: "PO-2005", itemName: "Grand Royal Sherry Cask", cost: "23K", quantity: "7K", status: "Cancelled" },
  { id: 6, poId: "PO-2006", itemName: "Glan Master Double Smooth", cost: "63K", quantity: "3.5K", status: "Received" },
  { id: 7, poId: "PO-2007", itemName: "Glan Master Finest", cost: "38K", quantity: "1000K", status: "Cancelled" },
];