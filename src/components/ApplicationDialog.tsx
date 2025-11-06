import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RECRUITERS = ["Muni Divya", "Surya K", "Thameem Ansari", "Nandhini Kumaravel", "Dhivya V", "Gokulakrishna V", "Snehal Prakash", "Selvaraj Veilumuthu"];
const SOURCES = ["Linked-in", "Job hai", "Apna", "Meta", "EarlyJobs", "Others"];
const STATUS = ["Applied", "Interview Scheduled", "Qualified", "Rejected", "Offer", "Joined"];

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: any;
  onSuccess: () => void;
}

export function ApplicationDialog({ open, onOpenChange, application, onSuccess }: ApplicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    candidate_id: "",
    job_id: "",
    company: "",
    status: "Applied",
    sourced_by: RECRUITERS[0],
    sourced_from: "Linked-in",
    assigned_to: RECRUITERS[0],
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchCandidates();
      fetchJobs();
    }
  }, [open]);

  useEffect(() => {
    if (application) {
      setFormData({
        candidate_id: application.candidate_id || "",
        job_id: application.job_id || "",
        company: application.company || "",
        status: application.status || "Applied",
        sourced_by: application.sourced_by || RECRUITERS[0],
        sourced_from: application.sourced_from || "Linked-in",
        assigned_to: application.assigned_to || RECRUITERS[0],
        notes: application.notes || ""
      });
    } else {
      setFormData({
        candidate_id: "",
        job_id: "",
        company: "",
        status: "Applied",
        sourced_by: RECRUITERS[0],
        sourced_from: "Linked-in",
        assigned_to: RECRUITERS[0],
        notes: ""
      });
    }
  }, [application, open]);

  const fetchCandidates = async () => {
    const { data } = await supabase.from("candidates").select("*").order("name");
    if (data) setCandidates(data);
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("title");
    if (data) setJobs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (application) {
        const { error } = await supabase
          .from("applications")
          .update(formData)
          .eq("id", application.id);

        if (error) throw error;
        toast.success("Application updated successfully!");
      } else {
        const { error } = await supabase
          .from("applications")
          .insert([formData]);

        if (error) throw error;
        toast.success("Application created successfully!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{application ? "Edit Application" : "Create Application"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="candidate_id">Candidate Name *</Label>
              <Select value={formData.candidate_id} onValueChange={(value) => setFormData({ ...formData, candidate_id: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_id">Job Title *</Label>
              <Select value={formData.job_id} onValueChange={(value) => setFormData({ ...formData, job_id: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <input
                id="company"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourced_by">Sourced By *</Label>
              <Select value={formData.sourced_by} onValueChange={(value) => setFormData({ ...formData, sourced_by: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECRUITERS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourced_from">Sourced From *</Label>
              <Select value={formData.sourced_from} onValueChange={(value) => setFormData({ ...formData, sourced_from: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assigned To *</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECRUITERS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Comments</Label>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add your comments here..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#1b6276] hover:bg-[#154f61]">
              {loading ? "Saving..." : application ? "Update Application" : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}