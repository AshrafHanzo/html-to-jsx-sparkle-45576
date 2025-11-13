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
import { Plus, Search, Trash2, Pencil } from "lucide-react";

/* ====== Matches selected_candidates.html ======
   Storage keys and fields are identical to the HTML page:
   - APP_KEY: "APPLICATIONS_V1" (list of applications to pick from)
   - SEL_KEY: "SELECTED_CANDIDATES_V1" (rows on this page)
   Source: selected_candidates.html  */ // :contentReference[oaicite:1]{index=1}

const APP_KEY = "APPLICATIONS_V1" as const;
const SEL_KEY = "SELECTED_CANDIDATES_V1" as const;

type Offer = "Yes" | "No";

type Application = {
  id: string;
  candidate: string;
  jobTitle: string;
  company: string;
};

type SelectedRow = {
  id: string;
  appId: string;
  candidate: string;
  jobTitle: string;
  company: string;
  selectedDate: string; // YYYY-MM-DD
  offerLetter: Offer;
  joiningDate: string; // YYYY-MM-DD | ""
};

/* ============ LocalStorage helpers ============ */
const readApps = (): Application[] => {
  try {
    const raw = localStorage.getItem(APP_KEY);
    const parsed = raw ? (JSON.parse(raw) as Application[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readSel = (): SelectedRow[] => {
  try {
    const raw = localStorage.getItem(SEL_KEY);
    const parsed = raw ? (JSON.parse(raw) as SelectedRow[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSel = (rows: SelectedRow[]) => {
  localStorage.setItem(SEL_KEY, JSON.stringify(rows));
};

/* Optional seed (mirrors the HTML behavior) */
const seedIfEmpty = () => {
  const existing = readSel();
  if (existing.length) return;
  const apps = readApps();
  if (!apps.length) return;
  const a = apps[0];
  const one: SelectedRow = {
    id: crypto.randomUUID(),
    appId: a.id,
    candidate: a.candidate,
    jobTitle: a.jobTitle,
    company: a.company,
    selectedDate: new Date().toISOString().slice(0, 10),
    offerLetter: "Yes",
    joiningDate: "",
  };
  writeSel([one]);
};

/* ============ Page ============ */
export default function SelectedCandidates() {
  const [rows, setRows] = useState<SelectedRow[]>([]);
  const [q, setQ] = useState("");

  /* add/edit dialog */
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form fields
  const [formAppId, setFormAppId] = useState<string>("");
  const [formSelectedDate, setFormSelectedDate] = useState<string>("");
  const [formOfferLetter, setFormOfferLetter] = useState<Offer>("No");
  const [formJoiningDate, setFormJoiningDate] = useState<string>("");

  /* delete confirm */
  const [toDelete, setToDelete] = useState<string | null>(null);

  const apps = useMemo(() => readApps(), []);

  useEffect(() => {
    // Mirror the HTML page behavior
    seedIfEmpty();
    setRows(readSel());
  }, []);

  // persist whenever rows change
  useEffect(() => {
    writeSel(rows);
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

  const openAdd = () => {
    setEditingId(null);
    setFormAppId(apps[0]?.id ?? "");
    setFormSelectedDate(new Date().toISOString().slice(0, 10));
    setFormOfferLetter("No");
    setFormJoiningDate("");
    setFormOpen(true);
  };

  const openEdit = (row: SelectedRow) => {
    setEditingId(row.id);
    setFormAppId(row.appId);
    setFormSelectedDate(row.selectedDate || "");
    setFormOfferLetter(row.offerLetter || "No");
    setFormJoiningDate(row.joiningDate || "");
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formAppId || !formSelectedDate) {
      toast.error("Please select an application and the selected date.");
      return;
    }

    const app = apps.find((a) => a.id === formAppId);
    const base = {
      id: editingId ?? crypto.randomUUID(),
      appId: formAppId,
      candidate: app ? app.candidate : "Unknown",
      jobTitle: app ? app.jobTitle : "—",
      company: app ? app.company : "—",
      selectedDate: formSelectedDate,
      offerLetter: formOfferLetter,
      joiningDate: formJoiningDate,
    } satisfies SelectedRow;

    setRows((prev) => {
      const i = prev.findIndex((r) => r.id === base.id);
      if (i > -1) {
        const clone = [...prev];
        clone[i] = base;
        return clone;
      }
      return [base, ...prev];
    });

    setFormOpen(false);
    toast.success(
      editingId ? "Selected candidate updated" : "Selected candidate added"
    );
  };

  const doDelete = () => {
    if (!toDelete) return;
    setRows((prev) => prev.filter((r) => r.id !== toDelete));
    setToDelete(null);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Selected Candidates
          </h1>
          <p className="text-muted-foreground">
            People who have been selected / offered
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Selected
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
            <Table className="min-w-[1100px]">
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[240px]">
                    Candidate Name
                  </TableHead>
                  <TableHead className="min-w-[380px]">Job</TableHead>
                  <TableHead className="min-w-[160px]">Selected Date</TableHead>
                  <TableHead className="min-w-[160px]">Offer Letter</TableHead>
                  <TableHead className="min-w-[160px]">Joining Date</TableHead>
                  <TableHead className="min-w-[160px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center h-32 text-muted-foreground"
                    >
                      No selected candidates yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="align-top">
                        <div className="font-semibold">{r.candidate}</div>
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="font-medium">{r.jobTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          ({r.company})
                        </div>
                      </TableCell>

                      <TableCell className="align-top">
                        <Input
                          type="date"
                          value={r.selectedDate}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, selectedDate: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="h-9 w-[160px]"
                        />
                      </TableCell>

                      <TableCell className="align-top">
                        <div className="mb-2">
                          <Badge
                            className={
                              r.offerLetter === "Yes"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-rose-300 bg-rose-50 text-rose-700"
                            }
                            variant="outline"
                          >
                            {r.offerLetter}
                          </Badge>
                        </div>
                        <Select
                          value={r.offerLetter}
                          onValueChange={(v) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, offerLetter: v as Offer }
                                  : x
                              )
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="align-top">
                        <Input
                          type="date"
                          value={r.joiningDate}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id
                                  ? { ...x, joiningDate: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="h-9 w-[160px]"
                        />
                      </TableCell>

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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Drawer (Dialog) */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Selected Candidate" : "Add Selected Candidate"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pick from Applications (value = appId) */}
            <div className="md:col-span-2">
              <div className="text-sm font-medium">
                Pick from Applications *
              </div>
              <Select value={formAppId} onValueChange={setFormAppId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {apps.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No applications found
                    </div>
                  ) : (
                    apps.map((a) => (
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
              <div className="text-sm font-medium">Selected Date *</div>
              <Input
                type="date"
                value={formSelectedDate}
                onChange={(e) => setFormSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-medium">Offer Letter *</div>
              <Select
                value={formOfferLetter}
                onValueChange={(v) => setFormOfferLetter(v as Offer)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-sm font-medium">Joining Date</div>
              <Input
                type="date"
                value={formJoiningDate}
                onChange={(e) => setFormJoiningDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save
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
            <AlertDialogTitle>Delete Selected Candidate</AlertDialogTitle>
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
