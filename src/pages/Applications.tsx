import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationDialog } from "@/components/ApplicationDialog";
import { InterviewDialog } from "@/components/InterviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const RECRUITERS = ["Muni Divya", "Surya K", "Thameem Ansari", "Nandhini Kumaravel", "Dhivya V", "Gokulakrishna V", "Snehal Prakash", "Selvaraj Veilumuthu"];
const SOURCES = ["Linked-in", "Job hai", "Apna", "Meta", "EarlyJobs", "Others"];
const STATUS = ["Applied", "Interview Scheduled", "Qualified", "Rejected", "Offer", "Joined"];

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        candidates:candidate_id(name, email, phone, position),
        jobs:job_id(title, department, location)
      `)
      .order("applied_date", { ascending: false });
    
    if (error) {
      toast.error("Failed to fetch applications");
      return;
    }
    setApplications(data || []);
  };

  const handleFieldUpdate = async (appId: string, field: string, value: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ [field]: value })
      .eq("id", appId);
    
    if (error) {
      toast.error("Failed to update");
      return;
    }
    
    fetchApplications();
  };

  const handleScheduleInterview = (app: any) => {
    setSelectedApplication(app);
    setInterviewDialogOpen(true);
  };

  const handleEditComment = (appId: string, currentComment: string) => {
    setEditingComment(appId);
    setCommentText(currentComment || "");
  };

  const handleSaveComment = async (appId: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ notes: commentText })
      .eq("id", appId);
    
    if (error) {
      toast.error("Failed to update comment");
      return;
    }
    
    setEditingComment(null);
    fetchApplications();
  };

  const filteredApplications = applications.filter(app => {
    const candidateName = app.candidates?.name || "";
    const jobTitle = app.jobs?.title || "";
    const company = app.company || "";
    const searchLower = searchTerm.toLowerCase();
    return candidateName.toLowerCase().includes(searchLower) ||
           jobTitle.toLowerCase().includes(searchLower) ||
           company.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-bold text-[#0f172a] mb-4">Applications</h1>
      
      <div className="flex gap-3 mb-4">
        <Input 
          placeholder="Search Candidate / Job / Company…" 
          className="min-w-[280px] border-[rgba(2,6,23,.10)] rounded-[10px] bg-white" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button 
          className="bg-[#1b6276] hover:bg-[#154f61] text-white font-bold rounded-[10px] border-0"
          onClick={() => {
            setSelectedApplication(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>
      </div>

      <Card className="bg-gradient-to-b from-white to-[#fbfdff] border-[rgba(2,6,23,.10)] rounded-[16px] shadow-[0_8px_26px_rgba(2,6,23,.07)]">
        <div className="text-xs text-[#94a3b8] p-3 text-right bg-[#f8fafc] border-b border-[rgba(2,6,23,.10)]">
          ⇆ Slide horizontally for more columns
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1700px] w-full border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '18%'}}>
                  Candidate Name
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '22%'}}>
                  Job
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '12%'}}>
                  Status
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '13%'}}>
                  Sourced By
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '13%'}}>
                  Sourced From
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '13%'}}>
                  Assigned To
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '10%'}}>
                  Applied On
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '10%'}}>
                  Interview
                </th>
                <th className="sticky top-0 z-10 bg-white p-[14px_18px] text-[13px] text-[#64748b] text-left border-b border-[rgba(2,6,23,.10)] whitespace-nowrap" style={{width: '24%'}}>
                  Comments
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-5 text-[#64748b]">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#f9fbfd] border-b border-[rgba(2,6,23,.06)]">
                    <td className="p-4 align-top">
                      <strong className="font-extrabold">{app.candidates?.name || "Unknown"}</strong>
                    </td>
                    <td className="p-4 align-top">
                      {app.jobs?.title || "Unknown Job"} {app.company ? `(${app.company})` : ""}
                    </td>
                    <td className="p-4 align-top">
                      <span className="inline-block px-[10px] py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#3730a3] border border-[#e0e7ff]">
                        {app.status}
                      </span>
                      <Select 
                        value={app.status} 
                        onValueChange={(value) => handleFieldUpdate(app.id, "status", value)}
                      >
                        <SelectTrigger className="mt-2 w-[180px] p-2 border border-[rgba(2,6,23,.10)] rounded-[10px] bg-white text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 align-top">
                      <Select 
                        value={app.sourced_by || RECRUITERS[0]} 
                        onValueChange={(value) => handleFieldUpdate(app.id, "sourced_by", value)}
                      >
                        <SelectTrigger className="w-[180px] p-2 border border-[rgba(2,6,23,.10)] rounded-[10px] bg-white text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECRUITERS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 align-top">
                      <Select 
                        value={app.sourced_from || "Linked-in"} 
                        onValueChange={(value) => handleFieldUpdate(app.id, "sourced_from", value)}
                      >
                        <SelectTrigger className="w-[180px] p-2 border border-[rgba(2,6,23,.10)] rounded-[10px] bg-white text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 align-top">
                      <Select 
                        value={app.assigned_to || RECRUITERS[0]} 
                        onValueChange={(value) => handleFieldUpdate(app.id, "assigned_to", value)}
                      >
                        <SelectTrigger className="w-[180px] p-2 border border-[rgba(2,6,23,.10)] rounded-[10px] bg-white text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECRUITERS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 align-top">
                      {format(new Date(app.applied_date), "MMM dd, yyyy")}
                    </td>
                    <td className="p-4 align-top">
                      <button 
                        className="px-3 py-2 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] cursor-pointer font-bold text-sm hover:brightness-95"
                        onClick={() => handleScheduleInterview(app)}
                      >
                        Schedule
                      </button>
                    </td>
                    <td className="p-4 align-top">
                      {editingComment === app.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[80px] max-h-[120px] p-3 border border-[rgba(2,6,23,.10)] rounded-[12px] bg-white text-[13px] text-[#334155]"
                            placeholder="Add comments..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveComment(app.id)}
                              className="bg-[#1b6276] hover:bg-[#154f61] text-white font-bold"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingComment(null)}
                              className="border-[#cbd5e1] bg-[#f8fafc]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="max-w-[400px] min-w-[260px] min-h-[56px] max-h-[120px] p-3 border border-[rgba(2,6,23,.10)] rounded-[12px] bg-white leading-6 text-[13px] text-[#334155] overflow-auto shadow-[0_4px_14px_rgba(2,6,23,.06)]">
                            {app.notes ? (
                              <span className="whitespace-pre-wrap">{app.notes}</span>
                            ) : (
                              <span className="text-[#94a3b8] italic">No comments</span>
                            )}
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={() => handleEditComment(app.id, app.notes)}
                              className="px-3 py-2 rounded-[10px] border border-[#cbd5e1] bg-[#f8fafc] cursor-pointer font-bold text-sm hover:brightness-95"
                            >
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ApplicationDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        application={selectedApplication}
        onSuccess={fetchApplications}
      />

      <InterviewDialog
        open={interviewDialogOpen}
        onOpenChange={setInterviewDialogOpen}
        interview={null}
        preSelectedCandidate={selectedApplication?.candidate_id}
        preSelectedJob={selectedApplication?.job_id}
        onSuccess={() => {
          toast.success("Interview scheduled successfully!");
          setInterviewDialogOpen(false);
        }}
      />
    </div>
  );
}
