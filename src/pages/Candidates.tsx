import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, MapPin, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidateDialog } from "@/components/CandidateDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function Candidates() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const statuses = ["all", "Applied", "Screening", "Interview", "Selected", "Rejected", "Joined"];

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (candidate.skills && candidate.skills.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Screening": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Interview": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Selected": return "bg-green-100 text-green-700 border-green-200";
      case "Rejected": return "bg-red-100 text-red-700 border-red-200";
      case "Joined": return "bg-teal-100 text-teal-700 border-teal-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground">Manage all candidate profiles</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
          onClick={() => {
            setSelectedCandidate(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search candidates by name, email, or skills..." 
            className="pl-10 border-slate-200 focus:border-sky-500 focus:ring-sky-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] border-slate-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="transition-all hover:shadow-lg border-sky-50 hover:border-sky-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white font-semibold">
                    {candidate.name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sky-900">{candidate.name}</h3>
                      <p className="text-sm text-slate-600">{candidate.experience || "No experience listed"}</p>
                    </div>
                    <Badge className={`${getStatusColor(candidate.status)} border text-xs`}>
                      {candidate.status}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-sky-500" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-sky-500" />
                        {candidate.phone}
                      </div>
                    )}
                    {candidate.position && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-sky-500" />
                        {candidate.position}
                      </div>
                    )}
                  </div>
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 3).map((skill: string, i: number) => (
                        <span key={i} className="rounded-md bg-sky-50 border border-sky-200 px-2 py-1 text-xs font-medium text-sky-700">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                          +{candidate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setCandidateToDelete(candidate);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-slate-500">
            No candidates found matching your criteria
          </div>
        </Card>
      )}

      <CandidateDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        candidate={selectedCandidate}
        onSuccess={fetchCandidates}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white font-semibold text-xl">
                    {selectedCandidate.name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold text-sky-900">{selectedCandidate.name}</h3>
                  <p className="text-slate-600">{selectedCandidate.position || "No position specified"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedCandidate.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Experience</p>
                  <p className="font-medium">{selectedCandidate.experience || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={`${getStatusColor(selectedCandidate.status)} border`}>
                    {selectedCandidate.status}
                  </Badge>
                </div>
              </div>
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill: string, i: number) => (
                      <span key={i} className="rounded-md bg-sky-50 border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedCandidate.resume_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Resume</p>
                  <a 
                    href={selectedCandidate.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-700 underline"
                  >
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