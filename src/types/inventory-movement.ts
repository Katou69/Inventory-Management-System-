export type MovementStatus =
  | "pending"
  | "completed";

export interface MovementTask {

  id: string;
  productId: string;
  productName: string;
  quantity: number;
  fromShelf: string;
  toShelf: string;
  requestedBy: string;
  warehouseId: number;
  reason: string;
  status: MovementStatus;

}