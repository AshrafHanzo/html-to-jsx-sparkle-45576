import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate?: any;
  onSuccess: () => void;
}

export function CandidateDialog({ open, onOpenChange, candidate, onSuccess }: CandidateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    skills: "",
    pref_categories: "",
    pref_employment: "",
    work_types: [] as string[],
    status: "Applied",
    resume_url: "",
  });

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || "",
        father_name: candidate.father_name || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        dob: candidate.dob || "",
        gender: candidate.gender || "Male",
        aadhaar: candidate.aadhaar || "",
        street: candidate.street || "",
        locality: candidate.locality || "",
        city: candidate.city || "",
        pincode: candidate.pincode || "",
        languages: Array.isArray(candidate.languages) ? candidate.languages.join(", ") : "",
        education: candidate.education || "",
        exp_years: candidate.exp_years || 0,
        exp_months: candidate.exp_months || 0,
        position: candidate.position || "",
        skills: Array.isArray(candidate.skills) ? candidate.skills.join(", ") : "",
        pref_categories: Array.isArray(candidate.pref_categories) ? candidate.pref_categories.join(", ") : "",
        pref_employment: Array.isArray(candidate.pref_employment) ? candidate.pref_employment.join(", ") : "",
        work_types: candidate.work_types || [],
        status: candidate.status || "Applied",
        resume_url: candidate.resume_url || "",
      });
    } else {
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
        skills: "",
        pref_categories: "",
        pref_employment: "",
        work_types: [],
        status: "Applied",
        resume_url: "",
      });
    }
  }, [candidate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const languagesArray = formData.languages.split(",").map((s) => s.trim()).filter(Boolean);
      const prefCategoriesArray = formData.pref_categories.split(",").map((s) => s.trim()).filter(Boolean);
      const prefEmploymentArray = formData.pref_employment.split(",").map((s) => s.trim()).filter(Boolean);

      const candidateData = {
        name: formData.name,
        father_name: formData.father_name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob || null,
        gender: formData.gender,
        aadhaar: formData.aadhaar,
        street: formData.street,
        locality: formData.locality,
        city: formData.city,
        pincode: formData.pincode,
        languages: languagesArray,
        education: formData.education,
        exp_years: formData.exp_years,
        exp_months: formData.exp_months,
        position: formData.position,
        skills: skillsArray,
        pref_categories: prefCategoriesArray,
        pref_employment: prefEmploymentArray,
        work_types: formData.work_types,
        status: formData.status,
        resume_url: formData.resume_url,
        experience: `${formData.exp_years} years ${formData.exp_months} months`,
      };

      let error;
      if (candidate) {
        ({ error } = await supabase
          .from("candidates")
          .update(candidateData)
          .eq("id", candidate.id));
      } else {
        ({ error } = await supabase
          .from("candidates")
          .insert([candidateData]));
      }

      if (error) throw error;

      toast.success(candidate ? "Candidate updated successfully!" : "Candidate added successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      work_types: prev.work_types.includes(type)
        ? prev.work_types.filter((t) => t !== type)
        : [...prev.work_types, type],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Upload */}
          <div className="space-y-2">
            <Label htmlFor="resume_url">Resume URL (optional)</Label>
            <Input
              id="resume_url"
              type="url"
              value={formData.resume_url}
              onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
              placeholder="https://example.com/resume.pdf"
            />
            <p className="text-xs text-muted-foreground">Upload resume to a cloud storage and paste URL here</p>
          </div>

          {/* Job Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Job Position *</Label>
            <Input
              id="position"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Customer Care Executive"
            />
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_name">Father's Name *</Label>
              <Input
                id="father_name"
                required
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
                onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locality">Area/Locality</Label>
                <Input
                  id="locality"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Skills & Preferences */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="languages">Select Languages * (comma-separated)</Label>
              <Input
                id="languages"
                required
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="English, Tamil, Hindi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="education">Educational Qualification *</Label>
              <Input
                id="education"
                required
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g., UG / PG / Diploma"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp_years">Work Experience (Years) *</Label>
                <Input
                  id="exp_years"
                  type="number"
                  min="0"
                  required
                  value={formData.exp_years}
                  onChange={(e) => setFormData({ ...formData, exp_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp_months">Additional Months *</Label>
                <Input
                  id="exp_months"
                  type="number"
                  min="0"
                  max="11"
                  required
                  value={formData.exp_months}
                  onChange={(e) => setFormData({ ...formData, exp_months: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Technical & Professional Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="React, Python, Digital Marketing, ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref_categories">Preferred Industries & Job Categories (comma-separated)</Label>
              <Input
                id="pref_categories"
                value={formData.pref_categories}
                onChange={(e) => setFormData({ ...formData, pref_categories: e.target.value })}
                placeholder="BPO, Sales, Tech Support, ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pref_employment">Preferred Employment Types * (comma-separated)</Label>
              <Input
                id="pref_employment"
                required
                value={formData.pref_employment}
                onChange={(e) => setFormData({ ...formData, pref_employment: e.target.value })}
                placeholder="Full-time, Part-time, Contract, Internship"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Work Types *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={formData.work_types.includes("Remote")}
                    onCheckedChange={() => toggleWorkType("Remote")}
                  />
                  <label htmlFor="remote" className="text-sm cursor-pointer">Remote</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hybrid"
                    checked={formData.work_types.includes("Hybrid")}
                    onCheckedChange={() => toggleWorkType("Hybrid")}
                  />
                  <label htmlFor="hybrid" className="text-sm cursor-pointer">Hybrid</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onsite"
                    checked={formData.work_types.includes("On-site")}
                    onCheckedChange={() => toggleWorkType("On-site")}
                  />
                  <label htmlFor="onsite" className="text-sm cursor-pointer">On-site</label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : candidate ? "Update Candidate" : "Save Candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
