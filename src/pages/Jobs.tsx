"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { JobDialog } from "@/components/JobDialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** API base (works in Vite and Next without hardcoding) */
/** API base (works in both Next.js and Vite, no `any`) */
function getApiBase(): string {
  // --- Vite (dev or build) ---
  if (typeof import.meta !== "undefined" && "env" in import.meta) {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string> })
      .env;
    const fromVite = viteEnv?.VITE_API_BASE;
    if (fromVite && fromVite.trim()) {
      return fromVite.replace(/\/+$/, "");
    }
  }

  // --- Next.js runtime env ---
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/+$/, "");
  }

  // --- Fallback (same host + backend port 30020) ---
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:30020`;
  }

  return "http://localhost:30020";
}

const API_BASE = getApiBase();

/** join helper */
const api = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

/** UI status options (dropdown) */
type Status = "Action" | "Hold" | "Closed";

/** Local shape for the jobs table (compatible with API) */
type Job = {
  id: string;
  title: string;
  company?: string | null;
  openings?: number | null;
  type?: string | null;
  work_mode?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_range?: string | null;
  status?: string | null;
  urgency?: string | null;
  commission?: number | null;
  tenure?: string | null;
  shift?: string | null;
  category?: string | null;
  experience?: string | null;
  age_range?: string | null;
  address?: string | null;
  description?: string | null;
  required_skills?: string | null;
  preferred_skills?: string | null;
  nice_to_have?: string | null;
  languages_required?: string | null;
  posted_date?: string | null;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  useEffect(() => {
    void fetchJobs();
  }, []);

  const fetchJobs = async (): Promise<void> => {
    try {
      const res = await fetch(api("/api/jobs"), { method: "GET" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Job[];
      setJobs(data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch jobs");
    }
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: Status
  ): Promise<void> => {
    try {
      const res = await fetch(api(`/api/jobs/${jobId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Status updated successfully!");
      void fetchJobs();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!jobToDelete) return;
    try {
      const res = await fetch(api(`/api/jobs/${jobToDelete.id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Job deleted successfully!");
      setDeleteDialogOpen(false);
      setJobToDelete(null);
      void fetchJobs();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (job.title ?? "").toLowerCase().includes(q) ||
      (job.company ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Manage all job postings</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
          onClick={() => {
            setSelectedJob(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => void fetchJobs()}>
          Search
        </Button>
        <Button variant="outline" onClick={() => setSearchTerm("")}>
          Clear
        </Button>
      </div>

      {/* table — only this area scrolls horizontally/vertically */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full max-w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
            <Table className="min-w-[1200px]">
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[220px]">Job Title</TableHead>
                  <TableHead className="min-w-[160px]">Company</TableHead>
                  <TableHead className="min-w-[110px]">Openings</TableHead>
                  <TableHead className="min-w-[130px]">Type</TableHead>
                  <TableHead className="min-w-[130px]">Work Mode</TableHead>
                  <TableHead className="min-w-[200px]">Salary</TableHead>
                  <TableHead className="min-w-[160px]">Status</TableHead>
                  <TableHead className="text-right min-w-[220px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground h-32"
                    >
                      No jobs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company ?? "-"}</TableCell>
                      <TableCell>{job.openings ?? 1}</TableCell>
                      <TableCell>{job.type ?? "Full-time"}</TableCell>
                      <TableCell>{job.work_mode ?? "On-site"}</TableCell>
                      <TableCell>
                        {job.salary_min && job.salary_max
                          ? `₹ ${job.salary_min} – ${job.salary_max}`
                          : job.salary_range ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={(job.status as Status) ?? "Action"}
                          onValueChange={(value) =>
                            handleStatusChange(job.id, value as Status)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8 bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="Action">Action</SelectItem>
                            <SelectItem value="Hold">Hold</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedJob(job);
                              setViewDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700"
                            onClick={() => {
                              setSelectedJob(job);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setJobToDelete(job);
                              setDeleteDialogOpen(true);
                            }}
                          >
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

      <JobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={selectedJob}
        onSuccess={fetchJobs}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedJob.title}</h3>
                {selectedJob.company && (
                  <p className="text-muted-foreground mt-1">
                    {selectedJob.company}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      (selectedJob.status ?? "Action") === "Action"
                        ? "default"
                        : selectedJob.status === "Hold"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {selectedJob.status ?? "Action"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Openings</p>
                  <p className="font-medium">{selectedJob.openings ?? 1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {selectedJob.type ?? "Full-time"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Mode</p>
                  <p className="font-medium">
                    {selectedJob.work_mode ?? "On-site"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium">{selectedJob.urgency ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">
                    {selectedJob.salary_min && selectedJob.salary_max
                      ? `₹ ${selectedJob.salary_min} – ${selectedJob.salary_max}`
                      : selectedJob.salary_range ?? "Not specified"}
                  </p>
                </div>
                {selectedJob.commission !== null &&
                  selectedJob.commission !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Commission
                      </p>
                      <p className="font-medium">₹ {selectedJob.commission}</p>
                    </div>
                  )}
                {selectedJob.tenure && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">{selectedJob.tenure}</p>
                  </div>
                )}
                {selectedJob.shift && (
                  <div>
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <p className="font-medium">{selectedJob.shift}</p>
                  </div>
                )}
                {selectedJob.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedJob.category}</p>
                  </div>
                )}
                {selectedJob.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{selectedJob.experience}</p>
                  </div>
                )}
                {selectedJob.age_range && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age Range</p>
                    <p className="font-medium">{selectedJob.age_range}</p>
                  </div>
                )}
              </div>

              {selectedJob.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  <p className="font-medium">{selectedJob.address}</p>
                </div>
              )}

              {selectedJob.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Job Description
                  </p>
                  <p className="whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {selectedJob.required_skills && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Required Skills
                  </p>
                  <p className="whitespace-pre-wrap">
                    {selectedJob.required_skills}
                  </p>
                </div>
              )}

              {selectedJob.preferred_skills && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Preferred Skills
                  </p>
                  <p className="whitespace-pre-wrap">
                    {selectedJob.preferred_skills}
                  </p>
                </div>
              )}

              {selectedJob.nice_to_have && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Nice to Have
                  </p>
                  <p className="whitespace-pre-wrap">
                    {selectedJob.nice_to_have}
                  </p>
                </div>
              )}

              {selectedJob.languages_required && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Languages Required
                  </p>
                  <p className="whitespace-pre-wrap">
                    {selectedJob.languages_required}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be
              undone and will also delete all associated applications and
              interviews.
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
