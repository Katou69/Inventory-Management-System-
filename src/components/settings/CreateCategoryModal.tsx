"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ModalFooter from "@/components/ui/ModalFooter";

import { createCategory, Category } from "@/services/settings-service";

interface Props {
    onCreated: (category: Category) => void;
}

export default function CreateCategoryModal({ onCreated }: Props) {

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);


    function resetForm() {
        setName("");
        setError(null);
    }


    function handleClose() {
        resetForm();
        setOpen(false);
    }


    async function handleSubmit() {

        if (!name.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const category = await createCategory(name.trim());
            onCreated(category);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create category.");
        } finally {
            setSubmitting(false);
        }
    }


    return (
        <>

            <button
                onClick={() => setOpen(true)}
                className="btn-primary flex items-center gap-1"
            >
                <Plus className="w-3.5 h-3.5" /> Add
            </button>


            {open && (

                <Modal
                    title="Add Category"
                    subtitle="Create a new product category"
                    onClose={handleClose}
                >

                    <div className="p-5 flex flex-col gap-4">

                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Category name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                    </div>

                    <ModalFooter
                        onCancel={handleClose}
                        onConfirm={handleSubmit}
                        confirmLabel={submitting ? "Adding..." : "Add Category"}
                        disabled={submitting || !name.trim()}
                    />

                </Modal>

            )}

        </>
    );
}
