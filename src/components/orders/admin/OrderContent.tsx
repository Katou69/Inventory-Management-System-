import { OrdersTable } from "@/components/orders";

export default function AdminOrderContent() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground">
          Track and manage all customer orders
        </p>
      </div>

      <OrdersTable role="admin" />
    </div>
  );
}