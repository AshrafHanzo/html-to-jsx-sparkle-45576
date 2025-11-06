import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, TrendingUp, Calendar, UserCheck } from "lucide-react";

const stats = [
  { title: "Total Candidates", value: "1,284", change: "+12.5%", icon: Users, color: "text-blue-600" },
  { title: "Active Jobs", value: "47", change: "+5.2%", icon: Briefcase, color: "text-green-600" },
  { title: "Applications", value: "892", change: "+18.3%", icon: FileText, color: "text-purple-600" },
  { title: "Interviews Scheduled", value: "34", change: "+8.1%", icon: Calendar, color: "text-orange-600" },
  { title: "Selected Candidates", value: "156", change: "+24.7%", icon: UserCheck, color: "text-teal-600" },
  { title: "Joined This Month", value: "28", change: "+15.4%", icon: TrendingUp, color: "text-pink-600" },
];

const recentActivities = [
  { title: "New application received", candidate: "John Doe", job: "Senior Developer", time: "5 min ago" },
  { title: "Interview scheduled", candidate: "Jane Smith", job: "UI/UX Designer", time: "1 hour ago" },
  { title: "Candidate selected", candidate: "Mike Johnson", job: "Project Manager", time: "2 hours ago" },
  { title: "New job posted", candidate: "-", job: "Data Analyst", time: "3 hours ago" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your recruitment metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-green-600 font-medium mt-1">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.candidate !== "-" && `${activity.candidate} - `}
                    {activity.job}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
