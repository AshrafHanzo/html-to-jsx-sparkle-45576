import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { JobDialog } from "@/components/JobDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("posted_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch jobs");
      return;
    }
    setJobs(data || []);
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);
    
    if (error) {
      toast.error("Failed to update status");
      return;
    }
    
    toast.success("Status updated successfully!");
    fetchJobs();
  };


  const handleDelete = async () => {
    if (!jobToDelete) return;
    
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobToDelete.id);
    
    if (error) {
      toast.error("Failed to delete job");
      return;
    }
    
    toast.success("Job deleted successfully!");
    setDeleteDialogOpen(false);
    setJobToDelete(null);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Manage all job postings</p>
        </div>
        <Button 
          className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
          onClick={() => {
            setSelectedJob(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* Search Bar - Outside the Card */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">Search</Button>
        <Button variant="outline" onClick={() => setSearchTerm("")}>Clear</Button>
      </div>

      {/* Table Card - Only table scrolls */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[200px]">Job Title</TableHead>
                  <TableHead className="min-w-[150px]">Company</TableHead>
                  <TableHead className="min-w-[100px]">Openings</TableHead>
                  <TableHead className="min-w-[120px]">Type</TableHead>
                  <TableHead className="min-w-[120px]">Work Mode</TableHead>
                  <TableHead className="min-w-[180px]">Salary</TableHead>
                  <TableHead className="min-w-[140px]">Status</TableHead>
                  <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                      No jobs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company || "-"}</TableCell>
                      <TableCell>{job.openings || 1}</TableCell>
                      <TableCell>{job.type || "Full-time"}</TableCell>
                      <TableCell>{job.work_mode || "On-site"}</TableCell>
                      <TableCell>
                        {job.salary_min && job.salary_max 
                          ? `₹ ${job.salary_min} – ${job.salary_max}`
                          : job.salary_range || "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Select
                          value={job.status || "Action"}
                          onValueChange={(value) => handleStatusChange(job.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8 bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border z-50">
                            <SelectItem value="Action">Action</SelectItem>
                            <SelectItem value="Hold">Hold</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedJob(job);
                              setViewDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700"
                            onClick={() => {
                              setSelectedJob(job);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setJobToDelete(job);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <JobDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={selectedJob}
        onSuccess={fetchJobs}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedJob.title}</h3>
                {selectedJob.company && (
                  <p className="text-muted-foreground mt-1">{selectedJob.company}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedJob.status === "Action" ? "default" : selectedJob.status === "Hold" ? "secondary" : "outline"}>
                    {selectedJob.status || "Action"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Openings</p>
                  <p className="font-medium">{selectedJob.openings || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedJob.type || "Full-time"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Mode</p>
                  <p className="font-medium">{selectedJob.work_mode || "On-site"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Urgency</p>
                  <p className="font-medium">{selectedJob.urgency || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-medium">
                    {selectedJob.salary_min && selectedJob.salary_max
                      ? `₹ ${selectedJob.salary_min} – ${selectedJob.salary_max}`
                      : selectedJob.salary_range || "Not specified"}
                  </p>
                </div>
                {selectedJob.commission && (
                  <div>
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-medium">₹ {selectedJob.commission}</p>
                  </div>
                )}
                {selectedJob.tenure && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="font-medium">{selectedJob.tenure}</p>
                  </div>
                )}
                {selectedJob.shift && (
                  <div>
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <p className="font-medium">{selectedJob.shift}</p>
                  </div>
                )}
                {selectedJob.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedJob.category}</p>
                  </div>
                )}
                {selectedJob.experience && (
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{selectedJob.experience}</p>
                  </div>
                )}
                {selectedJob.age_range && (
                  <div>
                    <p className="text-sm text-muted-foreground">Age Range</p>
                    <p className="font-medium">{selectedJob.age_range}</p>
                  </div>
                )}
              </div>

              {selectedJob.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  <p className="font-medium">{selectedJob.address}</p>
                </div>
              )}

              {selectedJob.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Job Description</p>
                  <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.required_skills && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Required Skills</p>
                  <p className="whitespace-pre-wrap">{selectedJob.required_skills}</p>
                </div>
              )}

              {selectedJob.preferred_skills && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Preferred Skills</p>
                  <p className="whitespace-pre-wrap">{selectedJob.preferred_skills}</p>
                </div>
              )}

              {selectedJob.nice_to_have && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Nice to Have</p>
                  <p className="whitespace-pre-wrap">{selectedJob.nice_to_have}</p>
                </div>
              )}

              {selectedJob.languages_required && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Languages Required</p>
                  <p className="whitespace-pre-wrap">{selectedJob.languages_required}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be undone and will also delete all associated applications and interviews.
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
