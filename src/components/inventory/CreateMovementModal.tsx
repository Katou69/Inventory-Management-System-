"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";

import { shelves } from "@/data/inventorymovement-data";
import { InventoryItem } from "@/types/inventory";


interface Props{
    inventory: InventoryItem[]
}

export default function CreateMovementModal({
        inventory
    }:Props){

    const [open, setOpen] = useState(false);

    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [fromShelf, setFromShelf] = useState("");
    const [toShelf, setToShelf] = useState("");
    const [reason, setReason] = useState("");


    const selectedProduct = inventory.find(
        product => product.id === productId
    );


    const warehouseShelves = shelves.filter(
        shelf =>
            shelf.warehouseId === selectedProduct?.warehouseId
    );


    function resetForm() {
        setProductId("");
        setQuantity(0);
        setFromShelf("");
        setToShelf("");
        setReason("");
    }


    function handleClose() {
        resetForm();
        setOpen(false);
    }


    function handleSubmit() {

        if (!selectedProduct) return;


        const task = {
            id: crypto.randomUUID(),

            productId: selectedProduct.id,
            productName: selectedProduct.name,

            warehouseId: selectedProduct.warehouseId,

            quantity,

            fromShelf,
            toShelf,

            requestedBy: "Admin",

            reason,

            status: "pending",
        };


        console.log(task);

        handleClose();
    }



    return (
        <>

            <button
                onClick={() => setOpen(true)}
                className="self-start bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            >
                Move Inventory
            </button>


            {open && (

                <Modal
                    title="Create Movement Task"
                    subtitle="Move products between shelves"
                    onClose={handleClose}
                >


                    <div className="p-5 flex flex-col gap-4">


                        <select
                            className="border border-border rounded-lg p-2"
                            value={productId}
                            onChange={(e) =>
                                setProductId(e.target.value)
                            }
                        >

                            <option value="" disabled>
                                Select product
                            </option>


                            {inventory
                            .filter(product => product.stock > 0)
                            .map(product => (

                                <option
                                    key={product.id}
                                    value={product.id}
                                >
                                    {product.name}
                                    {" "}
                                    ({product.stock} available)
                                </option>

                            ))}


                        </select>



                        <input
                            type="number"
                            className="border border-border rounded-lg p-2"
                            placeholder="Quantity"
                            min={1}
                            max={selectedProduct?.stock}
                            value={quantity || ""}
                            onChange={(e) => {
                                const value = Number(e.target.value);

                                if (!selectedProduct) return;

                                setQuantity(
                                    Math.min(
                                        Math.max(value, 1),
                                        selectedProduct.stock
                                    )
                                );
                            }}
                        />



                        <select
                            className="border border-border rounded-lg p-2"
                            value={fromShelf}
                            onChange={(e)=>
                                setFromShelf(e.target.value)
                            }
                        >

                            <option value="" disabled>
                                From shelf
                            </option>

                            
                            {warehouseShelves.filter(shelf => shelf.currentStock > 0)
                            .map(shelf => (

                                <option
                                    key={shelf.id}
                                    value={shelf.name}
                                >
                                    {shelf.name}
                                    {" "}
                                    ({shelf.currentStock})
                                </option>

                            ))}


                        </select>



                        <select
                            className="border border-border rounded-lg p-2"
                            value={toShelf}
                            onChange={(e)=>
                                setToShelf(e.target.value)
                            }
                        >

                            <option value="" disabled>
                                To shelf
                            </option>


                            {warehouseShelves.filter((shelf) => shelf.name !== fromShelf)
                            .map(shelf => (

                                <option
                                    key={shelf.id}
                                    value={shelf.name}
                                >
                                    {shelf.name}
                                    {" "}
                                    Free:
                                    {" "}
                                    {shelf.capacity - shelf.currentStock}
                                </option>

                            ))}


                        </select>



                        <textarea
                            className="border border-border rounded-lg p-2"
                            placeholder="Reason"
                            value={reason}
                            onChange={(e)=>
                                setReason(e.target.value)
                            }
                        />


                    </div>



                    <ModalFooter
                        onCancel={handleClose}
                        onConfirm={handleSubmit}
                        confirmLabel="Create Task"
                        disabled={
                            !productId ||
                            !quantity ||
                            !fromShelf ||
                            !toShelf
                        }
                    />


                </Modal>

            )}

        </>
    );
}