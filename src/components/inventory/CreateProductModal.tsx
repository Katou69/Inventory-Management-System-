"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalFooter, FormField } from "@/components/ui";
import ProductPreviewPanel from "./ProductPreviewPanel";

import { createProduct, getSuppliers, SupplierOption } from "@/services/inventory-service";
import { getCategories, Category } from "@/services/settings-service";
import { createProductSchema } from "@/schemas/product";

interface Props {
    warehouseId: number;
}

const emptyForm = {
    sku: "",
    name: "",
    categoryId: null as number | null,
    supplierId: null as number | null,
    unitPrice: "",
    unitCost: "",
    reorderLevel: "",
};

export default function CreateProductModal({ warehouseId }: Props) {

    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [confirmingClose, setConfirmingClose] = useState(false);

    const isDirty = !!(
        form.sku || form.name || form.categoryId || form.supplierId ||
        form.unitPrice || form.unitCost || form.reorderLevel || imagePreview
    );

    const parseResult = createProductSchema.safeParse({
        sku: form.sku,
        name: form.name,
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        unitPrice: form.unitPrice === "" ? NaN : Number(form.unitPrice),
        unitCost: form.unitCost === "" ? 0 : Number(form.unitCost),
        reorderLevel: form.reorderLevel === "" ? 0 : Number(form.reorderLevel),
        image: imagePreview,
    });
    const fieldErrors = parseResult.success ? {} : parseResult.error.flatten().fieldErrors;

    const skuError = touched.sku ? (fieldErrors.sku?.[0] ?? "") : "";
    const nameError = touched.name ? (fieldErrors.name?.[0] ?? "") : "";
    const unitPriceError = touched.unitPrice ? (fieldErrors.unitPrice?.[0] ?? "") : "";

    const canSubmit = parseResult.success;

    const categoryName = categories.find((c) => c.id === form.categoryId)?.name ?? "";
    const supplierName = suppliers.find((s) => s.id === form.supplierId)?.name ?? "";

    // Lazy-loaded only once the modal is actually opened, matching the
    // original modal's on-demand fetch rather than threading this data down
    // as props from the Server Component parent.
    useEffect(() => {
        if (!open) return;
        getCategories().then(setCategories).catch(() => setCategories([]));
        getSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
    }, [open]);


    function resetForm() {
        setForm(emptyForm);
        setImagePreview(null);
        setError(null);
        setTouched({});
        setConfirmingClose(false);
    }


    function requestClose() {
        if (isDirty) setConfirmingClose(true);
        else {
            setOpen(false);
            resetForm();
        }
    }


    function discardAndClose() {
        setOpen(false);
        resetForm();
    }


    async function handleSubmit() {
        setTouched({ sku: true, name: true, unitPrice: true });
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        setError(null);

        try {
            await createProduct(
                {
                    sku: form.sku.trim(),
                    name: form.name.trim(),
                    categoryId: form.categoryId ?? undefined,
                    supplierId: form.supplierId ?? undefined,
                    unitPrice: Number(form.unitPrice),
                    unitCost: form.unitCost === "" ? undefined : Number(form.unitCost),
                    reorderLevel: form.reorderLevel === "" ? undefined : Number(form.reorderLevel),
                    image: imagePreview ?? undefined,
                },
                warehouseId
            );

            router.refresh();
            setOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create product.");
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
                Add Product
            </button>


            {open && (

                <Modal title="Add Product" onClose={requestClose} size="lg">
                    <div className="p-5">

                        {confirmingClose && (
                            <div className="flex items-center justify-between gap-3 mb-4 px-3 py-2.5 rounded-lg border border-border bg-accent">
                                <span className="text-xs text-foreground">Discard unsaved changes?</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setConfirmingClose(false)} className="text-xs font-medium px-2.5 py-1 rounded-md border border-border hover:bg-card transition-colors">
                                        Keep editing
                                    </button>
                                    <button onClick={discardAndClose} className="text-xs font-medium px-2.5 py-1 rounded-md text-destructive border border-destructive/40 hover:bg-destructive/10 transition-colors">
                                        Discard
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-6">

                            <ProductPreviewPanel
                                photo={imagePreview}
                                onPhotoChange={setImagePreview}
                                name={form.name}
                                categoryName={categoryName}
                                supplierName={supplierName}
                                unitPrice={form.unitPrice === "" ? 0 : Number(form.unitPrice)}
                            />

                            <div className="flex-1 min-w-0 space-y-4">

                                <FormField label="SKU" required error={skuError}>
                                    <input
                                        className="modal-input"
                                        value={form.sku}
                                        onBlur={() => setTouched((t) => ({ ...t, sku: true }))}
                                        onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                                        placeholder="e.g. GSM-2201"
                                    />
                                </FormField>

                                <FormField label="Product name" required error={nameError}>
                                    <input
                                        className="modal-input"
                                        value={form.name}
                                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Grand Royal Smooth"
                                    />
                                </FormField>

                                <div className="grid grid-cols-2 gap-3">
                                    <FormField label="Category">
                                        <select
                                            className="modal-input"
                                            value={form.categoryId ?? ""}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, categoryId: e.target.value === "" ? null : Number(e.target.value) }))
                                            }
                                        >
                                            <option value="">No category</option>
                                            {categories
                                                .filter((c) => Number.isFinite(c.id))
                                                .map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                        </select>
                                    </FormField>

                                    <FormField label="Supplier">
                                        <select
                                            className="modal-input"
                                            value={form.supplierId ?? ""}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, supplierId: e.target.value === "" ? null : Number(e.target.value) }))
                                            }
                                        >
                                            <option value="">No supplier</option>
                                            {suppliers
                                                .filter((s) => Number.isFinite(s.id))
                                                .map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                        </select>
                                    </FormField>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <FormField label="Unit price" required error={unitPriceError}>
                                        <input
                                            type="number"
                                            className="modal-input"
                                            min={0}
                                            step={0.01}
                                            value={form.unitPrice}
                                            onBlur={() => setTouched((t) => ({ ...t, unitPrice: true }))}
                                            onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                                        />
                                    </FormField>

                                    <FormField label="Unit cost">
                                        <input
                                            type="number"
                                            className="modal-input"
                                            min={0}
                                            step={0.01}
                                            value={form.unitCost}
                                            onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                                        />
                                    </FormField>

                                    <FormField label="Reorder level">
                                        <input
                                            type="number"
                                            className="modal-input"
                                            min={0}
                                            value={form.reorderLevel}
                                            onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))}
                                        />
                                    </FormField>
                                </div>

                                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

                            </div>
                        </div>
                    </div>

                    <ModalFooter
                        onCancel={requestClose}
                        onConfirm={handleSubmit}
                        confirmLabel="Add Product"
                        disabled={submitting}
                        loading={submitting}
                    />

                </Modal>

            )}

        </>
    );
}
