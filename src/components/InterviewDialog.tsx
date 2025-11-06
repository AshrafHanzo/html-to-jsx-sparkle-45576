import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview?: any;
  preSelectedCandidate?: string;
  preSelectedJob?: string;
  onSuccess: () => void;
}

export function InterviewDialog({ open, onOpenChange, interview, preSelectedCandidate, preSelectedJob, onSuccess }: InterviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    candidate_id: "",
    job_id: "",
    interview_date: "",
    interview_type: "Phone Screen",
    interviewer: "",
    location: "",
    status: "Scheduled",
    feedback: ""
  });

  useEffect(() => {
    if (open) {
      fetchCandidates();
      fetchJobs();
    }
  }, [open]);

  useEffect(() => {
    if (interview) {
      const date = new Date(interview.interview_date);
      const dateString = date.toISOString().slice(0, 16);
      
      setFormData({
        candidate_id: interview.candidate_id || "",
        job_id: interview.job_id || "",
        interview_date: dateString,
        interview_type: interview.interview_type || "Phone Screen",
        interviewer: interview.interviewer || "",
        location: interview.location || "",
        status: interview.status || "Scheduled",
        feedback: interview.feedback || ""
      });
    } else {
      setFormData({
        candidate_id: preSelectedCandidate || "",
        job_id: preSelectedJob || "",
        interview_date: "",
        interview_type: "Phone Screen",
        interviewer: "",
        location: "",
        status: "Scheduled",
        feedback: ""
      });
    }
  }, [interview, open, preSelectedCandidate, preSelectedJob]);

  const fetchCandidates = async () => {
    const { data } = await supabase.from("candidates").select("*").order("name");
    if (data) setCandidates(data);
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("status", "Active").order("title");
    if (data) setJobs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (interview) {
        const { error } = await supabase
          .from("interviews")
          .update(formData)
          .eq("id", interview.id);

        if (error) throw error;
        toast.success("Interview updated successfully!");
      } else {
        const { error } = await supabase
          .from("interviews")
          .insert([formData]);

        if (error) throw error;
        toast.success("Interview scheduled successfully!");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{interview ? "Edit Interview" : "Schedule Interview"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="candidate_id">Candidate *</Label>
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
              <Label htmlFor="job_id">Job *</Label>
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
              <Label htmlFor="interview_date">Date & Time *</Label>
              <Input
                id="interview_date"
                type="datetime-local"
                value={formData.interview_date}
                onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview_type">Interview Type *</Label>
              <Select value={formData.interview_type} onValueChange={(value) => setFormData({ ...formData, interview_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Panel">Panel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewer">Interviewer</Label>
              <Input
                id="interviewer"
                value={formData.interviewer}
                onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Zoom, Office Room 301"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              rows={4}
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : interview ? "Update Interview" : "Schedule Interview"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}