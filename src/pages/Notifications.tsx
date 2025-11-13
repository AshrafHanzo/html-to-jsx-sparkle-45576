"use client";

import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No notifications yet.
        </CardContent>
      </Card>
    </div>
  );
}
