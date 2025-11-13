"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/**
 * This component is robust to mismatched backend ports:
 * - It tries process.env.NEXT_PUBLIC_API_BASE first
 * - then tries same origin (window.location.origin)
 * - then tries a small list of common localhost ports
 *
 * It will pick the first base that answers the candidate-options endpoint OK.
 * This helps when you run frontend at :8080 and backend at :30020 etc.
 */

const ENV_BASE = process.env.NEXT_PUBLIC_API_BASE;
const COMMON_LOCALHOST_PORTS = [30020, 30018, 3000, 3001, 8000, 8080];

const RECRUITERS = [
  "Muni Divya",
  "Surya K",
  "Thameem Ansari",
  "Nandhini Kumaravel",
  "Dhivya V",
  "Gokulakrishna V",
  "Snehal Prakash",
  "Selvaraj Veilumuthu",
] as const;

const SOURCES = [
  "Linked-in",
  "Job hai",
  "Apna",
  "Meta",
  "EarlyJobs",
  "Others",
] as const;

const STATUS = [
  "Applied",
  "Interview Scheduled",
  "Qualified",
  "Rejected",
  "Offer",
  "Joined",
] as const;

export type CandidateOption = {
  id: number;
  full_name: string;
  job_position?: string | null;
  company?: string | null;
};

export type JobOption = {
  id: number;
  title: string;
  company?: string | null;
};

export type ApplicationRecord = {
  id?: number;
  candidate_id?: number | null;
  candidate_name?: string | null;
  job_id?: number | null;
  job_title?: string | null;
  company?: string | null;
  status?: string | null;
  sourced_by?: string | null;
  sourced_from?: string | null;
  assigned_to?: string | null;
  applied_on?: string | null; // YYYY-MM-DD
  comments?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationRecord;
  onSuccess: () => void;
}

function trim(s?: string | null) {
  return (s ?? "").trim();
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function toStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

/* try a list of candidate base URLs, return the first that gives a 2xx for /api/applications/candidate-options */
async function findWorkingApiBase(): Promise<string> {
  const tries: string[] = [];

  if (ENV_BASE) tries.push(ENV_BASE.replace(/\/+$/, ""));

  // same origin (works if backend proxied)
  if (typeof window !== "undefined") {
    try {
      const origin = window.location.origin;
      if (origin) tries.push(origin);
    } catch {
      /* ignore */
    }
  }

  // add common localhost ports
  for (const p of COMMON_LOCALHOST_PORTS) {
    const s = `http://127.0.0.1:${p}`;
    if (!tries.includes(s)) tries.push(s);
    const s2 = `http://localhost:${p}`;
    if (!tries.includes(s2)) tries.push(s2);
  }

  // helper to fetch with a short timeout
  const fetchWithTimeout = async (url: string, timeout = 1500): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  for (const base of tries) {
    try {
      const url = `${base.replace(/\/+$/, "")}/api/applications/candidate-options`;
      const r = await fetchWithTimeout(url, 1500);
      if (r.ok) {
        // success
        return base.replace(/\/+$/, "");
      } else {
        // non-2xx -> continue
      }
    } catch {
      // network error/timeout -> try next
    }
  }
  throw new Error("No reachable API base found");
}

export default function ApplicationDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [candLoading, setCandLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  const initialForm: ApplicationRecord = {
    candidate_id: null,
    candidate_name: "",
    job_id: null,
    job_title: "",
    company: "",
    status: "Applied",
    sourced_by: RECRUITERS[0],
    sourced_from: "Linked-in",
    assigned_to: RECRUITERS[0],
    applied_on: new Date().toISOString().slice(0, 10),
    comments: "",
  };

  const [form, setForm] = useState<ApplicationRecord>(initialForm);

  // stored working base to avoid re-probing each time while dialog is open
  const [apiBase, setApiBase] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;

    (async () => {
      setCandLoading(true);
      try {
        // find working base if not yet found
        let base = apiBase;
        if (!base) {
          base = await findWorkingApiBase();
          if (!alive) return;
          setApiBase(base);
        }

        const res = await fetch(`${base}/api/applications/candidate-options`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();
        if (!Array.isArray(json)) throw new Error("Invalid response shape");
        const parsed: CandidateOption[] = [];
        for (const el of json) {
          if (!isRecord(el)) continue;
          const id = toNum(el.id);
          const full_name = toStr(el.full_name);
          if (id == null || full_name == null) continue;
          parsed.push({
            id,
            full_name,
            job_position: toStr(el.job_position),
            company: toStr(el.company),
          });
        }
        if (alive) {
          setCandidates(parsed);
        }
      } catch (err) {
        console.error("load candidates options", err);
        toast.error("Failed to load candidate options");
        if (alive) setCandidates([]);
      } finally {
        if (alive) setCandLoading(false);
      }
    })();

    // optional: fetch jobs too (best-effort)
    (async () => {
      setJobsLoading(true);
      try {
        const base =
          apiBase ??
          ENV_BASE ??
          (typeof window !== "undefined" ? window.location.origin : null);
        if (!base) throw new Error("no api base available for jobs");
        const res = await fetch(`${base}/api/jobs?page=1&page_size=1000`);
        if (!res.ok) {
          if (res.status === 404) {
            if (alive) setJobs([]);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json: unknown = await res.json();
        const items: unknown[] =
          isRecord(json) && Array.isArray(json.items)
            ? (json.items as unknown[])
            : Array.isArray(json)
            ? (json as unknown[])
            : [];
        const parsed: JobOption[] = [];
        for (const it of items) {
          if (!isRecord(it)) continue;
          const id = toNum(it.id);
          const title = toStr(it.title ?? it["job_title"]) ?? "";
          if (id == null) continue;
          parsed.push({ id, title, company: toStr(it.company) });
        }
        if (alive) setJobs(parsed);
      } catch {
        if (alive) setJobs([]);
      } finally {
        if (alive) setJobsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // only re-run when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (application) {
      setForm({
        candidate_id: application.candidate_id ?? null,
        candidate_name: trim(application.candidate_name),
        job_id: application.job_id ?? null,
        job_title: trim(application.job_title),
        company: trim(application.company),
        status: application.status ?? "Applied",
        sourced_by: application.sourced_by ?? RECRUITERS[0],
        sourced_from: application.sourced_from ?? "Linked-in",
        assigned_to: application.assigned_to ?? RECRUITERS[0],
        applied_on:
          trim(application.applied_on) || new Date().toISOString().slice(0, 10),
        comments: trim(application.comments),
      });
    } else {
      setForm(initialForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application]);

  // derive job titles + companies from candidates list
  const jobTitleOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const jp = c.job_position ?? "";
      if (jp.trim()) {
        const t = jp.split("—")[0]?.trim();
        if (t) set.add(t);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const co = (c.company ?? "").trim();
      if (co) set.add(co);
      const jp = c.job_position ?? "";
      if (jp.trim() && jp.includes("—")) {
        const parts = jp.split("—").map((p) => p.trim());
        if (parts.length > 1) {
          const derived = parts.slice(1).join("—").trim();
          if (derived) set.add(derived);
        }
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  function onPickCandidateByName(name: string) {
    const match = candidates.find(
      (c) => c.full_name.toLowerCase() === name.toLowerCase()
    );
    if (!match) {
      setForm((s) => ({ ...s, candidate_name: name, candidate_id: null }));
      return;
    }
    let job_title = form.job_title ?? "";
    let company = form.company ?? "";

    if (!trim(job_title) && match.job_position) {
      const [t, ...rest] = (match.job_position ?? "").split("—");
      const t0 = (t ?? "").trim();
      if (t0) job_title = t0;
      const co = rest.join("—").trim();
      if (!trim(company) && co) company = co;
    }
    if (!trim(company) && match.company) company = match.company ?? "";

    setForm((s) => ({
      ...s,
      candidate_id: match.id,
      candidate_name: match.full_name,
      job_title,
      company,
    }));
  }

  function onPickJobTitle(title: string) {
    const match = jobs.find(
      (j) => (j.title ?? "").toLowerCase() === title.toLowerCase()
    );
    if (match) {
      setForm((s) => ({
        ...s,
        job_title: match.title,
        job_id: match.id,
        company: s.company || (match.company ?? ""),
      }));
    } else {
      setForm((s) => ({ ...s, job_title: title, job_id: null }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!trim(form.candidate_name) && form.candidate_id == null) {
      toast.error("Candidate required");
      return;
    }
    if (!trim(form.job_title)) {
      toast.error("Job Title required");
      return;
    }
    if (!trim(form.company)) {
      toast.error("Company required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        candidate_id: form.candidate_id ?? undefined,
        candidate_name: form.candidate_name ?? undefined,
        job_id: form.job_id ?? undefined,
        job_title: form.job_title ?? undefined,
        company: form.company ?? undefined,
        status: form.status ?? "Applied",
        sourced_by: form.sourced_by ?? undefined,
        sourced_from: form.sourced_from ?? undefined,
        assigned_to: form.assigned_to ?? undefined,
        applied_on: form.applied_on ?? undefined,
        comments: form.comments ?? undefined,
      };

      const isEdit = Boolean(application && application.id);
      const base =
        apiBase ??
        ENV_BASE ??
        (typeof window !== "undefined" ? window.location.origin : "");
      const url = isEdit
        ? `${base}/api/applications/${application!.id}`
        : `${base}/api/applications`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      toast.success(isEdit ? "Application updated" : "Application created");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("save application error:", err);
      toast.error((err as Error).message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {application ? "Edit Application" : "Create Application"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Candidate *</Label>
              <input
                list="candidate-options"
                value={form.candidate_name ?? ""}
                onChange={(e) => onPickCandidateByName(e.target.value)}
                placeholder={candLoading ? "Loading…" : "Candidate name"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <datalist id="candidate-options">
                {candidates.map((c) => (
                  <option key={c.id} value={c.full_name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label>Job Title *</Label>
              <input
                list="job-title-options"
                value={form.job_title ?? ""}
                onChange={(e) => onPickJobTitle(e.target.value)}
                placeholder={jobsLoading ? "Loading…" : "Job title"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <datalist id="job-title-options">
                {jobTitleOptions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <input
                list="company-options"
                value={form.company ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, company: e.target.value }))
                }
                placeholder="Company"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <datalist id="company-options">
                {companyOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={form.status ?? "Applied"}
                onValueChange={(v: string) => setForm((s) => ({ ...s, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((sVal) => (
                    <SelectItem key={sVal} value={sVal}>
                      {sVal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sourced By</Label>
              <Select
                value={form.sourced_by ?? RECRUITERS[0]}
                onValueChange={(v: string) => setForm((s) => ({ ...s, sourced_by: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECRUITERS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sourced From</Label>
              <Select
                value={form.sourced_from ?? "Linked-in"}
                onValueChange={(v: string) =>
                  setForm((s) => ({ ...s, sourced_from: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((sVal) => (
                    <SelectItem key={sVal} value={sVal}>
                      {sVal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select
              value={form.assigned_to ?? RECRUITERS[0]}
              onValueChange={(v: string) => setForm((s) => ({ ...s, assigned_to: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECRUITERS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Applied On</Label>
            <input
              type="date"
              value={form.applied_on ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, applied_on: e.target.value }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea
              rows={4}
              value={form.comments ?? ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, comments: e.target.value }))
              }
              placeholder="Add your comments here..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : application
                ? "Update Application"
                : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
