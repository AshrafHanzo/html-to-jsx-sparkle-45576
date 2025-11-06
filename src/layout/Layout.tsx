import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const username = localStorage.getItem("username") || "Admin User";

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex flex-1 flex-col">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-bold text-foreground">Welcome back, {username}! 👋</h2>
                <p className="text-xs text-muted-foreground">Track and manage your recruitment process</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  3
                </span>
              </Button>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
              <Button className="hidden sm:flex">
                Admin Panel
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto bg-background p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
