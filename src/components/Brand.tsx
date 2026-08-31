import { Link } from "@tanstack/react-router";
import { CHAPTER } from "@/lib/format";

export function BniMark({ className = "" }: { className?: string }) {
  return (
    <span className={"inline-flex items-center gap-2 " + className} aria-label="BNI Elites">
      <span className="flex h-9 items-center rounded-sm bg-primary px-2 font-display text-2xl font-bold leading-none tracking-tight text-primary-foreground">
        BNI
        <span className="ml-[3px] mt-[7px] block h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-ink">
          Elites
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Chapter
        </span>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <BniMark />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Link
            to="/"
            className="rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 font-medium text-ink-soft transition-colors hover:bg-secondary"
            activeProps={{ className: "bg-secondary text-ink" }}
            activeOptions={{ exact: true }}
          >
            Archive
          </Link>
          <Link
            to="/new"
            className="rounded-md bg-primary px-3 sm:px-4 py-1.5 sm:py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            New Entry
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-border py-8 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {CHAPTER} · Weekly Meeting Record
      </p>
    </footer>
  );
}
