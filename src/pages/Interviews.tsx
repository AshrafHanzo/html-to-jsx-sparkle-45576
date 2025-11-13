"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search } from "lucide-react";
import { toast } from "sonner";

/* ========= Matches interviews.html =========
   Reads from localStorage key: APPLICATIONS_V1
   Status options: Scheduled, Completed - Qualified, Completed - Rejected, Rescheduled, No Show, Cancelled
   (from your interviews.html)  */
/* SOURCE: interviews.html */ // :contentReference[oaicite:1]{index=1}
const STORAGE_KEY = "APPLICATIONS_V1" as const;

type IvStatus =
  | "Scheduled"
  | "Completed - Qualified"
  | "Completed - Rejected"
  | "Rescheduled"
  | "No Show"
  | "Cancelled";

const IV_STATUSES: IvStatus[] = [
  "Scheduled",
  "Completed - Qualified",
  "Completed - Rejected",
  "Rescheduled",
  "No Show",
  "Cancelled",
];

type Interview = {
  round?: string | null;
  date?: string | null; // "YYYY-MM-DD"
  time?: string | null; // "HH:mm"
  status?: IvStatus | null;
};

type Application = {
  id: string;
  candidate: string;
  jobTitle: string;
  company: string;
  interviews?: Interview[];
};

type FlatIv = {
  appId: string;
  ivIndex: number;
  candidate: string;
  jobTitle: string;
  company: string;
  round: string;
  date: string;
  time: string;
  status: IvStatus;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const formatDateHuman = (iso?: string | null): string => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = pad2(d.getDate());
  const mon = d.toLocaleString("en-US", { month: "short" });
  const yyyy = d.getFullYear();
  return `${dd} ${mon} ${yyyy}`;
};

/* Read/Write same format as your HTML page uses */
const readApps = (): Application[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // minimal runtime guard
    return parsed as Application[];
  } catch {
    return [];
  }
};

const writeApps = (apps: Application[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
};

export default function Interviews() {
  const [apps, setApps] = useState<Application[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setApps(readApps());
  }, []);

  // keep LS in sync if we ever mutate
  useEffect(() => {
    writeApps(apps);
  }, [apps]);

  const rows: FlatIv[] = useMemo(() => {
    const out: FlatIv[] = [];
    apps.forEach((a) => {
      (a.interviews ?? []).forEach((iv, idx) => {
        out.push({
          appId: a.id,
          ivIndex: idx,
          candidate: a.candidate,
          jobTitle: a.jobTitle,
          company: a.company,
          round: iv.round ?? "Interview",
          date: iv.date ?? "",
          time: iv.time ?? "",
          status: (iv.status as IvStatus) ?? "Scheduled",
        });
      });
    });
    // Sort by date desc (empty goes last)
    out.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return out;
  }, [apps]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return rows;
    return rows.filter((r) =>
      [r.candidate, r.jobTitle, r.company, r.round, r.status]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [rows, q]);

  const updateStatus = (r: FlatIv, status: IvStatus) => {
    setApps((prev) => {
      const clone = structuredClone(prev) as Application[];
      const app = clone.find((a) => a.id === r.appId);
      if (!app) return prev;
      if (!app.interviews || !app.interviews[r.ivIndex]) return prev;
      app.interviews[r.ivIndex].status = status;
      return clone;
    });
    toast.success("Interview status updated");
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interviews</h1>
          <p className="text-muted-foreground">
            Upcoming and completed interview rounds
          </p>
        </div>
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

      {/* Table card — only this area scrolls */}
      <Card>
        <CardContent className="p-0">
          <div className="text-xs text-slate-500 bg-muted/20 px-4 py-2 border-b border-border text-right">
            ⇆ Slide horizontally for more columns
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto">
            <Table className="min-w-[1100px]">
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
                <TableRow>
                  <TableHead className="min-w-[260px]">
                    Candidate Name
                  </TableHead>
                  <TableHead className="min-w-[420px]">Job</TableHead>
                  <TableHead className="min-w-[260px]">
                    Interview Status
                  </TableHead>
                  <TableHead className="min-w-[260px]">
                    Date &amp; Time
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No interviews scheduled yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={`${r.appId}-${r.ivIndex}`}>
                      {/* Candidate + Round */}
                      <TableCell className="align-top">
                        <div className="font-semibold">{r.candidate}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.round}
                        </div>
                      </TableCell>

                      {/* Job + Company */}
                      <TableCell className="align-top">
                        <div className="font-medium">{r.jobTitle}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.company}
                        </div>
                      </TableCell>

                      {/* Status pill + dropdown */}
                      <TableCell className="align-top">
                        <Badge
                          variant={
                            r.status === "Scheduled"
                              ? "secondary"
                              : r.status === "Completed - Qualified"
                              ? "default"
                              : r.status === "Completed - Rejected"
                              ? "outline"
                              : "outline"
                          }
                          className="font-semibold"
                        >
                          {r.status}
                        </Badge>

                        <div className="mt-2">
                          <Select
                            value={r.status}
                            onValueChange={(v) =>
                              updateStatus(r, v as IvStatus)
                            }
                          >
                            <SelectTrigger className="h-9 w-[240px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {IV_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="align-top">
                        <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div className="font-semibold">
                              {r.date ? formatDateHuman(r.date) : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.time || ""}
                            </div>
                          </div>
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
    </div>
  );
}
