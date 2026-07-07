export interface StockLevel {
  id: string;

  productId: string;

  warehouseId: string;

  quantity: number;

  minimumLevel: number;
}