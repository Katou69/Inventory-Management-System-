export default function GlobalStyles() {
  return (
    <style>{`
      .select-sm {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--input-background);
        color: var(--foreground);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .select-sm:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
      .btn-primary {
        padding: 0.5rem 1rem;
        background: var(--primary);
        color: var(--primary-foreground);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        transition: opacity 0.15s;
        cursor: pointer;
        white-space: nowrap;
      }
      .btn-primary:hover { opacity: 0.9; }
      .modal-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--input-background);
        color: var(--foreground);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .modal-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
      .field-input {
        width: 100%;
        padding: 0.625rem 1rem 0.625rem 2.25rem;
        font-size: 0.875rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--input-background);
        color: var(--foreground);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .field-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
      * { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
    `}</style>
  );
}
