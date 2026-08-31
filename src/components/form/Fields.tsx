import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Num } from "@/lib/types";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={"space-y-1.5 " + className}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  hint?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  rows?: number | undefined;
}) {
  return (
    <Field label={label}>
      <Textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: Num;
  onChange: (v: Num) => void;
  prefix?: string | undefined;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <Input
          type="number"
          inputMode="decimal"
          className={prefix ? "pl-7" : ""}
          value={value === null ? "" : String(value)}
          placeholder="—"
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </div>
    </Field>
  );
}

export function SectionCard({
  title,
  eyebrow,
  children,
  toggle,
  onToggle,
  required,
}: {
  title: string;
  children: ReactNode;
  eyebrow?: string | undefined;
  toggle?: boolean | undefined;
  onToggle?: ((v: boolean) => void) | undefined;
  required?: boolean | undefined;
}) {
  const open = toggle === undefined ? true : toggle;
  return (
    <section className="panel overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-secondary/50 px-5 py-4">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        </div>
        {required ? (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            Required
          </span>
        ) : onToggle ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {open ? "Included" : "Skipped"}
            </span>
            <Switch checked={open} onCheckedChange={onToggle} />
          </div>
        ) : null}
      </header>
      {open ? <div className="space-y-5 p-5">{children}</div> : null}
    </section>
  );
}

export function RepeatList({
  items,
  onAdd,
  addLabel,
  onRemove,
  render,
  empty,
}: {
  items: { id: string }[];
  onAdd: () => void;
  addLabel: string;
  onRemove: (id: string) => void;
  render: (id: string, index: number) => ReactNode;
  empty?: string | undefined;
}) {
  return (
    <div className="space-y-3">
      {items.length === 0 && empty ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : null}
      {items.map((item, i) => (
        <div
          key={item.id}
          className="relative rounded-md border border-border bg-secondary/30 p-4 pr-11"
        >
          {render(item.id, i)}
          <button
            type="button"
            aria-label="Remove"
            onClick={() => onRemove(item.id)}
            className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-1 h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}
