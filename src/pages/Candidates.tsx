import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidateDialog } from "@/components/CandidateDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Candidates() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<any>(null);
  
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch candidates");
      return;
    }
    setCandidates(data || []);
  };

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    
    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", candidateToDelete.id);
    
    if (error) {
      toast.error("Failed to delete candidate");
      return;
    }
    
    toast.success("Candidate deleted successfully!");
    setDeleteDialogOpen(false);
    setCandidateToDelete(null);
    fetchCandidates();
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    const { error } = await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", candidateId);
    
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    
    toast.success("Status updated successfully!");
    fetchCandidates();
  };

  const statuses = ["All", "Applied", "Screening", "Interview", "Selected", "Rejected", "Joined"];

  const handleSearch = () => {
    // Search is already reactive through filteredCandidates
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !searchTerm || 
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted-foreground">Manage all candidate profiles</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedCandidate(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search name, job or city…" 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-gradient-to-b from-background to-muted/20 shadow-sm">
        <div className="max-h-[calc(100vh-280px)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[22%]">Name</TableHead>
                <TableHead className="w-[18%]">Job Position</TableHead>
                <TableHead className="w-[14%]">Phone</TableHead>
                <TableHead className="w-[20%]">Email</TableHead>
                <TableHead className="w-[10%]">City</TableHead>
                <TableHead className="w-[10%]">Exp (Y/M)</TableHead>
                <TableHead className="w-[12%]">Status</TableHead>
                <TableHead className="w-[16%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No candidates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.name}</TableCell>
                    <TableCell>{candidate.position || "-"}</TableCell>
                    <TableCell>{candidate.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{candidate.email}</TableCell>
                    <TableCell>{candidate.city || "-"}</TableCell>
                    <TableCell>
                      {candidate.exp_years || 0}/{candidate.exp_months || 0}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={candidate.status}
                        onValueChange={(value) => handleStatusChange(candidate.id, value)}
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Applied", "Screening", "Interview", "Selected", "Rejected", "Joined"].map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCandidateToDelete(candidate);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Table shows key info. Use <strong>View</strong> to see the full profile.
      </p>

      <CandidateDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={selectedCandidate}
        onSuccess={fetchCandidates}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedCandidate.name}</h3>
                <p className="text-muted-foreground">
                  {selectedCandidate.position || "-"} • {selectedCandidate.city || "-"} • {selectedCandidate.gender || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Contact</h4>
                  <div className="space-y-1 text-sm">
                    <div>Email: <strong>{selectedCandidate.email}</strong></div>
                    <div>Phone: <strong>{selectedCandidate.phone || "-"}</strong></div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-semibold mb-2">Experience</h4>
                  <div className="space-y-1 text-sm">
                    <div>{selectedCandidate.exp_years || 0} years {selectedCandidate.exp_months || 0} months</div>
                    <div>Work Types: <strong>{(selectedCandidate.work_types || []).join(", ") || "-"}</strong></div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Address</h4>
                <p className="text-sm">
                  {[selectedCandidate.street, selectedCandidate.locality, selectedCandidate.city, selectedCandidate.pincode]
                    .filter(Boolean).join(", ") || "-"}
                </p>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.languages || []).map((lang: string, i: number) => (
                      <Badge key={i} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.skills || []).map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Preferred Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.pref_categories || []).map((cat: string, i: number) => (
                      <Badge key={i} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Employment Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.pref_employment || []).map((emp: string, i: number) => (
                      <Badge key={i} variant="secondary">{emp}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedCandidate.resume_url && (
                <div className="text-sm text-muted-foreground">
                  Resume: <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View Resume
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this candidate? This action cannot be undone and will also delete all associated applications and interviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}