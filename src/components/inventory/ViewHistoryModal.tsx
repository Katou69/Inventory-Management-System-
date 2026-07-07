"use client";

import { InventoryItem } from "@/types/inventory";
import Modal from "@/components/ui/Modal";

interface Props {
  open: boolean;
  product: InventoryItem | null;
  onClose: () => void;
}

export default function ViewHistoryModal({
  open,
  product,
  onClose,
}: Props) {

  if (!open || !product) return null;


  return (
    <Modal
      title="Product History"
      subtitle={`${product.name} (${product.sku})`}
      onClose={onClose}
    >

      <div className="px-5 py-4 space-y-4">


        {/* Filter section */}
        <div className="flex gap-3">

          <select
            className="
              border
              border-border
              rounded-lg
              px-3
              py-2
              text-sm
              bg-background
            "
          >
            <option>
              All Time
            </option>

            <option>
              Last 7 Days
            </option>

            <option>
              Last Month
            </option>

          </select>


        </div>



        {/* History list */}
        <div className="space-y-3">


          <div className="border border-border rounded-lg p-3">

            <div className="flex justify-between">

              <span className="font-medium text-sm">
                Stock In
              </span>

              <span className="text-xs text-muted-foreground">
                2026-06-15
              </span>

            </div>


            <p className="text-sm text-muted-foreground mt-1">
              +50 units added to warehouse
            </p>

          </div>



          <div className="border border-border rounded-lg p-3">

            <div className="flex justify-between">

              <span className="font-medium text-sm">
                Stock Out
              </span>

              <span className="text-xs text-muted-foreground">
                2026-06-10
              </span>

            </div>


            <p className="text-sm text-muted-foreground mt-1">
              -10 units removed from warehouse
            </p>

          </div>



        </div>


      </div>



      {/* Only Close button */}
      <div className="
        flex
        justify-end
        px-5
        py-4
        border-t
        border-border
      ">

        <button
          onClick={onClose}
          className="
            px-5
            py-2
            rounded-lg
            bg-primary
            text-primary-foreground
            text-sm
            font-medium
            hover:opacity-90
          "
        >
          Close
        </button>

      </div>


    </Modal>

  );
}