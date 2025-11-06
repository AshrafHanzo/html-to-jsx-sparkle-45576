import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const reportMetrics = [
  { title: "Time to Hire (Avg)", value: "28 days", change: "-3 days vs last month", icon: Clock, color: "text-blue-600" },
  { title: "Application Rate", value: "89%", change: "+5% vs last month", icon: TrendingUp, color: "text-green-600" },
  { title: "Interview Success Rate", value: "65%", change: "+8% vs last month", icon: Users, color: "text-purple-600" },
  { title: "Offer Acceptance Rate", value: "78%", change: "+2% vs last month", icon: BarChart3, color: "text-orange-600" },
];

const departmentReports = [
  { department: "Engineering", openPositions: 12, applications: 234, interviews: 45, hires: 8 },
  { department: "Design", openPositions: 5, applications: 89, interviews: 18, hires: 3 },
  { department: "Product", openPositions: 3, applications: 67, interviews: 12, hires: 2 },
  { department: "Marketing", openPositions: 4, applications: 98, interviews: 21, hires: 4 },
  { department: "Sales", openPositions: 8, applications: 156, interviews: 34, hires: 6 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track recruitment performance metrics</p>
        </div>
        <Button>Export Report</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportMetrics.map((metric, index) => (
          <Card key={index} className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Department</th>
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Open Positions</th>
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Applications</th>
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Interviews</th>
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Hires</th>
                  <th className="pb-3 text-left text-sm font-semibold text-foreground">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {departmentReports.map((dept, index) => {
                  const successRate = Math.round((dept.hires / dept.applications) * 100);
                  return (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="py-3 text-sm font-medium text-foreground">{dept.department}</td>
                      <td className="py-3 text-sm text-muted-foreground">{dept.openPositions}</td>
                      <td className="py-3 text-sm text-muted-foreground">{dept.applications}</td>
                      <td className="py-3 text-sm text-muted-foreground">{dept.interviews}</td>
                      <td className="py-3 text-sm text-muted-foreground">{dept.hires}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          {successRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
