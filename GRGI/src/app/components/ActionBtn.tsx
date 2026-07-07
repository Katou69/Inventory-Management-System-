export default function ActionBtn({ icon: Icon, danger }: { icon: React.ElementType; danger?: boolean }) {
  return (
    <button className={`p-1.5 rounded transition-colors ${danger ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
