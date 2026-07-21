"use client";

import { useState } from "react";

import Modal from "../ui/Modal";
import ModalFooter from "../ui/ModalFooter";

import { updateProduct } from "@/services/inventory-service";
import { InventoryItem } from "@/types/inventory";


interface Props {
  open: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSaved?: () => void;
}


export default function EditProductModal({
  open,
  product,
  onClose,
  onSaved,
}: Props) {


  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [minStock, setMinStock] = useState(product?.minStock ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  if (!open || !product)
    return null;



  async function save() {

    setSaving(true);
    setError(null);

    try {
      await updateProduct(product!.id, { name, price, minStock });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }



  return (

    <Modal
      title="Edit Product"
      subtitle={`Editing ${product.sku}`}
      onClose={onClose}
    >

      <div className="p-5 space-y-4">


        <div>

          <label className="text-sm font-medium">
            Product Name
          </label>

          <input
            className="modal-input mt-1"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

        </div>



        <div>

          <label className="text-sm font-medium">
            Price
          </label>

          <input
            type="number"
            className="modal-input mt-1"
            value={price}
            onChange={(e)=>setPrice(Number(e.target.value))}
          />

        </div>



        <div>

          <label className="text-sm font-medium">
            Minimum Stock
          </label>

          <input
            type="number"
            className="modal-input mt-1"
            value={minStock}
            onChange={(e)=>setMinStock(Number(e.target.value))}
          />

        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}


      </div>


      <ModalFooter

        onCancel={onClose}

        onConfirm={save}

        confirmLabel={saving ? "Saving..." : "Save Changes"}

        disabled={saving}

      />

    </Modal>

  );
}
