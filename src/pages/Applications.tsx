"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Plus, Search, Calendar, MessageSquare, Trash2 } from "lucide-react";

// correct relative import to your components directory
import ApplicationDialog from "../components/ApplicationDialog";

/* ========= Constants ========= */
const STORAGE_KEY = "APPLICATIONS_V3";

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

const STATUS_VALUES = [
  "Applied",
  "Interview Scheduled",
  "Qualified",
  "Rejected",
  "Offer",
  "Joined",
] as const;

type Status = (typeof STATUS_VALUES)[number];

/* ======== Application shape returned by backend (and used locally) ======== */
type Application = {
  id: number | string;
  candidate_id?: number | null;
  candidate?: string | null; // candidate_name from backend
  job_id?: number | null;
  jobTitle?: string | null; // job_title from backend
  company?: string | null;
  status: Status;
  sourcedBy?: (typeof RECRUITERS)[number] | null;
  sourcedFrom?: (typeof SOURCES)[number] | null;
  assignedTo?: (typeof RECRUITERS)[number] | null;
  appliedOn?: string | null; // YYYY-MM-DD
  comments?: string | null;
};

/* ========= Candidate options fetched from backend ========= */
type CandidateLite = {
  id: number;
  full_name: string | null;
  job_position: string | null;
  company: string | null;
};

/* ========= Type guards ========= */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function isString(x: unknown): x is string {
  return typeof x === "string";
}
function isStatus(x: unknown): x is Status {
  return isString(x) && (STATUS_VALUES as readonly string[]).includes(x);
}

/* ========= Helpers (localStorage fallback) ========= */
const readLS = (): Application[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).map((r) => {
      return {
        id: (r.id ?? "") as unknown as number | string,
        candidate_id: r.candidate_id == null ? null : Number(r.candidate_id),
        candidate: r.candidate_name == null ? (r.candidate as string | undefined) ?? null : String(r.candidate_name),
        job_id: r.job_id == null ? null : Number(r.job_id),
        jobTitle: r.job_title == null ? (r.title as string | undefined) ?? null : String(r.job_title),
        company: r.company == null ? null : String(r.company),
        status: isStatus(r.status) ? r.status : "Applied",
        sourcedBy: isString(r.sourced_by) ? r.sourced_by : null,
        sourcedFrom: isString(r.sourced_from) ? r.sourced_from : null,
        assignedTo: isString(r.assigned_to) ? r.assigned_to : null,
        appliedOn: isString(r.applied_on) ? r.applied_on : null,
        comments: isString(r.comments) ? r.comments : null,
      } as Application;
    });
  } catch {
    return [];
  }
};

const writeLS = (rows: Application[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const uid = (): string =>
  typeof crypto !== "undefined" && typeof (crypto as unknown as { randomUUID?: () => string }).randomUUID === "function"
    ? (crypto as unknown as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const seedIfEmpty = () => {
  const rows = readLS();
  if (rows.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const seeded: Application[] = [
    {
      id: uid(),
      candidate: "Rajeshwari",
      jobTitle: "IRO – Voice Process",
      company: "Just Dial Limited",
      status: "Interview Scheduled",
      sourcedBy: "Thameem Ansari",
      sourcedFrom: "Linked-in",
      assignedTo: "Nandhini Kumaravel",
      appliedOn: today,
      comments: "Initial screening completed",
    },
    {
      id: uid(),
      candidate: "Arunkumar R",
      jobTitle: "Customer Support",
      company: "One Point One Solutions",
      status: "Applied",
      sourcedBy: "Muni Divya",
      sourcedFrom: "Apna",
      assignedTo: "Gokulakrishna V",
      appliedOn: today,
      comments: "",
    },
  ];
  writeLS(seeded);
};

function uniqSorted(values: Array<string | null | undefined>): string[] {
  const s = new Set<string>();
  for (const v of values) {
    const t = (v ?? "").trim();
    if (t) s.add(t);
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

/* ========= Page ========= */
export default function Applications() {
  const [rows, setRows] = useState<Application[]>([]);
  const [q, setQ] = useState("");

  // candidate options state
  const [optsLoaded, setOptsLoaded] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<CandidateLite[]>([]);

  /* dialog state uses new backend-aware ApplicationDialog */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | undefined>(undefined);

  /* comment dialog */
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentRowId, setCommentRowId] = useState<number | string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  /* schedule dialog */
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleRowId, setScheduleRowId] = useState<number | string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");

  /* delete confirm */
  const [toDelete, setToDelete] = useState<number | string | null>(null);

  // derive dropdown lists
  const candidateNameOptions = useMemo(() => uniqSorted(candidates.map((c) => c.full_name)), [candidates]);
  const jobTitleOptions = useMemo(() => uniqSorted(candidates.map((c) => c.job_position)), [candidates]);
  const companyOptions = useMemo(() => uniqSorted(candidates.map((c) => c.company)), [candidates]);

  // API base (client-only)
  const API_BASE = typeof window !== "undefined" ? window.location.origin : "";

  // fetch list of applications from backend; fallback to LS if network fails
  const fetchApplications = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/applications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      if (!Array.isArray(json)) throw new Error("Invalid response shape");
      const parsed = json
        .filter(isRecord)
        .map((r) => {
          const statusVal = isStatus(r.status) ? r.status : "Applied";
          return {
            id: r.id as number | string,
            candidate_id: r.candidate_id == null ? null : Number(r.candidate_id),
            candidate: isString(r.candidate_name) ? r.candidate_name : isString(r.candidate) ? r.candidate : null,
            job_id: r.job_id == null ? null : Number(r.job_id),
            jobTitle: isString(r.job_title) ? r.job_title : isString(r.title) ? r.title : null,
            company: isString(r.company) ? r.company : null,
            status: statusVal,
            sourcedBy: isString(r.sourced_by) ? r.sourced_by : null,
            sourcedFrom: isString(r.sourced_from) ? r.sourced_from : null,
            assignedTo: isString(r.assigned_to) ? r.assigned_to : null,
            appliedOn: isString(r.applied_on) ? r.applied_on : null,
            comments: isString(r.comments) ? r.comments : null,
          } as Application;
        });
      setRows(parsed);
      writeLS(parsed);
    } catch (err) {
      console.warn("Failed to load applications from backend, falling back to local storage", err);
      const ls = readLS();
      setRows(ls);
    }
  };

  // fetch candidate options
  const fetchCandidateOptions = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/applications/candidate-options`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;

      let arr: unknown[] = [];
      if (Array.isArray(json)) arr = json;
      else if (isRecord(json) && Array.isArray(json.candidates)) arr = json.candidates as unknown[];

      const parsed: CandidateLite[] = arr
        .filter(isRecord)
        .map((o) => {
          const id = Number(o.id);
          if (!Number.isFinite(id)) return null;
          return {
            id,
            full_name: isString(o.full_name) ? o.full_name : null,
            job_position: isString(o.job_position) ? o.job_position : null,
            company: isString(o.company) ? o.company : null,
          };
        })
        .filter((x): x is CandidateLite => x !== null);

      setCandidates(parsed);
      setOptsLoaded(true);
    } catch (err) {
      console.error("Failed to load candidate options:", err);
      toast.error("Failed to load candidate options");
      setCandidates([]);
      setOptsLoaded(true);
    }
  };

  useEffect(() => {
    seedIfEmpty();
    void fetchApplications();
    if (!optsLoaded) void fetchCandidateOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // local filtering
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((r) => `${r.candidate ?? ""} ${r.jobTitle ?? ""} ${r.company ?? ""}`.toLowerCase().includes(text));
  }, [rows, q]);

  /* ========= Row updates (call backend) ========= */
  async function patchApplication(id: number | string, patch: Partial<Application>) {
    try {
      const body: Record<string, unknown> = {};
      if (patch.status !== undefined) body.status = patch.status;
      if (patch.sourcedBy !== undefined) body.sourced_by = patch.sourcedBy as string;
      if (patch.sourcedFrom !== undefined) body.sourced_from = patch.sourcedFrom as string;
      if (patch.assignedTo !== undefined) body.assigned_to = patch.assignedTo as string;
      if (patch.appliedOn !== undefined) body.applied_on = patch.appliedOn as string;
      if (patch.comments !== undefined) body.comments = patch.comments as string;
      if (patch.candidate !== undefined) body.candidate_name = patch.candidate as string;
      if (patch.jobTitle !== undefined) body.job_title = patch.jobTitle as string;
      if (patch.company !== undefined) body.company = patch.company as string;

      const res = await fetch(`${API_BASE}/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await fetchApplications();
      toast.success("Application updated");
    } catch (err) {
      console.error("patch application failed:", err);
      toast.error((err as Error).message || "Failed to update");
    }
  }

  /* ========= Add / Edit ========= */
  const openAdd = () => {
    setEditingApp(undefined);
    setDialogOpen(true);
  };

  const openEdit = (app: Application) => {
    setEditingApp(app);
    setDialogOpen(true);
  };

  const onDialogSuccess = async () => {
    setDialogOpen(false);
    await fetchApplications();
  };

  /* ========= Comments ========= */
  const openComments = (row: Application) => {
    setCommentRowId(row.id);
    setCommentDraft(row.comments || "");
    setCommentOpen(true);
  };

  const saveComments = async () => {
    if (!commentRowId) return;
    await patchApplication(commentRowId, { comments: commentDraft });
    setCommentOpen(false);
  };

  /* ========= Schedule ========= */
  const openSchedule = (row: Application) => {
    setScheduleRowId(row.id);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleNote("");
    setScheduleOpen(true);
  };

  const saveSchedule = async () => {
    if (!scheduleRowId) return;
    const patch: Partial<Application> = {};
    if (scheduleDate) patch.appliedOn = scheduleDate;
    if (scheduleNote) {
      const existing = rows.find((r) => r.id === scheduleRowId)?.comments ?? "";
      patch.comments = `${existing ? existing + "\n\n" : ""}Schedule note: ${scheduleNote} ${scheduleTime ? "@" + scheduleTime : ""}`;
    }
    await patchApplication(scheduleRowId, patch);
    setScheduleOpen(false);
    toast.success("Interview scheduled");
  };

  /* ========= Delete ========= */
  const confirmDelete = (id: number | string) => setToDelete(id);
  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`${API_BASE}/api/applications/${toDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await fetchApplications();
      setToDelete(null);
      toast.success("Application deleted");
    } catch (err) {
      console.error("delete failed:", err);
      toast.error((err as Error).message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground">Track and manage candidate applications</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Candidate / Job / Company…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" onClick={() => setQ("")}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="text-xs text-slate-500 bg-muted/20 px-4 py-2 border-b border-border text-right">⇆ Slide horizontally for more columns</div>

          <div className="max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto">
            <Table className="min-w-[1700px]">
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[220px]">Candidate Name</TableHead>
                  <TableHead className="min-w-[260px]">Job</TableHead>
                  <TableHead className="min-w-[200px]">Status</TableHead>
                  <TableHead className="min-w-[200px]">Sourced By</TableHead>
                  <TableHead className="min-w-[180px]">Sourced From</TableHead>
                  <TableHead className="min-w-[200px]">Assigned To</TableHead>
                  <TableHead className="min-w-[140px]">Applied On</TableHead>
                  <TableHead className="min-w-[160px]">Interview</TableHead>
                  <TableHead className="min-w-[360px]">Comments</TableHead>
                  <TableHead className="min-w-[120px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center h-32 text-muted-foreground">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={String(a.id)}>
                      <TableCell className="align-top">
                        <div className="font-semibold">{a.candidate}</div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="font-medium">{a.jobTitle}</div>
                        <div className="text-xs text-muted-foreground">{a.company}</div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="mb-2">
                          <Badge variant={a.status === "Applied" ? "outline" : a.status === "Interview Scheduled" ? "secondary" : a.status === "Qualified" ? "default" : "outline"}>
                            {a.status}
                          </Badge>
                        </div>
                        <Select value={a.status} onValueChange={(v) => patchApplication(a.id, { status: v as Status })}>
                          <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_VALUES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.sourcedBy ?? RECRUITERS[0]} onValueChange={(v) => patchApplication(a.id, { sourcedBy: v as Application["sourcedBy"] })}>
                          <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>{RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.sourcedFrom ?? SOURCES[0]} onValueChange={(v) => patchApplication(a.id, { sourcedFrom: v as Application["sourcedFrom"] })}>
                          <SelectTrigger className="h-9 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>{SOURCES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.assignedTo ?? RECRUITERS[0]} onValueChange={(v) => patchApplication(a.id, { assignedTo: v as Application["assignedTo"] })}>
                          <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>{RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Input type="date" value={a.appliedOn ?? ""} onChange={(e) => patchApplication(a.id, { appliedOn: e.target.value })} className="h-9 w-[160px]" />
                      </TableCell>

                      <TableCell className="align-top">
                        <Button variant="outline" className="h-9 gap-2" onClick={() => openSchedule(a)}>
                          <Calendar className="h-4 w-4" />
                          Schedule
                        </Button>
                        <Button variant="ghost" className="ml-2" onClick={() => openEdit(a)}>
                          Edit
                        </Button>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="rounded-xl border border-border bg-background p-3 shadow-sm max-w-[420px] min-w-[260px] min-h-[56px] max-h-[120px] overflow-auto text-sm leading-6 text-slate-700">
                          {a.comments ? <div className="whitespace-pre-wrap">{a.comments}</div> : <span className="italic text-slate-400">No comments</span>}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openComments(a)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="align-top text-right">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => confirmDelete(a.id)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Application Add/Edit dialog (uses ApplicationDialog component) */}
      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={(v) => setDialogOpen(v)}
        application={
          editingApp
            ? {
                id: Number(editingApp.id),
                candidate_id: editingApp.candidate_id ?? undefined,
                candidate_name: editingApp.candidate ?? undefined,
                job_id: editingApp.job_id ?? undefined,
                job_title: editingApp.jobTitle ?? undefined,
                company: editingApp.company ?? undefined,
                status: editingApp.status,
                sourced_by: editingApp.sourcedBy ?? undefined,
                sourced_from: editingApp.sourcedFrom ?? undefined,
                assigned_to: editingApp.assignedTo ?? undefined,
                applied_on: editingApp.appliedOn ?? undefined,
                comments: editingApp.comments ?? undefined,
              }
            : undefined
        }
        onSuccess={onDialogSuccess}
      />

      {/* ... remaining dialogs (comments / schedule / delete) are unchanged ... */}
    </div>
  );
}
