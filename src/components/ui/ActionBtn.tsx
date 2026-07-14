type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ElementType;
  danger?: boolean;
};

export default function ActionBtn({ icon: Icon, danger, className, ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`p-1.5 rounded transition-colors ${danger ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"} ${className ?? ""}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
