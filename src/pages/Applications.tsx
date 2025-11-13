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

type Status =
  | "Applied"
  | "Interview Scheduled"
  | "Qualified"
  | "Rejected"
  | "Offer"
  | "Joined";

type Application = {
  id: string;
  candidate: string;
  jobTitle: string;
  company: string;
  status: Status;
  sourcedBy: (typeof RECRUITERS)[number];
  sourcedFrom: (typeof SOURCES)[number];
  assignedTo: (typeof RECRUITERS)[number];
  appliedOn: string; // YYYY-MM-DD
  comments: string;
};

/* ========= Candidate options fetched from backend ========= */
type CandidateLite = {
  id: number;
  full_name: string | null;
  job_position: string | null;
  company: string | null;
};

/* ========= Helpers ========= */
const readLS = (): Application[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // validate minimal shape
    const result: Application[] = parsed
      .map((p) => {
        if (!p || typeof p !== "object") return null;
        const o = p as Record<string, unknown>;
        const candidate = typeof o.candidate === "string" ? o.candidate : "";
        const jobTitle = typeof o.jobTitle === "string" ? o.jobTitle : "";
        const company = typeof o.company === "string" ? o.company : "";
        const id = typeof o.id === "string" ? o.id : String(o.id ?? "");
        const status =
          typeof o.status === "string" &&
          ["Applied", "Interview Scheduled", "Qualified", "Rejected", "Offer", "Joined"].includes(
            o.status
          )
            ? (o.status as Status)
            : "Applied";
        const sourcedBy = typeof o.sourcedBy === "string" ? (o.sourcedBy as Application["sourcedBy"]) : RECRUITERS[0];
        const sourcedFrom = typeof o.sourcedFrom === "string" ? (o.sourcedFrom as Application["sourcedFrom"]) : SOURCES[0];
        const assignedTo = typeof o.assignedTo === "string" ? (o.assignedTo as Application["assignedTo"]) : RECRUITERS[0];
        const appliedOn = typeof o.appliedOn === "string" ? o.appliedOn : new Date().toISOString().slice(0, 10);
        const comments = typeof o.comments === "string" ? o.comments : "";
        return {
          id,
          candidate,
          jobTitle,
          company,
          status,
          sourcedBy,
          sourcedFrom,
          assignedTo,
          appliedOn,
          comments,
        } as Application;
      })
      .filter((x): x is Application => x !== null);
    return result;
  } catch {
    return [];
  }
};

const writeLS = (rows: Application[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

/* generate id without using `any` cast */
function uid(): string {
  // create a typed view of global crypto that only exposes randomUUID optionally
  const maybeCrypto = typeof crypto !== "undefined" ? (crypto as unknown as { randomUUID?: () => string }) : undefined;
  if (maybeCrypto && typeof maybeCrypto.randomUUID === "function") {
    try {
      return maybeCrypto.randomUUID();
    } catch {
      // fall through to fallback
    }
  }
  // fallback deterministic unique-ish string
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

  /* add dialog */
  const [addOpen, setAddOpen] = useState(false);
  const [newRow, setNewRow] = useState<Partial<Application>>({});

  /* comment dialog */
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentRowId, setCommentRowId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");

  /* schedule dialog */
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleRowId, setScheduleRowId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");

  /* delete confirm */
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    seedIfEmpty();
    setRows(readLS());
  }, []);

  // persist
  useEffect(() => {
    writeLS(rows);
  }, [rows]);

  // fetch candidate options once (used by Add dialog)
  useEffect(() => {
    if (optsLoaded) return;
    void fetchCandidateOptions();
  }, [optsLoaded]);

  const fetchCandidateOptions = async (): Promise<void> => {
    try {
      const res = await fetch("/api/candidates/options");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as unknown;
      const arr = Array.isArray(json) ? json : [];
      const parsed: CandidateLite[] = arr
        .map((r: unknown): CandidateLite | null => {
          if (!r || typeof r !== "object") return null;
          const o = r as Record<string, unknown>;
          const idRaw = o["id"];
          const id = typeof idRaw === "number" ? idRaw : Number(idRaw ?? Number.NaN);
          if (!Number.isFinite(id)) return null;
          return {
            id,
            full_name: o["full_name"] == null ? null : String(o["full_name"]).trim(),
            job_position: o["job_position"] == null ? null : String(o["job_position"]).trim(),
            company: o["company"] == null ? null : String(o["company"]).trim(),
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

  // derived dropdown lists
  const candidateNameOptions = useMemo(() => uniqSorted(candidates.map((c) => c.full_name)), [candidates]);
  const jobTitleOptions = useMemo(() => uniqSorted(candidates.map((c) => c.job_position)), [candidates]);
  const companyOptions = useMemo(() => uniqSorted(candidates.map((c) => c.company)), [candidates]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((r) => [r.candidate, r.jobTitle, r.company].join(" ").toLowerCase().includes(text));
  }, [rows, q]);

  /* ========= Row updates ========= */
  const updateRow = (id: string, patch: Partial<Application>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  /* ========= Add ========= */
  const openAdd = () => {
    setNewRow({
      candidate: "",
      jobTitle: "",
      company: "",
      status: "Applied",
      sourcedBy: RECRUITERS[0],
      sourcedFrom: SOURCES[0],
      assignedTo: RECRUITERS[0],
      appliedOn: new Date().toISOString().slice(0, 10),
      comments: "",
    });
    setAddOpen(true);
  };

  const pickCandidate = (name: string): void => {
    // Autofill job/company if we can find a matching candidate
    const found = candidates.find((c) => (c.full_name ?? "") === name);
    setNewRow((s) => ({
      ...s,
      candidate: name,
      jobTitle: s?.jobTitle || (found?.job_position ?? ""),
      company: s?.company || (found?.company ?? ""),
    }));
  };

  const pickJobTitle = (title: string): void => {
    setNewRow((s) => ({ ...s, jobTitle: title }));
  };

  const pickCompany = (company: string): void => {
    setNewRow((s) => ({ ...s, company }));
  };

  const submitAdd = () => {
    const c = (newRow.candidate || "").trim();
    const j = (newRow.jobTitle || "").trim();
    const co = (newRow.company || "").trim();
    if (!c || !j || !co) {
      toast.error("Candidate, Job Title and Company are required.");
      return;
    }
    const item: Application = {
      id: uid(),
      candidate: c,
      jobTitle: j,
      company: co,
      status: (newRow.status as Status) || "Applied",
      sourcedBy: (newRow.sourcedBy as Application["sourcedBy"]) || RECRUITERS[0],
      sourcedFrom: (newRow.sourcedFrom as Application["sourcedFrom"]) || SOURCES[0],
      assignedTo: (newRow.assignedTo as Application["assignedTo"]) || RECRUITERS[0],
      appliedOn: newRow.appliedOn || new Date().toISOString().slice(0, 10),
      comments: newRow.comments || "",
    };
    setRows((prev) => [item, ...prev]);
    setAddOpen(false);
    toast.success("Application added");
  };

  /* ========= Comments ========= */
  const openComments = (row: Application) => {
    setCommentRowId(row.id);
    setCommentDraft(row.comments || "");
    setCommentOpen(true);
  };

  const saveComments = () => {
    if (!commentRowId) return;
    updateRow(commentRowId, { comments: commentDraft });
    setCommentOpen(false);
    toast.success("Comments updated");
  };

  /* ========= Schedule ========= */
  const openSchedule = (row: Application) => {
    setScheduleRowId(row.id);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleNote("");
    setScheduleOpen(true);
  };

  const saveSchedule = () => {
    if (!scheduleRowId) return;
    setScheduleOpen(false);
    toast.success("Interview scheduled");
  };

  /* ========= Delete ========= */
  const confirmDelete = (id: string) => setToDelete(id);
  const doDelete = () => {
    if (!toDelete) return;
    setRows((prev) => prev.filter((r) => r.id !== toDelete));
    setToDelete(null);
    toast.success("Application deleted");
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
                    <TableRow key={a.id}>
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
                        <Select value={a.status} onValueChange={(v: string) => updateRow(a.id, { status: v as Status })}>
                          <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Applied">Applied</SelectItem>
                            <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Offer">Offer</SelectItem>
                            <SelectItem value="Joined">Joined</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.sourcedBy} onValueChange={(v: string) => updateRow(a.id, { sourcedBy: v as Application["sourcedBy"] })}>
                          <SelectTrigger className="h-9 w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.sourcedFrom} onValueChange={(v: string) => updateRow(a.id, { sourcedFrom: v as Application["sourcedFrom"] })}>
                          <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{SOURCES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Select value={a.assignedTo} onValueChange={(v: string) => updateRow(a.id, { assignedTo: v as Application["assignedTo"] })}>
                          <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Input type="date" value={a.appliedOn} onChange={(e) => updateRow(a.id, { appliedOn: e.target.value })} className="h-9 w-[160px]" />
                      </TableCell>

                      <TableCell className="align-top">
                        <Button variant="outline" className="h-9 gap-2" onClick={() => openSchedule(a)}>
                          <Calendar className="h-4 w-4" />
                          Schedule
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

      {/* Add Application */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate: input + dropdown */}
            <div>
              <div className="text-sm font-medium">Candidate</div>
              <div className="flex gap-2">
                <Input value={newRow.candidate ?? ""} onChange={(e) => setNewRow((s) => ({ ...s, candidate: e.target.value }))} placeholder="Candidate name" />
                <Select value="" onValueChange={(v: string) => pickCandidate(v)}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>{candidateNameOptions.map((n) => (<SelectItem key={n} value={n}>{n}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Title: input + dropdown */}
            <div>
              <div className="text-sm font-medium">Job Title</div>
              <div className="flex gap-2">
                <Input value={newRow.jobTitle ?? ""} onChange={(e) => setNewRow((s) => ({ ...s, jobTitle: e.target.value }))} placeholder="Job title" />
                <Select value="" onValueChange={(v: string) => pickJobTitle(v)}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>{jobTitleOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Company: input + dropdown */}
            <div>
              <div className="text-sm font-medium">Company</div>
              <div className="flex gap-2">
                <Input value={newRow.company ?? ""} onChange={(e) => setNewRow((s) => ({ ...s, company: e.target.value }))} placeholder="Company" />
                <Select value="" onValueChange={(v: string) => pickCompany(v)}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>{companyOptions.map((co) => (<SelectItem key={co} value={co}>{co}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Status</div>
              <Select value={(newRow.status as Status) ?? "Applied"} onValueChange={(v: string) => setNewRow((s) => ({ ...s, status: v as Status }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                  <SelectItem value="Joined">Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Sourced By</div>
              <Select value={(newRow.sourcedBy as Application["sourcedBy"]) ?? RECRUITERS[0]} onValueChange={(v: string) => setNewRow((s) => ({ ...s, sourcedBy: v as Application["sourcedBy"] }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Sourced From</div>
              <Select value={(newRow.sourcedFrom as Application["sourcedFrom"]) ?? SOURCES[0]} onValueChange={(v: string) => setNewRow((s) => ({ ...s, sourcedFrom: v as Application["sourcedFrom"] }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Assigned To</div>
              <Select value={(newRow.assignedTo as Application["assignedTo"]) ?? RECRUITERS[0]} onValueChange={(v: string) => setNewRow((s) => ({ ...s, assignedTo: v as Application["assignedTo"] }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{RECRUITERS.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Applied On</div>
              <Input type="date" value={newRow.appliedOn ?? new Date().toISOString().slice(0, 10)} onChange={(e) => setNewRow((s) => ({ ...s, appliedOn: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-medium">Comments</div>
              <textarea value={newRow.comments ?? ""} onChange={(e) => setNewRow((s) => ({ ...s, comments: e.target.value }))} placeholder="Add notes…" className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" rows={4} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitAdd} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Comments */}
      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Comments</DialogTitle>
          </DialogHeader>
          <textarea value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" rows={8} placeholder="Write comments…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentOpen(false)}>Cancel</Button>
            <Button onClick={saveComments} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Date</div>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium">Time</div>
              <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <div className="text-sm font-medium">Notes</div>
              <textarea value={scheduleNote} onChange={(e) => setScheduleNote(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" rows={5} placeholder="Add any instructions for the candidate/interviewer…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={saveSchedule} className="bg-blue-600 hover:bg-blue-700">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the application.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
