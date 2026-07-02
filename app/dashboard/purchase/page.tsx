import { Filters, PurchaseTable, Pagination } from "@/components/purchase";

export default function PurchasePage() {
  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <h1 className="text-3xl font-bold">Purchase History</h1>
        <p className="text-muted-foreground">Track and manage all supplier purchases</p>
      </div>
      <Filters />
      <PurchaseTable />
      <Pagination />
    </div>
  );
}