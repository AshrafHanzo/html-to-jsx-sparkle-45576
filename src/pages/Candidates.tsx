"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateDialog } from "@/components/CandidateDialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------- API base ---------- */
function getApiBase(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:30020`;
  }
  return "http://localhost:30020";
}
const API_BASE = getApiBase();
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : "/" + p}`;

/* keep WorkType aligned with the dialog (no `any`) */
type WorkType = "Remote" | "Hybrid" | "On-site";

type CandidateStatus =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Selected"
  | "Rejected"
  | "Joined";

export type Candidate = {
  id: string;
  name: string;
  father_name?: string | null;
  email?: string | null;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  aadhaar?: string | null;

  street?: string | null;
  locality?: string | null;
  city?: string | null;
  pincode?: string | null;

  education?: string | null;
  exp_years?: number | null;
  exp_months?: number | null;

  position?: string | null;

  languages?: string[] | null;
  skills?: string[] | null;
  pref_categories?: string[] | null;
  pref_employment?: string[] | null;

  // WIDENED: allow either WorkType or raw string entries (matches the dialog)
  work_types?: (WorkType | string)[] | null;

  status: CandidateStatus;
  resume_url?: string | null;
};

const STATUSES: ("All" | CandidateStatus)[] = [
  "All",
  "Applied",
  "Screening",
  "Interview",
  "Selected",
  "Rejected",
  "Joined",
];

const asList = (arr?: string[] | null) => (Array.isArray(arr) ? arr : []);
const dash = (v?: string | number | null) =>
  v === undefined || v === null || v === "" ? "-" : String(v);

/* ---------- Backend row (FULL) ---------- */
type CandidateRow = {
  id: number;
  job_position?: string | null;
  full_name?: string | null;
  fathers_name?: string | null;

  email?: string | null; // alias from SQL
  phone?: string | null; // alias from SQL
  date_of_birth?: string | null;
  gender?: string | null;
  aadhaar_number?: string | null;

  street_address?: string | null;
  area_locality?: string | null;
  city?: string | null;
  pincode?: string | null;

  select_languages?: string[] | null;
  educational_qualification?: string | null;
  work_experience?: number | null;
  additional_months?: number | null;

  technical_professional_skills?: string | null;
  preferred_industries_categories?: string | null;
  preferred_employment_types?: string[] | null;
  preferred_work_types?: string | null;

  source?: string | null;
  status: CandidateStatus;
  notes?: string | null;
  created_at?: string | null;

  resume_url?: string | null; // id as string when resume exists
};

function resumeHrefFromRow(row: CandidateRow): string | null {
  const idString = row.resume_url && String(row.resume_url).trim();
  return idString ? api(`/api/candidates/resume/${idString}`) : null;
}

function mapRowToCandidate(row: CandidateRow): Candidate {
  return {
    id: String(row.id),
    name: row.full_name ?? "",
    father_name: row.fathers_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    dob: row.date_of_birth ?? null,
    gender: row.gender ?? null,
    aadhaar: row.aadhaar_number ?? null,

    street: row.street_address ?? null,
    locality: row.area_locality ?? null,
    city: row.city ?? null,
    pincode: row.pincode ?? null,

    education: row.educational_qualification ?? null,
    exp_years: row.work_experience ?? 0,
    exp_months: row.additional_months ?? 0,

    position: row.job_position ?? null,

    languages: row.select_languages ?? [],
    skills: row.technical_professional_skills
      ? row.technical_professional_skills.split(",").map((s) => s.trim())
      : [],
    pref_categories: row.preferred_industries_categories
      ? row.preferred_industries_categories.split(",").map((s) => s.trim())
      : [],
    pref_employment: row.preferred_employment_types ?? [],

    // still a single string from backend; we wrap to an array
    work_types: row.preferred_work_types ? [row.preferred_work_types] : [],

    status: row.status,
    resume_url: resumeHrefFromRow(row),
  };
}

/* Helper to render position with title bold + company muted small line */
function renderJobPosition(position?: string | null) {
  if (!position)
    return <span className="text-sm text-muted-foreground">-</span>;

  // split on em-dash, en-dash, or hyphen with spaces
  const split = position.split(/\s*(?:—|–|-)\s*/);
  const title = split[0] ?? position;
  const company = split.length > 1 ? split.slice(1).join(" - ") : "";

  return (
    <div className="leading-tight">
      <div className="font-medium text-sm">{title}</div>
      {company ? (
        <div className="text-xs text-muted-foreground -mt-0.5">{company}</div>
      ) : null}
    </div>
  );
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CandidateStatus>(
    "All"
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(
    null
  );

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(api(`/api/candidates?page=1&page_size=500`));
      if (!res.ok) throw new Error("Failed to fetch");
      const json: { items: CandidateRow[] } = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      setCandidates(items.map(mapRowToCandidate));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch candidates");
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    try {
      const res = await fetch(
        api(`/api/candidates/${Number(candidateToDelete.id)}`),
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed");
      toast.success("Candidate deleted successfully!");
      setDeleteDialogOpen(false);
      setCandidateToDelete(null);
      fetchCandidates();
    } catch {
      toast.error("Failed to delete candidate");
    }
  };

  const handleStatusChange = async (
    candidateId: string,
    newStatus: CandidateStatus
  ) => {
    try {
      const res = await fetch(
        api(`/api/candidates/${Number(candidateId)}/status`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      toast.success("Status updated successfully!");
      fetchCandidates();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const filteredCandidates = candidates.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.position?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
        <Button
          onClick={() => {
            setSelectedCandidate(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidate…"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-background shadow-sm">
        <div className="max-h-[calc(100vh-280px)] overflow-auto">
          <Table className="min-w-[1100px]">
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Job Position</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Exp (Y/M)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-12"
                  >
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{renderJobPosition(c.position)}</TableCell>
                    <TableCell>{dash(c.phone)}</TableCell>
                    <TableCell className="truncate max-w-[220px]">
                      {dash(c.email)}
                    </TableCell>
                    <TableCell>{dash(c.city)}</TableCell>
                    <TableCell>
                      {(c.exp_years || 0) + "/" + (c.exp_months || 0)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.status}
                        onValueChange={(value) =>
                          handleStatusChange(c.id, value as CandidateStatus)
                        }
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              "Applied",
                              "Screening",
                              "Interview",
                              "Selected",
                              "Rejected",
                              "Joined",
                            ] as CandidateStatus[]
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(c);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCandidateToDelete(c);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <CandidateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={selectedCandidate}
        onSuccess={fetchCandidates}
      />

      {/* View Profile */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                <p className="text-muted-foreground">
                  {dash(selectedCandidate.position)} •{" "}
                  {dash(selectedCandidate.city)} •{" "}
                  {dash(selectedCandidate.gender)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Contact</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      Email: <strong>{dash(selectedCandidate.email)}</strong>
                    </div>
                    <div>
                      Phone: <strong>{dash(selectedCandidate.phone)}</strong>
                    </div>
                    <div>
                      Father&apos;s Name:{" "}
                      <strong>{dash(selectedCandidate.father_name)}</strong>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Experience & Education</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      Experience:{" "}
                      <strong>
                        {selectedCandidate.exp_years || 0} years{" "}
                        {selectedCandidate.exp_months || 0} months
                      </strong>
                    </div>
                    <div>
                      Education:{" "}
                      <strong>{dash(selectedCandidate.education)}</strong>
                    </div>
                    <div>
                      Work Types:{" "}
                      <strong>
                        {(selectedCandidate.work_types ?? []).length
                          ? (selectedCandidate.work_types ?? []).join(", ")
                          : "-"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Address</h4>
                <p className="text-sm">
                  {[
                    selectedCandidate.street,
                    selectedCandidate.locality,
                    selectedCandidate.city,
                    selectedCandidate.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {asList(selectedCandidate.languages).length ? (
                      asList(selectedCandidate.languages).map((lang, i) => (
                        <Badge key={i} variant="secondary">
                          {lang}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {asList(selectedCandidate.skills).length ? (
                      asList(selectedCandidate.skills).map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Preferred Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {asList(selectedCandidate.pref_categories).length ? (
                      asList(selectedCandidate.pref_categories).map(
                        (cat, i) => (
                          <Badge key={i} variant="secondary">
                            {cat}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Preferred Employment</h4>
                  <div className="flex flex-wrap gap-2">
                    {asList(selectedCandidate.pref_employment).length ? (
                      asList(selectedCandidate.pref_employment).map(
                        (emp, i) => (
                          <Badge key={i} variant="secondary">
                            {emp}
                          </Badge>
                        )
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Personal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">DOB</div>
                    <div className="font-medium">
                      {dash(selectedCandidate.dob)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gender</div>
                    <div className="font-medium">
                      {dash(selectedCandidate.gender)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Aadhaar</div>
                    <div className="font-medium">
                      {dash(selectedCandidate.aadhaar)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Resume:&nbsp;
                {selectedCandidate.resume_url ? (
                  <a
                    href={selectedCandidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Resume
                  </a>
                ) : (
                  <span>No resume uploaded</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone and will remove all related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

