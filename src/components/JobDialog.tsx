// src/components/JobDialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/** API base */
function getApiBase(): string {
  if (typeof import.meta !== "undefined" && "env" in import.meta) {
    const viteEnv = (import.meta as unknown as { env?: Record<string, string> })
      .env;
    const v = viteEnv?.VITE_API_BASE;
    if (v && v.trim()) return v.replace(/\/+$/, "");
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:30020`;
  }
  return "http://localhost:30020";
}
const API_BASE = getApiBase();
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

type Status = "Action" | "Hold" | "Closed";
type WorkType = "Full-Time" | "Part-Time" | "Contract" | "Internship";
type WorkMode = "On-Site" | "Remote" | "Hybrid";
type Urgency =
  | "Immediate"
  | "Within 1 Week"
  | "Within 2 Weeks"
  | "Within a Month";

type Job = {
  id: string;
  title: string;
  company?: string | null;
  openings?: number | null;
  type?: string | null;
  work_mode?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  status?: string | null;
  urgency?: string | null;
  commission?: number | null;
  tenure?: string | null;
  shift?: string | null;
  address?: string | null;
  category?: string | null;
  required_skills?: string | null;
  preferred_skills?: string | null;
  nice_to_have?: string | null;
  experience?: string | null;
  age_range?: string | null;
  languages_required?: string | null;
  seo_keywords?: string | null;
  description?: string | null;
};

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Job | null;
  onSuccess: () => void;
}

export function JobDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: JobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    type: "Full-Time",
    work_mode: "On-Site",
    salary_min: "",
    salary_max: "",
    status: "Action" as Status,
    openings: 1,
    urgency: "Immediate" as Urgency,
    commission: "",
    tenure: "",
    shift: "",
    address: "",
    category: "",
    required_skills: "",
    preferred_skills: "",
    nice_to_have: "",
    experience: "",
    age_range: "",
    languages_required: "",
    seo_keywords: "",
    description: "",
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        company: job.company || "",
        type: job.type || "Full-Time",
        work_mode: job.work_mode || "On-Site",
        salary_min: (job.salary_min ?? "").toString(),
        salary_max: (job.salary_max ?? "").toString(),
        status: (job.status as Status) || "Action",
        openings: job.openings ?? 1,
        urgency: (job.urgency as Urgency) || "Immediate",
        commission: (job.commission ?? "").toString(),
        tenure: job.tenure ?? "",
        shift: job.shift ?? "",
        address: job.address ?? "",
        category: job.category ?? "",
        required_skills: job.required_skills ?? "",
        preferred_skills: job.preferred_skills ?? "",
        nice_to_have: job.nice_to_have ?? "",
        experience: job.experience ?? "",
        age_range: job.age_range ?? "",
        languages_required: job.languages_required ?? "",
        seo_keywords: job.seo_keywords ?? "",
        description: job.description ?? "",
      });
    } else {
      setFormData((s) => ({ ...s, title: "", company: "" }));
    }
  }, [job, open]);

  const asNum = (v: string): number | null => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const parseAge = (s: string) => {
    const m = s.match(/(\d+)\s*[-–]\s*(\d+)/);
    return m
      ? { age_min: Number(m[1]), age_max: Number(m[2]) }
      : { age_min: null, age_max: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.error("Job Title is required");
    if (!formData.company.trim()) return toast.error("Company is required");

    const { age_min, age_max } = parseAge(formData.age_range);

    const payload = {
      job_title: formData.title.trim(),
      company: formData.company.trim(),
      openings: formData.openings,
      type: formData.type,
      work_mode: formData.work_mode,
      salary_min: asNum(formData.salary_min),
      salary_max: asNum(formData.salary_max),
      status: formData.status,
      urgency: formData.urgency,
      commission: asNum(formData.commission),
      tenure: formData.tenure || null,
      shift: formData.shift || null,
      category: formData.category || null,
      experience: formData.experience || null,
      age_min,
      age_max,
      address: formData.address || null,
      job_description: formData.description || null,
      required_skills: formData.required_skills || null,
      preferred_skills: formData.preferred_skills || null,
      nice_to_have: formData.nice_to_have || null,
      languages_required: formData.languages_required || null,
      seo_keywords: formData.seo_keywords || null,
    };

    setLoading(true);
    try {
      const method = job ? "PUT" : "POST";
      const url = job ? api(`/api/jobs/${job.id}`) : api("/api/jobs");

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success(
        job ? "Job updated successfully!" : "Job created successfully!"
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save job");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Post New Job"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ---- UI stays EXACTLY as before ---- */}

          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Customer Care Executive"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                required
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as Status })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Action">Action</SelectItem>
                  <SelectItem value="Hold">Hold</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Openings</Label>
              <Input
                type="number"
                value={formData.openings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    openings: Number(e.target.value || 1),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as WorkType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Part-Time">Part-Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Mode</Label>
              <Select
                value={formData.work_mode}
                onValueChange={(value) =>
                  setFormData({ ...formData, work_mode: value as WorkMode })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-Site">On-Site</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) =>
                  setFormData({ ...formData, urgency: value as Urgency })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate</SelectItem>
                  <SelectItem value="Within 1 Week">Within 1 Week</SelectItem>
                  <SelectItem value="Within 2 Weeks">Within 2 Weeks</SelectItem>
                  <SelectItem value="Within a Month">Within a Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salary Min (₹)</Label>
              <Input
                value={formData.salary_min}
                onChange={(e) =>
                  setFormData({ ...formData, salary_min: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Salary Max (₹)</Label>
              <Input
                value={formData.salary_max}
                onChange={(e) =>
                  setFormData({ ...formData, salary_max: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Commission (₹)</Label>
            <Input
              value={formData.commission}
              onChange={(e) =>
                setFormData({ ...formData, commission: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tenure</Label>
            <Input
              value={formData.tenure}
              onChange={(e) =>
                setFormData({ ...formData, tenure: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Shift</Label>
            <Input
              value={formData.shift}
              onChange={(e) =>
                setFormData({ ...formData, shift: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Required Skills</Label>
            <Textarea
              rows={2}
              value={formData.required_skills}
              onChange={(e) =>
                setFormData({ ...formData, required_skills: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Skills</Label>
            <Textarea
              rows={2}
              value={formData.preferred_skills}
              onChange={(e) =>
                setFormData({ ...formData, preferred_skills: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Nice To Have</Label>
            <Textarea
              rows={2}
              value={formData.nice_to_have}
              onChange={(e) =>
                setFormData({ ...formData, nice_to_have: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Experience</Label>
              <Input
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Age Range</Label>
              <Input
                value={formData.age_range}
                onChange={(e) =>
                  setFormData({ ...formData, age_range: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Languages Required</Label>
            <Textarea
              rows={2}
              value={formData.languages_required}
              onChange={(e) =>
                setFormData({ ...formData, languages_required: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>SEO Keywords</Label>
            <Textarea
              rows={2}
              value={formData.seo_keywords}
              onChange={(e) =>
                setFormData({ ...formData, seo_keywords: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : job ? "Update Job" : "Save Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
