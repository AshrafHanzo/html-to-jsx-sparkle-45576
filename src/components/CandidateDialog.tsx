// src/components/CandidateDialog.tsx
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

/* ---------------------------
   Types
   --------------------------- */
type WorkType = "Remote" | "Hybrid" | "On-site";
type StatusType =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Selected"
  | "Rejected"
  | "Joined";
type GenderType = "Male" | "Female" | "Other";

/* Candidate-like shape (accept string[] for work_types so Candidate from table is compatible) */
type CandidateLike = {
  id?: number | string;

  name?: string;
  full_name?: string;

  father_name?: string;
  fathers_name?: string;

  email?: string;
  email_address?: string;

  phone?: string;
  phone_number?: string;

  dob?: string;
  date_of_birth?: string;

  gender?: GenderType | string;

  aadhaar?: string;
  aadhaar_number?: string;

  street?: string;
  street_address?: string;

  locality?: string;
  area_locality?: string;

  city?: string;
  pincode?: string;

  languages?: string[] | string;
  select_languages?: string[];

  education?: string;
  educational_qualification?: string;

  exp_years?: number;
  work_experience?: number;

  exp_months?: number;
  additional_months?: number;

  position?: string;
  job_position?: string;

  skills?: string[] | string;
  technical_professional_skills?: string;

  pref_categories?: string[] | string;
  preferred_industries_categories?: string;

  pref_employment?: string[] | string;
  preferred_employment_types?: string[];

  work_types?: (WorkType | string)[];
  preferred_work_types?: WorkType | string;

  status?: StatusType | string;

  job_id?: number | string | null;

  resume_url?: string | null;
};

interface CandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: CandidateLike | null;
  onSuccess: () => void;
}

/* ---------------------------
   API helpers
   --------------------------- */
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
const api = (p: string) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

/* ---------------------------
   JobItem type + parsing helpers (no any)
   --------------------------- */
type JobItem = {
  id: number;
  job_title: string;
  company: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceToNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
}

function coerceToString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return fallback;
}

function parseJobRecord(raw: unknown): JobItem | null {
  if (!isPlainObject(raw)) return null;

  const idVal = coerceToNumber(
    raw["id"] ?? raw["job_id"] ?? raw["jobId"] ?? null,
    NaN
  );
  if (!Number.isFinite(idVal) || idVal <= 0) return null;

  const title = coerceToString(
    raw["job_title"] ?? raw["title"] ?? raw["role"] ?? ""
  );
  if (!title) return null;

  const company = coerceToString(
    raw["company"] ?? raw["employer"] ?? raw["company_name"] ?? ""
  );

  return { id: idVal, job_title: title, company };
}

/* Parse "title — company" into [title, company] */
function splitTitleCompany(s: string): { title: string; company: string } {
  const parts = s.split(/\s*(?:—|–|-)\s*/);
  return {
    title: (parts[0] ?? "").trim(),
    company: parts.length > 1 ? parts.slice(1).join(" - ").trim() : "",
  };
}

/* ---------------------------
   Component
   --------------------------- */
export function CandidateDialog({
  open,
  onOpenChange,
  candidate,
  onSuccess,
}: CandidateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  type FormState = {
    name: string;
    father_name: string;
    email: string;
    phone: string;
    dob: string;
    gender: GenderType;
    aadhaar: string;
    street: string;
    locality: string;
    city: string;
    pincode: string;
    languages: string;
    education: string;
    exp_years: number;
    exp_months: number;

    // <-- separated fields for UI
    position: string; // title only
    company: string;

    skills: string;
    pref_categories: string;
    pref_employment: string;
    work_types: (WorkType | string)[];
    status: StatusType;

    job_id: number | string | null;
    resume_url: string;
  };

  const [formData, setFormData] = useState<FormState>({
    name: "",
    father_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Male",
    aadhaar: "",
    street: "",
    locality: "",
    city: "",
    pincode: "",
    languages: "",
    education: "",
    exp_years: 0,
    exp_months: 0,
    position: "",
    company: "",
    skills: "",
    pref_categories: "",
    pref_employment: "",
    work_types: [],
    status: "Applied",
    job_id: null,
    resume_url: "",
  });

  const fileRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Jobs dropdown state ---------- */
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);

  /* Control the two Selects so picking sets inputs immediately */
  const [jobSelectValue, setJobSelectValue] = useState<string>(""); // job id as string
  const [companySelectValue, setCompanySelectValue] = useState<string>(""); // company name

  /* ---------- small helpers ---------- */
  const firstString = (
    c: CandidateLike | null,
    keys: (keyof CandidateLike)[]
  ): string => {
    if (!c) return "";
    for (const k of keys) {
      const v = c[k];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };

  const firstNumber = (
    c: CandidateLike | null,
    keys: (keyof CandidateLike)[],
    fallback = 0
  ): number => {
    if (!c) return fallback;
    for (const k of keys) {
      const v = c[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
        return Number(v);
    }
    return fallback;
  };

  const firstStringArray = (
    c: CandidateLike | null,
    keys: (keyof CandidateLike)[]
  ): string[] | null => {
    if (!c) return null;
    for (const k of keys) {
      const v = c[k];
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
        return v as string[];
      }
    }
    return null;
  };

  const firstWorkType = (c: CandidateLike | null): (WorkType | string)[] => {
    if (!c) return [];
    if (Array.isArray(c.work_types))
      return c.work_types.filter(Boolean) as (WorkType | string)[];
    if (c.preferred_work_types) return [c.preferred_work_types as WorkType];
    return [];
  };

  const normalizeStatus = (s?: string): StatusType => {
    if (!s) return "Applied";
    const t = s.trim().toLowerCase();
    if (t === "applied") return "Applied";
    if (t === "screening" || t === "screened" || t === "contacted")
      return "Screening";
    if (t === "interview" || t === "interviewed" || t === "interviewing")
      return "Interview";
    if (t === "selected" || t === "offer" || t === "offered") return "Selected";
    if (t === "rejected" || t === "declined") return "Rejected";
    if (t === "joined") return "Joined";
    return "Applied";
  };

  /* ---------- Prefill on open ---------- */
  useEffect(() => {
    const c = candidate ?? null;
    if (c) {
      setResumeFile(null);

      const name = firstString(c, ["name", "full_name"]);
      const father_name = firstString(c, ["father_name", "fathers_name"]);
      const email = firstString(c, ["email", "email_address"]);
      const phone = firstString(c, ["phone", "phone_number"]);
      const dob = firstString(c, ["dob", "date_of_birth"]);
      const gender = (c.gender as GenderType) ?? "Male";
      const aadhaar = firstString(c, ["aadhaar", "aadhaar_number"]);
      const street = firstString(c, ["street", "street_address"]);
      const locality = firstString(c, ["locality", "area_locality"]);
      const city = firstString(c, ["city"]);
      const pincode = firstString(c, ["pincode"]);
      const education = firstString(c, [
        "education",
        "educational_qualification",
      ]);

      // Split combined job_position if present
      const combined = firstString(c, ["position", "job_position"]);
      const { title, company } = splitTitleCompany(combined);

      const tps = firstString(c, ["technical_professional_skills"]);

      const langsArr = firstStringArray(c, ["languages", "select_languages"]);
      const languages = langsArr
        ? langsArr.join(", ")
        : firstString(c, ["languages"]);
      const prefEmpArr = firstStringArray(c, [
        "pref_employment",
        "preferred_employment_types",
      ]);
      const pref_employment = prefEmpArr ? prefEmpArr.join(", ") : "";
      const prefCatArr = firstStringArray(c, ["pref_categories"]);
      const pref_categories = prefCatArr
        ? prefCatArr.join(", ")
        : firstString(c, ["preferred_industries_categories"]);

      const exp_years = firstNumber(c, ["exp_years", "work_experience"], 0);
      const exp_months = firstNumber(c, ["exp_months", "additional_months"], 0);

      const work_types = firstWorkType(c);

      const status = normalizeStatus(
        typeof c.status === "string" ? c.status : undefined
      );
      const resume_url = c.resume_url ?? "";
      const jobIdFromCandidate = c.job_id ?? null;

      setFormData({
        name,
        father_name,
        email,
        phone,
        dob,
        gender,
        aadhaar,
        street,
        locality,
        city,
        pincode,
        languages,
        education,
        exp_years,
        exp_months,
        position: title,
        company,
        skills: tps,
        pref_categories,
        pref_employment,
        work_types,
        status,
        job_id: jobIdFromCandidate ?? null,
        resume_url: typeof resume_url === "string" ? resume_url : "",
      });

      setJobSelectValue(
        jobIdFromCandidate !== null && jobIdFromCandidate !== undefined
          ? String(jobIdFromCandidate)
          : ""
      );
      setCompanySelectValue(company || "");
    } else {
      setResumeFile(null);
      setFormData({
        name: "",
        father_name: "",
        email: "",
        phone: "",
        dob: "",
        gender: "Male",
        aadhaar: "",
        street: "",
        locality: "",
        city: "",
        pincode: "",
        languages: "",
        education: "",
        exp_years: 0,
        exp_months: 0,
        position: "",
        company: "",
        skills: "",
        pref_categories: "",
        pref_employment: "",
        work_types: [],
        status: "Applied",
        job_id: null,
        resume_url: "",
      });
      setJobSelectValue("");
      setCompanySelectValue("");
    }
  }, [candidate, open]);

  /* ---------- resume link ---------- */
  const currentResumeLink = useMemo(() => {
    if (!formData.resume_url) return "";
    const id = candidate?.id ?? formData.resume_url;
    return id ? api(`/api/candidates/resume/${id}`) : "";
  }, [candidate?.id, formData.resume_url]);

  /* ---------- Fetch jobs for dropdown ---------- */
  useEffect(() => {
    const ac = new AbortController();
    async function loadJobs(): Promise<void> {
      setJobsLoading(true);
      try {
        const res = await fetch(api(`/api/jobs?page=1&page_size=1000`), {
          signal: ac.signal,
        });
        if (!res.ok) {
          const fallback = await fetch(api(`/api/jobs`), { signal: ac.signal });
          if (!fallback.ok) throw new Error("Failed to fetch jobs");
          const fallbackJson: unknown = await fallback.json();
          const fallbackItems: unknown[] = Array.isArray(fallbackJson)
            ? fallbackJson
            : Array.isArray((fallbackJson as { items?: unknown[] })?.items)
            ? (fallbackJson as { items?: unknown[] }).items!
            : [];
          const parsed = fallbackItems
            .map(parseJobRecord)
            .filter((j): j is JobItem => j !== null);
          setJobs(parsed);
        } else {
          const json: unknown = await res.json();
          const list: unknown[] = Array.isArray(json)
            ? json
            : Array.isArray((json as { items?: unknown[] })?.items)
            ? (json as { items?: unknown[] }).items!
            : [];
          const mapped = list
            .map(parseJobRecord)
            .filter((j): j is JobItem => j !== null);
          setJobs(mapped);
        }
      } catch (err) {
        console.error("Failed to load jobs for dropdown", err);
        toast.error("Failed to load jobs list");
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    }
    loadJobs();
    return () => ac.abort();
  }, []);

  /* Distinct companies for the Company dropdown */
  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.company && !set.has(j.company)) set.add(j.company);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  /* ---------- Resume ---------- */
  const onResumeChosen: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0] || null;
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      toast.error("Please upload a PDF, DOC, or DOCX.");
      return;
    }
    setResumeFile(file);
    toast.success("Resume selected — it will be uploaded on Save.");
  };

  /* ---------- Helpers ---------- */
  const safeErr = async (res: Response) => {
    try {
      const j = (await res.json()) as {
        detail?: string;
        message?: string;
      } | null;
      return j?.detail || j?.message || res.statusText;
    } catch {
      return res.statusText;
    }
  };

  const toList = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

  /* ---------- Submit ---------- */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!formData.position.trim()) {
      toast.error("Job Position is required.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Full Name is required.");
      return;
    }
    if (!formData.father_name.trim()) {
      toast.error("Father's Name is required.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone Number is required.");
      return;
    }
    if (!formData.dob.trim()) {
      toast.error("Date of Birth is required.");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required.");
      return;
    }
    if (!formData.languages.trim()) {
      toast.error("Languages are required.");
      return;
    }
    if (!formData.education.trim()) {
      toast.error("Educational Qualification is required.");
      return;
    }
    if ((formData.work_types || []).length === 0) {
      toast.error("Select at least one Preferred Work Type.");
      return;
    }
    if (!formData.pref_employment.trim()) {
      toast.error("Preferred Employment Types are required.");
      return;
    }

    const title = formData.position.trim();
    const company = formData.company.trim();
    const combinedJobPosition = company ? `${title} — ${company}` : title;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        job_position: combinedJobPosition, // <- backend single field
        full_name: formData.name,
        fathers_name: formData.father_name,
        email_address: formData.email,
        phone_number: formData.phone,
        date_of_birth: formData.dob || null,
        gender: formData.gender,

        aadhaar_number: formData.aadhaar || null,
        street_address: formData.street || null,
        area_locality: formData.locality || null,
        city: formData.city || null,
        pincode: formData.pincode || null,

        select_languages: toList(formData.languages),
        educational_qualification: formData.education,
        work_experience: Number(formData.exp_years) || 0,
        additional_months: Number(formData.exp_months) || 0,

        technical_professional_skills: formData.skills,
        preferred_industries_categories: formData.pref_categories,
        preferred_employment_types: toList(formData.pref_employment),

        preferred_work_types: (formData.work_types[0] || "On-site") as WorkType,
        status: formData.status as StatusType,

        job_id: formData.job_id ?? null,
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      if (resumeFile) fd.append("resume", resumeFile);

      const idVal =
        candidate?.id !== undefined &&
        candidate?.id !== null &&
        String(candidate.id).trim()
          ? String(candidate.id)
          : "";

      const url = idVal
        ? api(`/api/candidates/${idVal}`)
        : api(`/api/candidates`);
      const method = idVal ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const msg = await safeErr(res);
        throw new Error(msg || "Failed to save candidate");
      }

      toast.success(
        idVal
          ? "Candidate updated successfully!"
          : "Candidate added successfully!"
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Job & Company pick handlers (controlled Selects) ---------- */
  const onPickJobId = (jobIdStr: string) => {
    setJobSelectValue(jobIdStr);
    const job = jobs.find((j) => String(j.id) === jobIdStr);
    if (!job) return;
    // Set title + company + job_id; satisfy required instantly
    setFormData((prev) => ({
      ...prev,
      position: job.job_title,
      company: job.company || prev.company,
      job_id: job.id,
    }));
    // keep companySelectValue in sync if we set company from the job
    if (job.company) setCompanySelectValue(job.company);
  };

  const onPickCompanyName = (companyName: string) => {
    setCompanySelectValue(companyName);
    setFormData((prev) => ({ ...prev, company: companyName }));
    // Do NOT touch job_id or position when picking only company
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {candidate ? "Edit Candidate" : "Add Candidate"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume */}
          <div className="space-y-2">
            <Label>Resume (PDF / DOC / DOCX)</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                Upload Resume
              </Button>
              {resumeFile ? (
                <span className="text-sm text-muted-foreground">
                  Selected: {resumeFile.name}
                </span>
              ) : currentResumeLink ? (
                <a
                  href={currentResumeLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  View current file
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No file selected
                </span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={onResumeChosen}
            />
          </div>

          {/* Job Position (title only) */}
          <div className="space-y-2">
            <Label htmlFor="position">Job Position *</Label>
            <div className="flex items-center gap-3">
              <Input
                id="position"
                required
                value={formData.position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    position: e.target.value,
                    // if user types manually, don't assume a job id
                    job_id: null,
                  })
                }
                placeholder="e.g., Customer Care Executive"
              />
              <div className="w-[160px]">
                <Select value={jobSelectValue} onValueChange={onPickJobId}>
                  <SelectTrigger className="w-full h-10 justify-center">
                    <SelectValue
                      placeholder={jobsLoading ? "Loading..." : "Pick job"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No jobs
                      </div>
                    ) : (
                      jobs.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>
                          {/* Title only (per your request) */}
                          <div className="py-1 text-sm font-medium">
                            {j.job_title}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Company (manual + dropdown of company names only) */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <div className="flex items-center gap-3">
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company: e.target.value,
                  })
                }
                placeholder="e.g., Altruist Technologies Private Limited"
              />
              <div className="w-[160px]">
                <Select
                  value={companySelectValue}
                  onValueChange={onPickCompanyName}
                >
                  <SelectTrigger className="w-full h-10 justify-center">
                    <SelectValue placeholder="Pick..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No companies
                      </div>
                    ) : (
                      companies.map((c) => (
                        <SelectItem key={c} value={c}>
                          <div className="py-1 text-sm">{c}</div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You can type a job or company manually, or pick a job/company from
              the dropdown — picking a <strong>job</strong> sets the Title and
              job id; picking a <strong>company</strong> fills only the Company
              field.
            </p>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_name">Father&apos;s Name *</Label>
              <Input
                id="father_name"
                required
                value={formData.father_name}
                onChange={(e) =>
                  setFormData({ ...formData, father_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="candidate@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                required
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: GenderType) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar Number (optional)</Label>
              <Input
                id="aadhaar"
                maxLength={12}
                value={formData.aadhaar}
                onChange={(e) =>
                  setFormData({ ...formData, aadhaar: e.target.value })
                }
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-semibold mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locality">Area/Locality</Label>
                <Input
                  id="locality"
                  value={formData.locality}
                  onChange={(e) =>
                    setFormData({ ...formData, locality: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Skills & Preferences */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="languages">
                Select Languages * (comma-separated)
              </Label>
              <Input
                id="languages"
                required
                value={formData.languages}
                onChange={(e) =>
                  setFormData({ ...formData, languages: e.target.value })
                }
                placeholder="English, Tamil, Hindi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Educational Qualification *</Label>
              <Input
                id="education"
                required
                value={formData.education}
                onChange={(e) =>
                  setFormData({ ...formData, education: e.target.value })
                }
                placeholder="e.g., UG / PG / Diploma"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp_years">Work Experience (Years) *</Label>
                <Input
                  id="exp_years"
                  type="number"
                  min={0}
                  required
                  value={formData.exp_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exp_years: Number.isFinite(parseInt(e.target.value, 10))
                        ? parseInt(e.target.value, 10)
                        : 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp_months">Additional Months *</Label>
                <Input
                  id="exp_months"
                  type="number"
                  min={0}
                  max={11}
                  required
                  value={formData.exp_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exp_months: Number.isFinite(parseInt(e.target.value, 10))
                        ? parseInt(e.target.value, 10)
                        : 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">
                Technical & Professional Skills (comma-separated)
              </Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) =>
                  setFormData({ ...formData, skills: e.target.value })
                }
                placeholder="React, Python, Digital Marketing, ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref_categories">
                Preferred Industries & Job Categories (comma-separated)
              </Label>
              <Input
                id="pref_categories"
                value={formData.pref_categories}
                onChange={(e) =>
                  setFormData({ ...formData, pref_categories: e.target.value })
                }
                placeholder="BPO, Sales, Tech Support, ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref_employment">
                Preferred Employment Types * (comma-separated)
              </Label>
              <Input
                id="pref_employment"
                required
                value={formData.pref_employment}
                onChange={(e) =>
                  setFormData({ ...formData, pref_employment: e.target.value })
                }
                placeholder="Full-time, Part-time, Contract, Internship"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Work Types *</Label>
              <div className="flex gap-4">
                {(["Remote", "Hybrid", "On-site"] as WorkType[]).map((t) => (
                  <div key={t} className="flex items-center space-x-2">
                    <Checkbox
                      id={t}
                      checked={formData.work_types.includes(t)}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => {
                          const isOn = checked === true;
                          const exists = prev.work_types.includes(t);
                          const next = isOn
                            ? exists
                              ? prev.work_types
                              : [...prev.work_types, t]
                            : prev.work_types.filter((x) => x !== t);
                          return { ...prev, work_types: next };
                        })
                      }
                    />
                    <label htmlFor={t} className="text-sm cursor-pointer">
                      {t}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Backend expects one option; we send the first selected.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusType) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Screening">Screening</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Selected">Selected</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Joined">Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {loading
                ? "Saving..."
                : candidate
                ? "Update Candidate"
                : "Save Candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
