"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  const username = localStorage.getItem("username") || "Ashraf";
  const email = localStorage.getItem("email") || "you@example.com";
  const role = localStorage.getItem("role") || "Recruiter";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">{username}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{email}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Role</div>
            <div className="font-medium">{role}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Location</div>
            <div className="font-medium">Trichy, IN</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
