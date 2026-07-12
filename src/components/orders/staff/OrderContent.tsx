import { OrdersTable } from "@/components/orders";

export default function StaffOrderContent() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground">
          Pick and ship customer orders
        </p>
      </div>

      <OrdersTable role="staff" />
    </div>
  );
}