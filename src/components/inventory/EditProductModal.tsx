"use client";

import { useEffect, useState } from "react";

import Modal from "./Modal";
import { InventoryRow } from "@/types";

interface Props {
  open: boolean;
  product: InventoryRow | null;
  onClose: () => void;
}

export default function EditProductModal({
  open,
  product,
  onClose,
}: Props) {
  const [form, setForm] = useState<InventoryRow | null>(product);

  useEffect(() => {
    setForm(product);
  }, [product]);

  if (!form) return null;

  function handleSave() {
    console.log(form);

    // Later:
    // await fetch("/products/...", { method:"PUT"... })

    onClose();
  }

  return (
    <Modal
      open={open}
      title="Edit Product"
      onClose={onClose}
    >
      <div className="space-y-4">

        <div>
          <label>Name</label>

          <input
            className="mt-1 w-full rounded-lg border p-2"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>Price</label>

          <input
            type="number"
            className="mt-1 w-full rounded-lg border p-2"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label>Category</label>

          <input
            className="mt-1 w-full rounded-lg border p-2"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}