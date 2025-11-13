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
import { Plus, Search, Pencil, Trash2, Receipt } from "lucide-react";

/* ================== Keys (exactly as in joined_candidates.html) ================== */
const APP_KEY = "APPLICATIONS_V1" as const; // from applications.html
const SEL_KEY = "SELECTED_CANDIDATES_V1" as const; // from selected_candidates.html
const JOIN_KEY = "JOINED_CANDIDATES_V1" as const; // this page

/* ================== Types ================== */
type AppRef = {
  id: string;
  candidate: string;
  jobTitle: string;
  company: string;
};

type JoinedRow = {
  id: string;
  appId: string;
  candidate: string;
  jobTitle: string;
  company: string;
  joinedDate: string; // YYYY-MM-DD
  tenureDays: number | null; // days
  invoiceNo: string;
  invoiceDate: string; // YYYY-MM-DD | ""
};

/* ================== LocalStorage helpers ================== */
const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
};

const writeJSON = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

const readApps = (): AppRef[] => readJSON<AppRef[]>(APP_KEY, []);
const readSel = (): Array<{
  id?: string;
  appId?: string;
  candidate: string;
  jobTitle: string;
  company: string;
}> => readJSON(SEL_KEY, []);
const readJoin = (): JoinedRow[] => readJSON<JoinedRow[]>(JOIN_KEY, []);
const writeJoin = (rows: JoinedRow[]) => writeJSON(JOIN_KEY, rows);

/* ================== Date helpers ================== */
const todayISO = () => new Date().toISOString().slice(0, 10);

const daysBetween = (d1?: string, d2?: string) => {
  if (!d1 || !d2) return 0;
  const t1 = Date.parse(d1);
  const t2 = Date.parse(d2);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.floor((t2 - t1) / (1000 * 60 * 60 * 24));
};

const remainingDays = (joinedDate?: string, tenureDays?: number | null) => {
  if (!joinedDate || !tenureDays) return null;
  const used = daysBetween(joinedDate, todayISO());
  const left = tenureDays - used;
  return left < 0 ? 0 : left;
};

/* ================== Page ================== */
export default function JoinedCandidates() {
  const [rows, setRows] = useState<JoinedRow[]>([]);
  const [q, setQ] = useState("");

  /* Add/Edit dialog */
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /* Form fields */
  const [formAppId, setFormAppId] = useState<string>("");
  const [formJoinedDate, setFormJoinedDate] = useState<string>(todayISO());
  const [formTenureDays, setFormTenureDays] = useState<string>("90");
  const [formInvoiceNo, setFormInvoiceNo] = useState<string>("");
  const [formInvoiceDate, setFormInvoiceDate] = useState<string>("");

  /* Invoice dialog */
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invNo, setInvNo] = useState("");
  const [invDate, setInvDate] = useState(todayISO());

  /* Delete confirm */
  const [toDelete, setToDelete] = useState<string | null>(null);

  /* Sources to pick candidate from (selected first, else applications) */
  const sources: AppRef[] = useMemo(() => {
    const selected = readSel().map((x) => ({
      id: x.appId || x.id || "",
      candidate: x.candidate,
      jobTitle: x.jobTitle,
      company: x.company,
    }));
    const apps = readApps();
    const merged = [...selected, ...apps];
    // dedupe by id
    const seen = new Set<string>();
    const uniq: AppRef[] = [];
    for (const a of merged) {
      if (!a.id || seen.has(a.id)) continue;
      seen.add(a.id);
      uniq.push(a as AppRef);
    }
    return uniq;
  }, []);

  /* Seed like the HTML file does (optional demo row) */
  useEffect(() => {
    if (readJoin().length) return;
    const apps = readApps();
    if (!apps.length) return;
    const a = apps[0];
    writeJoin([
      {
        id: crypto.randomUUID(),
        appId: a.id,
        candidate: a.candidate,
        jobTitle: a.jobTitle,
        company: a.company,
        joinedDate: todayISO(),
        tenureDays: 90,
        invoiceNo: "",
        invoiceDate: "",
      },
    ]);
  }, []);

  useEffect(() => {
    setRows(readJoin());
  }, []);

  // persist on change
  useEffect(() => {
    writeJoin(rows);
  }, [rows]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((r) =>
      [r.candidate, r.jobTitle, r.company]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [rows, q]);

  /* ================== Actions ================== */
  const openAdd = () => {
    setEditingId(null);
    setFormAppId(sources[0]?.id ?? "");
    setFormJoinedDate(todayISO());
    setFormTenureDays("90");
    setFormInvoiceNo("");
    setFormInvoiceDate("");
    setFormOpen(true);
  };

  const openEdit = (r: JoinedRow) => {
    setEditingId(r.id);
    setFormAppId(r.appId);
    setFormJoinedDate(r.joinedDate || todayISO());
    setFormTenureDays(String(r.tenureDays ?? 90));
    setFormInvoiceNo(r.invoiceNo || "");
    setFormInvoiceDate(r.invoiceDate || "");
    setFormOpen(true);
  };

  const saveForm = () => {
    if (!formAppId || !formJoinedDate || !formTenureDays) {
      toast.error("Please fill App, Joined Date and Tenure.");
      return;
    }

    const ref = sources.find((a) => a.id === formAppId);
    const record: JoinedRow = {
      id: editingId ?? crypto.randomUUID(),
      appId: formAppId,
      candidate: ref ? ref.candidate : "Unknown",
      jobTitle: ref ? ref.jobTitle : "—",
      company: ref ? ref.company : "—",
      joinedDate: formJoinedDate,
      tenureDays: Number.isNaN(parseInt(formTenureDays, 10))
        ? null
        : parseInt(formTenureDays, 10),
      invoiceNo: formInvoiceNo,
      invoiceDate: formInvoiceDate,
    };

    setRows((prev) => {
      const i = prev.findIndex((x) => x.id === record.id);
      if (i > -1) {
        const clone = [...prev];
        clone[i] = record;
        return clone;
      }
      return [record, ...prev];
    });

    setFormOpen(false);
    toast.success(
      editingId ? "Joined candidate updated" : "Joined candidate added"
    );
  };

  const askInvoice = (r: JoinedRow) => {
    setInvoiceId(r.id);
    setInvNo(r.invoiceNo || "");
    setInvDate(r.invoiceDate || todayISO());
    setInvoiceOpen(true);
  };

  const saveInvoice = () => {
    if (!invoiceId) return;
    if (!invNo.trim() || !invDate) {
      toast.error("Please enter invoice number and date.");
      return;
    }
    setRows((prev) =>
      prev.map((x) =>
        x.id === invoiceId
          ? { ...x, invoiceNo: invNo.trim(), invoiceDate: invDate }
          : x
      )
    );
    setInvoiceOpen(false);
    toast.success("Invoice marked as raised");
  };

  const doDelete = () => {
    if (!toDelete) return;
    setRows((prev) => prev.filter((x) => x.id !== toDelete));
    setToDelete(null);
    toast.success("Deleted");
  };

  /* ================== UI helpers ================== */
  const RemainingBadge = ({ left }: { left: number | null }) => {
    if (left === null) return <Badge variant="outline">—</Badge>;
    if (left === 0)
      return (
        <Badge
          className="border-emerald-300 bg-emerald-50 text-emerald-700"
          variant="outline"
        >
          Completed
        </Badge>
      );
    if (left <= 10)
      return (
        <Badge
          className="border-amber-300 bg-amber-50 text-amber-700"
          variant="outline"
        >
          {left} days
        </Badge>
      );
    return (
      <Badge
        className="border-indigo-300 bg-indigo-50 text-indigo-700"
        variant="outline"
      >
        {left} days
      </Badge>
    );
  };

  const InvoiceCell = ({ r }: { r: JoinedRow }) => {
    const has = r.invoiceNo && r.invoiceDate;
    if (has) {
      return (
        <div>
          <Badge
            className="border-emerald-300 bg-emerald-50 text-emerald-700"
            variant="outline"
          >
            Raised
          </Badge>
          <div className="mt-1 text-xs text-muted-foreground">
            {r.invoiceNo} • {r.invoiceDate}
          </div>
        </div>
      );
    }
    return (
      <Button
        variant="outline"
        className="h-9 border-amber-300 text-amber-700 hover:bg-amber-50"
        onClick={() => askInvoice(r)}
      >
        <Receipt className="mr-2 h-4 w-4" />
        Raise
      </Button>
    );
  };

  /* ================== Render ================== */
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Joined Candidates
          </h1>
          <p className="text-muted-foreground">
            Confirmed joiners, tenure tracking & invoice status
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Joined
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Candidate / Job / Company…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setQ("")}>
          Clear
        </Button>
      </div>

      {/* Table — only this area scrolls */}
      <Card>
        <CardContent className="p-0">
          <div className="text-xs text-slate-500 bg-muted/20 px-4 py-2 border-b border-border text-right">
            ⇆ Slide horizontally if needed
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto">
            <Table className="min-w-[1120px]">
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                <TableRow>
                  <TableHead className="min-w-[260px]">
                    Candidate Name
                  </TableHead>
                  <TableHead className="min-w-[380px]">Job</TableHead>
                  <TableHead className="min-w-[160px]">Joined Date</TableHead>
                  <TableHead className="min-w-[140px]">Tenure</TableHead>
                  <TableHead className="min-w-[160px]">Remaining</TableHead>
                  <TableHead className="min-w-[200px]">Raise Invoice</TableHead>
                  <TableHead className="min-w-[160px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center h-32 text-muted-foreground"
                    >
                      No joined candidates
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const left = remainingDays(
                      r.joinedDate,
                      r.tenureDays ?? null
                    );
                    return (
                      <TableRow key={r.id}>
                        {/* Candidate */}
                        <TableCell className="align-top">
                          <div className="font-semibold">{r.candidate}</div>
                        </TableCell>

                        {/* Job + Company */}
                        <TableCell className="align-top">
                          <div className="font-medium">{r.jobTitle}</div>
                          <div className="text-xs text-muted-foreground">
                            ({r.company})
                          </div>
                        </TableCell>

                        {/* Joined Date */}
                        <TableCell className="align-top">
                          <Input
                            type="date"
                            value={r.joinedDate}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.id === r.id
                                    ? { ...x, joinedDate: e.target.value }
                                    : x
                                )
                              )
                            }
                            className="h-9 w-[160px]"
                          />
                        </TableCell>

                        {/* Tenure */}
                        <TableCell className="align-top">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={r.tenureDays ?? ""}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x) =>
                                  x.id === r.id
                                    ? {
                                        ...x,
                                        tenureDays: e.target.value
                                          ? parseInt(e.target.value, 10)
                                          : null,
                                      }
                                    : x
                                )
                              )
                            }
                            className="h-9 w-[120px]"
                            placeholder="days"
                          />
                        </TableCell>

                        {/* Remaining */}
                        <TableCell className="align-top">
                          <RemainingBadge left={left} />
                        </TableCell>

                        {/* Invoice */}
                        <TableCell className="align-top">
                          <InvoiceCell r={r} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(r)}
                              className="gap-1"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 gap-1"
                              onClick={() => setToDelete(r.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Joined */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Joined Candidate" : "Add Joined Candidate"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pick from Selected/Applications */}
            <div className="md:col-span-2">
              <div className="text-sm font-medium">
                Pick from Selected / Applications *
              </div>
              <Select value={formAppId} onValueChange={setFormAppId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select candidate — job (company)" />
                </SelectTrigger>
                <SelectContent>
                  {sources.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No candidates found
                    </div>
                  ) : (
                    sources.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.candidate} — {a.jobTitle} ({a.company})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground mt-1">
                List shows Candidate — Job (Company)
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Joined Date *</div>
              <Input
                type="date"
                value={formJoinedDate}
                onChange={(e) => setFormJoinedDate(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-medium">Tenure (days) *</div>
              <Input
                type="number"
                min={1}
                step={1}
                value={formTenureDays}
                onChange={(e) => setFormTenureDays(e.target.value)}
                placeholder="e.g., 90"
              />
            </div>

            <div>
              <div className="text-sm font-medium">
                Invoice Number (optional)
              </div>
              <Input
                value={formInvoiceNo}
                onChange={(e) => setFormInvoiceNo(e.target.value)}
                placeholder="INV-00123"
              />
            </div>

            <div>
              <div className="text-sm font-medium">Invoice Date (optional)</div>
              <Input
                type="date"
                value={formInvoiceDate}
                onChange={(e) => setFormInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raise Invoice */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise Invoice</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-sm font-medium">Invoice Number *</div>
              <Input
                value={invNo}
                onChange={(e) => setInvNo(e.target.value)}
                placeholder="INV-00123"
              />
            </div>
            <div>
              <div className="text-sm font-medium">Invoice Date *</div>
              <Input
                type="date"
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Mark as Raised
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Joined Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
