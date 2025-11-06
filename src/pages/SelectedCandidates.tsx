import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function SelectedCandidates() {
  const [selectedCandidates, setSelectedCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [formData, setFormData] = useState({
    application_id: "",
    selected_date: new Date().toISOString().split("T")[0],
    offer_letter: "Yes",
    joining_date: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch applications with candidates and jobs
    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select(`
        *,
        candidates:candidate_id(name, email, phone),
        jobs:job_id(title, department, location)
      `)
      .order("applied_date", { ascending: false });
    
    if (appsError) {
      toast.error("Failed to fetch applications");
      return;
    }
    setApplications(appsData || []);

    // For demo, create some selected candidates
    if (appsData && appsData.length > 0) {
      const demoSelected = appsData.slice(0, 2).map((app, idx) => ({
        id: `sel-${idx}`,
        application_id: app.id,
        candidate: app.candidates?.name || "Unknown",
        job_title: app.jobs?.title || "Unknown Job",
        company: app.company || "Company",
        selected_date: new Date().toISOString().split("T")[0],
        offer_letter: "Yes",
        joining_date: idx === 0 ? format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd") : ""
      }));
      setSelectedCandidates(demoSelected);
    }
  };

  const filteredCandidates = selectedCandidates.filter(candidate => {
    const query = searchTerm.toLowerCase();
    return (
      candidate.candidate?.toLowerCase().includes(query) ||
      candidate.job_title?.toLowerCase().includes(query) ||
      candidate.company?.toLowerCase().includes(query)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const app = applications.find(a => a.id === formData.application_id);
    if (!app) return;

    const newCandidate = {
      id: editingCandidate?.id || `sel-${Date.now()}`,
      application_id: formData.application_id,
      candidate: app.candidates?.name || "Unknown",
      job_title: app.jobs?.title || "Unknown Job",
      company: app.company || "Company",
      selected_date: formData.selected_date,
      offer_letter: formData.offer_letter,
      joining_date: formData.joining_date
    };

    if (editingCandidate) {
      setSelectedCandidates(prev => 
        prev.map(c => c.id === editingCandidate.id ? newCandidate : c)
      );
      toast.success("Selected candidate updated!");
    } else {
      setSelectedCandidates(prev => [newCandidate, ...prev]);
      toast.success("Selected candidate added!");
    }

    setDialogOpen(false);
    setEditingCandidate(null);
    setFormData({
      application_id: "",
      selected_date: new Date().toISOString().split("T")[0],
      offer_letter: "Yes",
      joining_date: ""
    });
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setFormData({
      application_id: candidate.application_id,
      selected_date: candidate.selected_date,
      offer_letter: candidate.offer_letter,
      joining_date: candidate.joining_date
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this selected candidate?")) {
      setSelectedCandidates(prev => prev.filter(c => c.id !== id));
      toast.success("Selected candidate deleted!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Selected Candidates</h1>
          <p className="text-muted-foreground">Candidates who have been selected for positions</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          onClick={() => {
            setEditingCandidate(null);
            setDialogOpen(true);
          }}
        >
          + Add Selected
        </Button>
      </div>

      <div className="relative">
        <Input
          placeholder="Search Candidate / Job / Company…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-slate-200"
        />
      </div>

      <Card className="border-sky-100">
        <div className="text-xs text-muted-foreground p-3 text-right border-b bg-muted/5">
          ⇆ Slide horizontally if needed
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Candidate Name</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Job</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Selected Date</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Offer Letter</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Joining Date</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {candidate.candidate}
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    <div>{candidate.job_title}</div>
                    <div className="text-muted-foreground">({candidate.company})</div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{candidate.selected_date || "-"}</td>
                  <td className="p-3">
                    {candidate.offer_letter === "Yes" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Yes</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">No</Badge>
                    )}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {candidate.joining_date || "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        onClick={() => handleEdit(candidate)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(candidate.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredCandidates.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-slate-500">
            No selected candidates yet
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCandidate ? "Edit Selected Candidate" : "Add Selected Candidate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Pick from Applications *</Label>
              <Select
                value={formData.application_id}
                onValueChange={(value) => setFormData({ ...formData, application_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.candidates?.name} — {app.jobs?.title} ({app.company})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">List shows Candidate — Job (Company)</p>
            </div>

            <div>
              <Label>Selected Date *</Label>
              <Input
                type="date"
                value={formData.selected_date}
                onChange={(e) => setFormData({ ...formData, selected_date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Offer Letter *</Label>
                <Select
                  value={formData.offer_letter}
                  onValueChange={(value) => setFormData({ ...formData, offer_letter: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Joining Date</Label>
                <Input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
