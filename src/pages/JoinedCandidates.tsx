import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function JoinedCandidates() {
  const [joinedCandidates, setJoinedCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    application_id: "",
    joined_date: new Date().toISOString().split("T")[0],
    tenure_days: "90",
    invoice_no: "",
    invoice_date: ""
  });
  const [invoiceData, setInvoiceData] = useState({
    invoice_no: "",
    invoice_date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: appsData, error } = await supabase
      .from("applications")
      .select(`
        *,
        candidates:candidate_id(name, email, phone),
        jobs:job_id(title, department, location)
      `)
      .order("applied_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch applications");
      return;
    }
    setApplications(appsData || []);

    // Demo joined candidates
    if (appsData && appsData.length > 0) {
      const demoJoined = appsData.slice(0, 1).map((app) => ({
        id: `joined-1`,
        application_id: app.id,
        candidate: app.candidates?.name || "Unknown",
        job_title: app.jobs?.title || "Unknown Job",
        company: app.company || "Company",
        joined_date: new Date().toISOString().split("T")[0],
        tenure_days: 90,
        invoice_no: "",
        invoice_date: ""
      }));
      setJoinedCandidates(demoJoined);
    }
  };

  const calculateRemaining = (joinedDate: string, tenureDays: number) => {
    if (!joinedDate || !tenureDays) return null;
    const joined = new Date(joinedDate);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = tenureDays - daysPassed;
    return remaining < 0 ? 0 : remaining;
  };

  const getRemainingBadge = (remaining: number | null) => {
    if (remaining === null) return <Badge className="bg-slate-100 text-slate-700 border-slate-200">—</Badge>;
    if (remaining === 0) return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
    if (remaining <= 10) return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{remaining} days</Badge>;
    return <Badge className="bg-blue-50 text-blue-700 border-blue-200">{remaining} days</Badge>;
  };

  const filteredCandidates = joinedCandidates.filter(candidate => {
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
      id: editingCandidate?.id || `joined-${Date.now()}`,
      application_id: formData.application_id,
      candidate: app.candidates?.name || "Unknown",
      job_title: app.jobs?.title || "Unknown Job",
      company: app.company || "Company",
      joined_date: formData.joined_date,
      tenure_days: parseInt(formData.tenure_days),
      invoice_no: formData.invoice_no,
      invoice_date: formData.invoice_date
    };

    if (editingCandidate) {
      setJoinedCandidates(prev => 
        prev.map(c => c.id === editingCandidate.id ? newCandidate : c)
      );
      toast.success("Joined candidate updated!");
    } else {
      setJoinedCandidates(prev => [newCandidate, ...prev]);
      toast.success("Joined candidate added!");
    }

    setDialogOpen(false);
    setEditingCandidate(null);
    setFormData({
      application_id: "",
      joined_date: new Date().toISOString().split("T")[0],
      tenure_days: "90",
      invoice_no: "",
      invoice_date: ""
    });
  };

  const handleRaiseInvoice = () => {
    if (!currentInvoiceId) return;
    
    setJoinedCandidates(prev =>
      prev.map(c =>
        c.id === currentInvoiceId
          ? { ...c, invoice_no: invoiceData.invoice_no, invoice_date: invoiceData.invoice_date }
          : c
      )
    );

    toast.success("Invoice marked as raised!");
    setInvoiceDialogOpen(false);
    setCurrentInvoiceId(null);
    setInvoiceData({
      invoice_no: "",
      invoice_date: new Date().toISOString().split("T")[0]
    });
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setFormData({
      application_id: candidate.application_id,
      joined_date: candidate.joined_date,
      tenure_days: candidate.tenure_days.toString(),
      invoice_no: candidate.invoice_no,
      invoice_date: candidate.invoice_date
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this joined candidate?")) {
      setJoinedCandidates(prev => prev.filter(c => c.id !== id));
      toast.success("Joined candidate deleted!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Joined Candidates</h1>
          <p className="text-muted-foreground">Employees who have successfully joined</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
          onClick={() => {
            setEditingCandidate(null);
            setDialogOpen(true);
          }}
        >
          + Add Joined
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
          <table className="w-full min-w-[1120px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Candidate Name</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Job</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Joined Date</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Tenure</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Remaining</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Raise Invoice</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground bg-background">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => {
                const remaining = calculateRemaining(candidate.joined_date, candidate.tenure_days);
                return (
                  <tr key={candidate.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-teal-600" />
                        {candidate.candidate}
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <div>{candidate.job_title}</div>
                      <div className="text-muted-foreground">({candidate.company})</div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{candidate.joined_date || "-"}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {candidate.tenure_days ? `${candidate.tenure_days} days` : "-"}
                    </td>
                    <td className="p-3">{getRemainingBadge(remaining)}</td>
                    <td className="p-3">
                      {candidate.invoice_no && candidate.invoice_date ? (
                        <div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Raised</Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {candidate.invoice_no} • {candidate.invoice_date}
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setCurrentInvoiceId(candidate.id);
                            setInvoiceDialogOpen(true);
                          }}
                        >
                          Raise
                        </Button>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredCandidates.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-slate-500">
            No joined candidates
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCandidate ? "Edit Joined Candidate" : "Add Joined Candidate"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Pick from Selected / Applications *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Joined Date *</Label>
                <Input
                  type="date"
                  value={formData.joined_date}
                  onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tenure (days) *</Label>
                <Input
                  type="number"
                  value={formData.tenure_days}
                  onChange={(e) => setFormData({ ...formData, tenure_days: e.target.value })}
                  min="1"
                  placeholder="e.g., 90"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number (optional)</Label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                  placeholder="INV-00123"
                />
              </div>
              <div>
                <Label>Invoice Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-teal-500 to-cyan-600">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Invoice Number *</Label>
              <Input
                value={invoiceData.invoice_no}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_no: e.target.value })}
                placeholder="INV-00123"
                required
              />
            </div>
            <div>
              <Label>Invoice Date *</Label>
              <Input
                type="date"
                value={invoiceData.invoice_date}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoice_date: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRaiseInvoice} className="bg-gradient-to-r from-teal-500 to-cyan-600">
                Mark as Raised
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
