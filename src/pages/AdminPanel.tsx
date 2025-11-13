"use client";

import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Admin tools coming soon.
        </CardContent>
      </Card>
    </div>
  );
}
