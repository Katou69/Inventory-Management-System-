"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";

import { getShelvesForProduct, createMovementTask, ShelfOption } from "@/services/inventory-service";
import { InventoryItem } from "@/types/inventory";


interface Props {
    inventory: InventoryItem[];
    warehouseId: number;
}

export default function CreateMovementModal({
        inventory,
        warehouseId,
    }: Props) {

    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [fromShelfId, setFromShelfId] = useState<number | "">("");
    const [toShelfId, setToShelfId] = useState<number | "">("");
    const [reason, setReason] = useState("");

    const [shelfOptions, setShelfOptions] = useState<ShelfOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedProduct = inventory.find(
        product => product.id === productId
    );

    // Shelves are matched by product NAME on the backend (ZoneStockEntry has
    // no product FK, only a joined display name), so re-fetch whenever the
    // selected product changes.
    useEffect(() => {
        if (!selectedProduct) {
            setShelfOptions([]);
            return;
        }
        getShelvesForProduct(warehouseId, selectedProduct.name)
            .then(setShelfOptions)
            .catch(() => setShelfOptions([]));
    }, [selectedProduct?.name, warehouseId]);

    const fromOptions = shelfOptions.filter(s => s.stockOfProduct > 0);
    const toOptions = shelfOptions.filter(
        s => s.id !== fromShelfId && (s.capacity - s.totalOccupied) > 0
    );


    function resetForm() {
        setProductId("");
        setQuantity(0);
        setFromShelfId("");
        setToShelfId("");
        setReason("");
        setError(null);
    }


    function handleClose() {
        resetForm();
        setOpen(false);
    }


    async function handleSubmit() {

        if (!selectedProduct || fromShelfId === "" || toShelfId === "") return;

        setSubmitting(true);
        setError(null);

        try {
            await createMovementTask(warehouseId, {
                productId: selectedProduct.id,
                quantity,
                fromShelfId: Number(fromShelfId),
                toShelfId: Number(toShelfId),
                reason,
            });

            router.refresh();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create task.");
        } finally {
            setSubmitting(false);
        }
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
                            onChange={(e) => {
                                setProductId(e.target.value);
                                setFromShelfId("");
                                setToShelfId("");
                            }}
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
                            value={fromShelfId}
                            onChange={(e)=>
                                setFromShelfId(Number(e.target.value))
                            }
                        >

                            <option value="" disabled>
                                From shelf
                            </option>


                            {fromOptions.map(shelf => (

                                <option
                                    key={shelf.id}
                                    value={shelf.id}
                                >
                                    {shelf.name}
                                    {" "}
                                    ({shelf.stockOfProduct})
                                </option>

                            ))}


                        </select>



                        <select
                            className="border border-border rounded-lg p-2"
                            value={toShelfId}
                            onChange={(e)=>
                                setToShelfId(Number(e.target.value))
                            }
                        >

                            <option value="" disabled>
                                To shelf
                            </option>


                            {toOptions.map(shelf => (

                                <option
                                    key={shelf.id}
                                    value={shelf.id}
                                >
                                    {shelf.name}
                                    {" "}
                                    Free:
                                    {" "}
                                    {shelf.capacity - shelf.totalOccupied}
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

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}


                    </div>



                    <ModalFooter
                        onCancel={handleClose}
                        onConfirm={handleSubmit}
                        confirmLabel={submitting ? "Creating..." : "Create Task"}
                        disabled={
                            submitting ||
                            !productId ||
                            !quantity ||
                            fromShelfId === "" ||
                            toShelfId === ""
                        }
                    />


                </Modal>

            )}

        </>
    );
}
