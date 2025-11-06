import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: any;
  onSuccess: () => void;
}

export function JobDialog({ open, onOpenChange, job, onSuccess }: JobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    department: "",
    location: "",
    type: "Full-time",
    work_mode: "On-site",
    description: "",
    requirements: "",
    salary_range: "",
    salary_min: "",
    salary_max: "",
    status: "Action",
    openings: 1,
    urgency: "Immediate",
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
    seo_keywords: ""
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        company: job.company || "",
        department: job.department || "",
        location: job.location || "",
        type: job.type || "Full-time",
        work_mode: job.work_mode || "On-site",
        description: job.description || "",
        requirements: job.requirements || "",
        salary_range: job.salary_range || "",
        salary_min: job.salary_min || "",
        salary_max: job.salary_max || "",
        status: job.status || "Action",
        openings: job.openings || 1,
        urgency: job.urgency || "Immediate",
        commission: job.commission || "",
        tenure: job.tenure || "",
        shift: job.shift || "",
        address: job.address || "",
        category: job.category || "",
        required_skills: job.required_skills || "",
        preferred_skills: job.preferred_skills || "",
        nice_to_have: job.nice_to_have || "",
        experience: job.experience || "",
        age_range: job.age_range || "",
        languages_required: job.languages_required || "",
        seo_keywords: job.seo_keywords || ""
      });
    } else {
      setFormData({
        title: "",
        company: "",
        department: "",
        location: "",
        type: "Full-time",
        work_mode: "On-site",
        description: "",
        requirements: "",
        salary_range: "",
        salary_min: "",
        salary_max: "",
        status: "Action",
        openings: 1,
        urgency: "Immediate",
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
        seo_keywords: ""
      });
    }
  }, [job, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (job) {
        const { error } = await supabase
          .from("jobs")
          .update(formData)
          .eq("id", job.id);

        if (error) throw error;
        toast.success("Job updated successfully!");
      } else {
        const { error } = await supabase
          .from("jobs")
          .insert([formData]);

        if (error) throw error;
        toast.success("Job created successfully!");
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
          <DialogTitle>{job ? "Edit Job" : "Post New Job"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Customer Care Executive"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              <Label htmlFor="openings">Openings</Label>
              <Input
                id="openings"
                type="number"
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_mode">Work Mode</Label>
              <Select value={formData.work_mode} onValueChange={(value) => setFormData({ ...formData, work_mode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate</SelectItem>
                  <SelectItem value="Within 1 week">Within 1 week</SelectItem>
                  <SelectItem value="Within 2 weeks">Within 2 weeks</SelectItem>
                  <SelectItem value="Within a month">Within a month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Salary Min (₹)</Label>
              <Input
                id="salary_min"
                placeholder="17000"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Salary Max (₹)</Label>
              <Input
                id="salary_max"
                placeholder="20000"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission (₹)</Label>
              <Input
                id="commission"
                placeholder="2100"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenure">Tenure</Label>
              <Input
                id="tenure"
                placeholder="90 Days"
                value={formData.tenure}
                onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Input
              id="shift"
              placeholder="Day Shifts"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="No 23 & 24, Hosur Rd, Bommanahalli, Bengaluru, Karnataka 560068"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="BPO"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Role overview and responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="required_skills">Required Skills (comma separated)</Label>
            <Textarea
              id="required_skills"
              rows={2}
              placeholder="Communication, Problem Solving, Customer Service"
              value={formData.required_skills}
              onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred_skills">Preferred Skills (comma separated)</Label>
            <Textarea
              id="preferred_skills"
              rows={2}
              placeholder="CRM Software, MS Office"
              value={formData.preferred_skills}
              onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nice_to_have">Nice to Have (comma separated)</Label>
            <Textarea
              id="nice_to_have"
              rows={2}
              placeholder="Previous BPO experience, Multilingual"
              value={formData.nice_to_have}
              onChange={(e) => setFormData({ ...formData, nice_to_have: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Input
                id="experience"
                placeholder="2-5 years"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age_range">Age Range</Label>
              <Input
                id="age_range"
                placeholder="21-35"
                value={formData.age_range}
                onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages_required">Languages Required (comma separated)</Label>
            <Textarea
              id="languages_required"
              rows={2}
              placeholder="English, Hindi, Kannada"
              value={formData.languages_required}
              onChange={(e) => setFormData({ ...formData, languages_required: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_keywords">SEO Keywords (comma separated)</Label>
            <Textarea
              id="seo_keywords"
              rows={2}
              placeholder="customer care executive jobs, BPO jobs in Bangalore"
              value={formData.seo_keywords}
              onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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