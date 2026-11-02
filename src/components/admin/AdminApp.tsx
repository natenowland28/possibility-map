"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Keyboard,
  Lock,
  LogOut,
  Mail,
  Mic,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Section } from "@/config/methodology";
import type { SessionRecord } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button, cn } from "@/components/ui";

interface AdminData {
  sessions: SessionRecord[];
  config: { ai: "claude" | "demo"; model: string; storage: string; emailNotifications: boolean; defaultPassword: boolean };
  methodology: { instructions: string; sections: Section[] };
}

const PW_KEY = "possibility-map:admin";
const SECTION_IDS = ["ideal", "vision", "vector"] as const;
const TITLES = { ideal: "Ideal", vision: "Vision", vector: "Vector" };

function ago(iso?: string) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function duration(a: string, b?: string) {
  if (!b) return "—";
  const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function sectionStage(r: SessionRecord, id: (typeof SECTION_IDS)[number]) {
  const s = r.sections[id];
  if (s.completedAt) return 3;
  if (s.themes) return 2;
  if (s.observations) return 1;
  if (Object.values(s.answers).some((a) => a.trim())) return 0.5;
  return 0;
}

function themesText(r: SessionRecord) {
  const lines = [`${r.name || "Participant"} — ${r.email || "no email yet"}`, ""];
  for (const id of SECTION_IDS) {
    lines.push(TITLES[id].toUpperCase());
    (r.sections[id].themes ?? []).forEach((t, i) => lines.push(`${i + 1}. ${t.heading}`, `   ${t.body}`, ""));
  }
  return lines.join("\n");
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: SessionRecord[]) {
  const head = ["Name", "Email", "Status", "Started", "Submitted"];
  for (const id of SECTION_IDS) for (let i = 1; i <= 5; i++) head.push(`${TITLES[id]} ${i} heading`, `${TITLES[id]} ${i} text`);
  const q = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) => {
    const cells = [r.name, r.email, r.status, r.startedAt, r.submittedAt ?? ""];
    for (const id of SECTION_IDS) {
      const t = r.sections[id].themes ?? [];
      for (let i = 0; i < 5; i++) cells.push(t[i]?.heading ?? "", t[i]?.body ?? "");
    }
    return cells.map(q).join(",");
  });
  return [head.map(q).join(","), ...body].join("\n");
}

function Login({ onLogin, error }: { onLogin: (pw: string) => void; error: string | null }) {
  const [pw, setPw] = useState("");
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onLogin(pw);
        }}
        className="glass w-full max-w-sm rounded-3xl p-8"
      >
        <Logo />
        <div className="mt-8 grid size-11 place-items-center rounded-full bg-ink text-white">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display mt-4 text-3xl text-ink">Facilitator access</h1>
        <p className="mt-1 text-sm text-ink-soft">View participants&apos; approved themes and responses.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="mt-6 h-12 w-full rounded-full border border-line bg-white/80 px-5 text-ink focus:border-ink/20 focus:outline-none focus:ring-4 focus:ring-ink/5"
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="mt-4 w-full" disabled={!pw}>
          Sign in
        </Button>
        <p className="mt-4 text-center text-xs text-muted">
          Demo password: <code className="rounded bg-ink/5 px-1.5 py-0.5">possibility</code>
        </p>
      </form>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string | number; tone: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        <Icon className={cn("size-4", tone)} />
      </div>
      <div className="font-display mt-2 text-4xl text-ink">{value}</div>
    </div>
  );
}

function Detail({ r, onDelete }: { r: SessionRecord; onDelete: () => void }) {
  const [tab, setTab] = useState<"themes" | "observations" | "answers">("themes");
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<(typeof SECTION_IDS)[number] | "all">("all");

  const copy = async () => {
    await navigator.clipboard.writeText(themesText(r));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const ids = section === "all" ? SECTION_IDS : [section];

  return (
    <motion.div
      key={r.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-3xl text-ink">{r.name || "Unnamed participant"}</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                r.status === "submitted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {r.status === "submitted" ? "Submitted" : "In progress"}
            </span>
          </div>
          {r.email ? (
            <a href={`mailto:${r.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-vision hover:underline">
              <Mail className="size-3.5" /> {r.email}
            </a>
          ) : (
            <p className="mt-1 text-sm text-muted">No email yet</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span>Started {new Date(r.startedAt).toLocaleString()}</span>
            {r.submittedAt && <span>Submitted {new Date(r.submittedAt).toLocaleString()}</span>}
            {r.submittedAt && <span>Took {duration(r.startedAt, r.submittedAt)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
            {copied ? "Copied" : "Copy themes"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="size-4" />}
            onClick={() => download(`${(r.name || "participant").toLowerCase()}-possibility-map.json`, JSON.stringify(r, null, 2), "application/json")}
          >
            JSON
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={onDelete} aria-label="Delete" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-1">
          {(["themes", "observations", "answers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-3 py-2.5 text-sm font-medium capitalize transition-colors cursor-pointer",
                tab === t ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {t}
              {tab === t && <motion.span layoutId="tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
            </button>
          ))}
        </div>
        <div className="mb-2 flex gap-1 rounded-full bg-ink/5 p-1 text-xs">
          {(["all", ...SECTION_IDS] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium capitalize transition cursor-pointer",
                section === s ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {ids.map((id) => {
          const s = r.sections[id];
          return (
            <section key={id} data-section={id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-accent" />
                <h3 className="font-display text-xl text-ink">{TITLES[id]}</h3>
                {s.completedAt && <CheckCircle2 className="size-4 text-accent" />}
              </div>

              {tab === "themes" &&
                (s.themes?.length ? (
                  <ol className="grid gap-3 md:grid-cols-2">
                    {s.themes.map((t, i) => (
                      <li key={t.id} className="rounded-2xl border border-line bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-display text-lg leading-snug text-ink">
                            <span className="text-accent">{i + 1}.</span> {t.heading}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {t.edited && (
                              <span title="Edited by participant" className="rounded-full bg-ink/5 p-1 text-ink-soft">
                                <PencilLine className="size-3" />
                              </span>
                            )}
                            {t.approved && (
                              <span title="Approved" className="rounded-full bg-accent-soft p-1 text-accent">
                                <Check className="size-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t.body}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted">No themes yet.</p>
                ))}

              {tab === "observations" &&
                (s.observations?.length ? (
                  <ul className="space-y-2.5">
                    {s.observations.map((o) => (
                      <li key={o.id} className="rounded-2xl border border-line bg-white/70 p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              o.status === "confirmed" && "bg-accent-soft text-accent",
                              o.status === "corrected" && "bg-ink text-white",
                              o.status === "pending" && "bg-ink/5 text-muted",
                            )}
                          >
                            {o.status}
                          </span>
                          <div className="text-sm leading-relaxed">
                            <p className={cn("text-ink", o.status === "corrected" && "text-ink/50 line-through")}>{o.text}</p>
                            {o.correction && (
                              <p className="mt-2 rounded-xl bg-bg-deep px-3 py-2 text-ink">
                                <span className="font-semibold">Their words: </span>
                                {o.correction}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No observations yet.</p>
                ))}

              {tab === "answers" && <Answers record={r} id={id} />}
            </section>
          );
        })}
      </div>
    </motion.div>
  );
}

let questionCache: Section[] = [];
function Answers({ record, id }: { record: SessionRecord; id: (typeof SECTION_IDS)[number] }) {
  const s = record.sections[id];
  const section = questionCache.find((x) => x.id === id);
  const entries = section
    ? section.questions.map((q) => ({ q: q.prompt, id: q.id }))
    : Object.keys(s.answers).map((k) => ({ q: k, id: k }));
  return (
    <dl className="space-y-3">
      {entries.map((e) => (
        <div key={e.id} className="rounded-2xl border border-line bg-white/70 p-4">
          <dt className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
            {e.q}
            {s.inputMode?.[e.id] && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">
                {s.inputMode[e.id] === "voice" ? <Mic className="size-3" /> : <Keyboard className="size-3" />}
                {s.inputMode[e.id]}
              </span>
            )}
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
            {s.answers[e.id]?.trim() || <span className="text-muted italic">No answer yet</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Methodology({ m }: { m: AdminData["methodology"] }) {
  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-2xl text-ink">AI instructions</h2>
        <p className="mt-1 text-sm text-muted">
          Edit in <code className="rounded bg-ink/5 px-1.5 py-0.5">src/config/methodology.ts</code>
        </p>
        <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-ink p-5 text-[13px] leading-relaxed whitespace-pre-wrap text-white/85">
          {m.instructions}
        </pre>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {m.sections.map((s) => (
          <div key={s.id} data-section={s.id} className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-accent" />
              <h3 className="font-display text-2xl text-ink">{s.title}</h3>
            </div>
            <p className="mt-1 text-sm text-accent italic">{s.tagline}</p>
            <p className="mt-3 rounded-xl bg-accent-soft/60 p-3 text-xs leading-relaxed text-ink-soft">
              <strong className="text-ink">AI focus: </strong>
              {s.aiFocus}
            </p>
            <ol className="mt-4 space-y-3">
              {s.questions.map((q, i) => (
                <li key={q.id} className="text-sm">
                  <div className="font-medium text-ink">
                    {i + 1}. {q.prompt}
                  </div>
                  <div className="mt-0.5 text-ink-soft">{q.hint}</div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminApp() {
  const [password, setPassword] = useState<string | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"participants" | "methodology">("participants");
  const [filter, setFilter] = useState<"all" | "submitted" | "in_progress">("all");

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "x-admin-password": pw } });
      if (res.status === 401) {
        sessionStorage.removeItem(PW_KEY);
        setPassword(null);
        setError("That password isn't right.");
        return;
      }
      const json = (await res.json()) as AdminData;
      questionCache = json.methodology.sections;
      setData(json);
      setPassword(pw);
      try {
        sessionStorage.setItem(PW_KEY, pw);
      } catch {}
      setSelected((cur) => cur ?? json.sessions[0]?.id ?? null);
    } catch {
      setError("Couldn't load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(PW_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved login after mount
    if (saved) load(saved);
  }, [load]);

  const sessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.sessions ?? []).filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)),
    );
  }, [data, query, filter]);

  if (!password || !data) return <Login onLogin={load} error={error} />;

  const all = data.sessions;
  const submitted = all.filter((s) => s.status === "submitted");
  const current = all.find((s) => s.id === selected) ?? null;
  const avg =
    submitted.length > 0
      ? Math.round(
          submitted.reduce((n, s) => n + (new Date(s.submittedAt!).getTime() - new Date(s.startedAt).getTime()), 0) /
            submitted.length /
            60000,
        )
      : null;

  const remove = async (id: string) => {
    if (!confirm("Delete this participant's data? This can't be undone.")) return;
    await fetch("/api/admin", {
      method: "DELETE",
      headers: { "x-admin-password": password, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    load(password);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
          </Link>
          <span className="hidden rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white sm:inline">Facilitator</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden gap-1 rounded-full bg-ink/5 p-1 text-sm md:flex">
              {(["participants", "methodology"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-medium capitalize transition cursor-pointer",
                    view === v ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" onClick={() => load(password)} loading={loading} icon={<RefreshCw className="size-4" />}>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<FileSpreadsheet className="size-4" />}
              onClick={() => download("possibility-map-themes.csv", toCSV(all), "text/csv")}
              disabled={!all.length}
            >
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<FileJson className="size-4" />}
              onClick={() => download("possibility-map-export.json", JSON.stringify(all, null, 2), "application/json")}
              disabled={!all.length}
            >
              <span className="hidden sm:inline">JSON</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Sign out"
              icon={<LogOut className="size-4" />}
              onClick={() => {
                try {
                  sessionStorage.removeItem(PW_KEY);
                } catch {}
                setPassword(null);
                setData(null);
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-light text-ink">Participants</h1>
            <p className="mt-1 text-ink-soft">Approved themes arrive here the moment someone finishes.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={cn("rounded-full px-3 py-1 font-medium", data.config.ai === "claude" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
              AI: {data.config.ai === "claude" ? data.config.model : "demo mode"}
            </span>
            <span className="rounded-full bg-ink/5 px-3 py-1 font-medium text-ink-soft">Storage: {data.config.storage}</span>
            <span className={cn("rounded-full px-3 py-1 font-medium", data.config.emailNotifications ? "bg-emerald-50 text-emerald-700" : "bg-ink/5 text-ink-soft")}>
              Email alerts: {data.config.emailNotifications ? "on" : "off"}
            </span>
          </div>
        </div>

        {data.config.defaultPassword && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            You&apos;re using the demo password. Set <code>ADMIN_PASSWORD</code> before sharing the link with participants.
          </p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Participants" value={all.length} tone="text-vision" />
          <Stat icon={CheckCircle2} label="Submitted" value={submitted.length} tone="text-vector" />
          <Stat icon={Clock} label="In progress" value={all.length - submitted.length} tone="text-ideal" />
          <Stat icon={Clock} label="Avg. completion" value={avg ? `${avg}m` : "—"} tone="text-ink-soft" />
        </div>

        {view === "methodology" ? (
          <div className="mt-8">
            <Methodology m={data.methodology} />
          </div>
        ) : all.length === 0 ? (
          <div className="glass mt-8 rounded-3xl p-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-vision-soft text-vision">
              <Users className="size-6" />
            </div>
            <h2 className="font-display mt-4 text-2xl text-ink">No participants yet</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-soft">
              Share the journey link with your test participants. Their progress appears here as they go.
            </p>
            <Link href="/journey" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white">
              Try the journey yourself
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
            <aside className={cn("space-y-3", current && "hidden lg:block")}>
              <div className="relative">
                <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or email"
                  className="h-11 w-full rounded-full border border-line bg-white/70 pr-4 pl-10 text-sm text-ink focus:border-ink/20 focus:outline-none"
                />
              </div>
              <div className="flex gap-1 text-xs">
                {(["all", "submitted", "in_progress"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded-full px-3 py-1 font-medium transition cursor-pointer",
                      filter === f ? "bg-ink text-white" : "bg-ink/5 text-ink-soft hover:text-ink",
                    )}
                  >
                    {f === "all" ? "All" : f === "submitted" ? "Submitted" : "In progress"}
                  </button>
                ))}
              </div>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {sessions.map((s) => (
                    <motion.li key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <button
                        onClick={() => setSelected(s.id)}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition cursor-pointer",
                          selected === s.id ? "border-ink/20 bg-white shadow-soft" : "border-line bg-white/50 hover:bg-white/80",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ideal via-vision to-vector font-display text-white">
                            {(s.name || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-medium text-ink">{s.name || "Unnamed"}</span>
                              <span className="shrink-0 text-xs text-muted">{ago(s.updatedAt)}</span>
                            </div>
                            <div className="truncate text-xs text-ink-soft">{s.email || "—"}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          {SECTION_IDS.map((id) => {
                            const st = sectionStage(s, id);
                            return (
                              <div key={id} data-section={id} className="flex-1">
                                <div className="h-1 overflow-hidden rounded-full bg-ink/5">
                                  <div className="h-full rounded-full bg-accent" style={{ width: `${(st / 3) * 100}%` }} />
                                </div>
                                <div className="mt-1 text-[10px] font-medium text-muted">{TITLES[id]}</div>
                              </div>
                            );
                          })}
                          <span
                            className={cn(
                              "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              s.status === "submitted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                            )}
                          >
                            {s.status === "submitted" ? "Done" : "Active"}
                          </span>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {!sessions.length && <li className="p-4 text-sm text-muted">No matches.</li>}
              </ul>
            </aside>

            <div className={cn(!current && "hidden lg:block")}>
              {current ? (
                <>
                  <button
                    onClick={() => setSelected(null)}
                    className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-soft lg:hidden"
                  >
                    <ArrowLeft className="size-4" /> All participants
                  </button>
                  <Detail r={current} onDelete={() => remove(current.id)} />
                </>
              ) : (
                <div className="glass grid h-64 place-items-center rounded-3xl text-ink-soft">Select a participant</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
