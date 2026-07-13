import { PurchaseTable } from "@/components/purchase";

export default function StaffPurchaseContent() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-muted-foreground">
          Receive and stock incoming purchase orders
        </p>
      </div>

      <PurchaseTable role="staff" />
    </div>
  );
}