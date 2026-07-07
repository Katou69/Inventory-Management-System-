"use client";

import { useState } from "react";

import Modal from "../ui/Modal";
import ModalFooter from "../ui/ModalFooter";

import { InventoryItem } from "@/types/inventory";


interface Props {
  open:boolean;
  product:InventoryItem|null;
  onClose:()=>void;
}


export default function EditProductModal({
  open,
  product,
  onClose
}:Props){


  const [name,setName]=useState(product?.name ?? "");


  if(!open || !product)
    return null;



  function save(){

    console.log({
      id:product!.id,
      name
    });


    onClose();
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
            className="modal-input mt-1"
            value={product.price}
            disabled
          />

        </div>



        <div>

          <label className="text-sm font-medium">
            Minimum Stock
          </label>

          <input
            className="modal-input mt-1"
            value={product.minStock}
            disabled
          />

        </div>


      </div>


      <ModalFooter

        onCancel={onClose}

        onConfirm={save}

        confirmLabel="Save Changes"

      />

    </Modal>

  );
}