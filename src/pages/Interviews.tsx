import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Video, MapPin, Search, Filter, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InterviewDialog } from "@/components/InterviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function Interviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<any>(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    const { data, error } = await supabase
      .from("interviews")
      .select(`
        *,
        candidates:candidate_id(name, email, phone),
        jobs:job_id(title, department, location)
      `)
      .order("interview_date", { ascending: true });
    
    if (error) {
      toast.error("Failed to fetch interviews");
      return;
    }
    setInterviews(data || []);
  };

  const handleDelete = async () => {
    if (!interviewToDelete) return;
    
    const { error } = await supabase
      .from("interviews")
      .delete()
      .eq("id", interviewToDelete.id);
    
    if (error) {
      toast.error("Failed to delete interview");
      return;
    }
    
    toast.success("Interview deleted successfully!");
    setDeleteDialogOpen(false);
    setInterviewToDelete(null);
    fetchInterviews();
  };

  const types = ["all", "Phone Screen", "Technical", "HR", "Final", "Panel"];
  const statuses = ["all", "Scheduled", "Completed", "Cancelled", "Rescheduled"];

  const filteredInterviews = interviews.filter(interview => {
    const candidateName = interview.candidates?.name || "";
    const jobTitle = interview.jobs?.title || "";
    const matchesSearch = candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || interview.interview_type === typeFilter;
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Completed": return "bg-green-100 text-green-700 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "Rescheduled": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Interviews</h1>
          <p className="text-muted-foreground">Manage scheduled interviews</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
          onClick={() => {
            setSelectedInterview(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search by candidate or job..." 
            className="pl-10 border-slate-200 focus:border-sky-500 focus:ring-sky-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] border-slate-200">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {types.map(type => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] border-slate-200">
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
        {filteredInterviews.map((interview) => (
          <Card key={interview.id} className="transition-all hover:shadow-lg border-sky-50 hover:border-sky-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg text-sky-900">{interview.candidates?.name || "Unknown"}</CardTitle>
                  <p className="text-sm text-slate-600">{interview.jobs?.title || "Unknown Job"}</p>
                </div>
                <Badge className={`${getStatusColor(interview.status)} border`}>
                  {interview.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-sky-500" />
                  <span className="text-slate-700 font-medium">{format(new Date(interview.interview_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <span className="text-slate-700 font-medium">{format(new Date(interview.interview_date), "hh:mm a")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-sky-500" />
                  <span className="text-slate-700 font-medium">{interview.interview_type}</span>
                </div>
                {interview.interviewer && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Interviewer:</span>
                    <span className="text-slate-700 font-medium">{interview.interviewer}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50"
                  onClick={() => {
                    setSelectedInterview(interview);
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
                    setSelectedInterview(interview);
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
                    setInterviewToDelete(interview);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterviews.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No interviews found matching your criteria
        </div>
      )}

      <InterviewDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        interview={selectedInterview}
        onSuccess={fetchInterviews}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
          </DialogHeader>
          {selectedInterview && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-sky-900">{selectedInterview.candidates?.name || "Unknown"}</h3>
                <p className="text-slate-600">{selectedInterview.jobs?.title || "Unknown Job"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Date & Time</p>
                  <p className="font-medium">{format(new Date(selectedInterview.interview_date), "MMMM dd, yyyy 'at' hh:mm a")}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Interview Type</p>
                  <p className="font-medium">{selectedInterview.interview_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={`${getStatusColor(selectedInterview.status)} border mt-1`}>
                    {selectedInterview.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Interviewer</p>
                  <p className="font-medium">{selectedInterview.interviewer || "Not assigned"}</p>
                </div>
              </div>
              {selectedInterview.location && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Location</p>
                  <p className="font-medium">{selectedInterview.location}</p>
                </div>
              )}
              {selectedInterview.feedback && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Feedback</p>
                  <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-md">
                    {selectedInterview.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this interview? This action cannot be undone.
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