import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listMeetings } from "@/lib/storage";
import type { Meeting } from "@/lib/types";
import { CHAPTER, compactMoney, coverPhoto, fmtNum, longDate, shortDate } from "@/lib/format";
import { SiteFooter, SiteHeader } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarPlus, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${CHAPTER} — Weekly Meeting Archive` },
      {
        name: "description",
        content: `Browse every ${CHAPTER} chapter meeting: scorecards, recognitions, photos and week-over-week referral and business trends.`,
      },
      { property: "og:title", content: `${CHAPTER} — Weekly Meeting Archive` },
      {
        property: "og:description",
        content: `Every ${CHAPTER} weekly meeting record in one polished, shareable archive.`,
      },
    ],
  }),
  component: Archive,
});

function Archive() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);

  useEffect(() => {
    void listMeetings().then(setMeetings);
  }, []);

  const list = meetings ?? [];
  const chartData = [...list].reverse().map((m) => ({
    date: shortDate(m.date).replace(/ \d{4}$/, ""),
    referrals: m.scorecard.referrals ?? 0,
    business: m.scorecard.business ?? 0,
  }));

  const totals = list.reduce(
    (acc, m) => ({
      referrals: acc.referrals + (m.scorecard.referrals ?? 0),
      business: acc.business + (m.scorecard.business ?? 0),
      visitors: acc.visitors + (m.scorecard.visitors ?? 0),
    }),
    { referrals: 0, business: 0, visitors: 0 },
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 sm:px-4 py-6 sm:py-10">
        <section className="mb-8 sm:mb-10">
          <p className="eyebrow">{CHAPTER}</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase leading-none text-ink">
            Meeting Archive
          </h1>
          <div className="rule-red mt-3 sm:mt-4 w-32 sm:w-40" />
          <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base text-ink-soft">
            Every week's chapter record — scorecards, recognitions, photos and attachments — kept as
            one continuous publication.
          </p>
        </section>

        {list.length > 0 ? (
          <section className="mb-8 sm:mb-10 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {[
              ["Meetings recorded", String(list.length)],
              ["Referrals passed", totals.referrals.toLocaleString("en-IN")],
              ["Business generated", compactMoney(totals.business)],
            ].map(([label, value]) => (
              <div key={label} className="panel p-4 sm:p-5">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 font-display text-3xl sm:text-4xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </section>
        ) : null}

        {chartData.length > 1 ? (
          <section className="panel mb-8 sm:mb-10 p-4 sm:p-6">
            <div className="mb-4 sm:mb-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg sm:text-xl font-semibold uppercase tracking-wide text-ink">
                Week-over-week trend
              </h2>
            </div>
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
              <div>
                <p className="eyebrow mb-2 sm:mb-3">Referrals passed</p>
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={32} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="referrals" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2 sm:mb-3">Business generated (₹)</p>
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="biz" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="var(--muted-foreground)"
                        width={52}
                        tickFormatter={(v: number) => compactMoney(v)}
                      />
                      <Tooltip
                        formatter={(v: number) => compactMoney(v)}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="business"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#biz)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 sm:mb-4 font-display text-lg sm:text-xl font-semibold uppercase tracking-wide text-ink">
            All meetings
          </h2>
          {meetings === null ? (
            <p className="text-sm text-muted-foreground">Loading archive…</p>
          ) : list.length === 0 ? (
            <div className="panel flex flex-col items-center gap-4 px-4 sm:px-6 py-12 sm:py-16 text-center">
              <CalendarPlus className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink">
                  No meetings recorded yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create this week's entry and it will appear here permanently.
                </p>
              </div>
              <Button asChild size="lg">
                <Link to="/new">Create first entry</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {list.map((m) => {
                const cover = coverPhoto(m);
                return (
                  <Link
                    key={m.id}
                    to="/meeting/$id"
                    params={{ id: m.id }}
                    className="panel group flex overflow-hidden transition-shadow hover:shadow-lift"
                  >
                    <div className="w-24 sm:w-28 shrink-0 bg-secondary">
                      {cover ? (
                        <img src={cover.dataUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-primary/10">
                          <span className="font-display text-xl sm:text-2xl font-bold text-primary">
                            BNI
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                      <p className="font-display text-base sm:text-lg font-semibold text-ink truncate">
                        {longDate(m.date)}
                      </p>
                      {m.venue ? (
                        <p className="truncate text-xs text-muted-foreground">{m.venue}</p>
                      ) : null}
                      <div className="mt-3 sm:mt-4 flex items-end gap-3 sm:gap-6">
                        <div>
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">
                            Referrals
                          </p>
                          <p className="font-display text-xl sm:text-2xl font-bold text-ink">
                            {fmtNum(m.scorecard.referrals) === "not recorded"
                              ? "—"
                              : fmtNum(m.scorecard.referrals)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">
                            Business
                          </p>
                          <p className="font-display text-xl sm:text-2xl font-bold text-primary">
                            {compactMoney(m.scorecard.business)}
                          </p>
                        </div>
                        <ArrowRight className="mb-1 ml-auto h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
