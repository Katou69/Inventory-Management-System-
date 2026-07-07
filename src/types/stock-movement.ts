export type StockMovementType = "IN" | "OUT";

export interface StockMovement {
  id: string;

  productId: string;

  warehouseId: string;

  quantity: number;

  type: StockMovementType;

  date: string;

  reason: string;

  userId: string;
}