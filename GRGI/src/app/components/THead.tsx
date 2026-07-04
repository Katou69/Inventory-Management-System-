type ColDef = string | { label: string; hide?: "sm" | "md" | "lg"; right?: boolean };

export default function THead({ cols }: { cols: ColDef[] }) {
  return (
    <tr className="border-b border-border bg-secondary/40">
      {cols.map((c, i) => {
        const label = typeof c === "string" ? c : c.label;
        const hide = typeof c === "string" ? undefined : c.hide;
        const right = typeof c === "string" ? false : c.right;
        return (
          <th
            key={i}
            className={`text-left px-4 py-2.5 text-[10px] font-mono font-medium text-muted-foreground tracking-wider
              ${hide === "sm" ? "hidden sm:table-cell" : hide === "md" ? "hidden md:table-cell" : hide === "lg" ? "hidden lg:table-cell" : ""}
              ${right ? "text-right" : ""}
            `}
          >
            {label}
          </th>
        );
      })}
    </tr>
  );
}
