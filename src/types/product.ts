export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;

  supplierId: string;
}