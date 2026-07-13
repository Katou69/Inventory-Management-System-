import { PurchaseTable } from "@/components/purchase";

export default function ManagerPurchaseContent() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-muted-foreground">
          Create and track purchase orders from suppliers
        </p>
      </div>

      <PurchaseTable role="manager" />
    </div>
  );
}