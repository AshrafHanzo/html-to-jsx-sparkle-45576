import { Outlet, Link } from "react-router-dom";
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

        {/* add min-w-0 so children can shrink + avoid global x-overflow */}
        <main className="flex flex-1 flex-col min-w-0">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold">
                  Welcome back, {username}! 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage your recruitment process
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications -> /notifications */}
              <Button
                asChild
                variant="outline"
                size="icon"
                className="relative"
              >
                <Link to="/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    3
                  </span>
                </Link>
              </Button>

              {/* User -> /profile */}
              <Button
                asChild
                variant="outline"
                size="icon"
                aria-label="Profile"
              >
                <Link to="/profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>

              {/* Admin Panel -> /admin */}
              <Button
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/admin">Admin Panel</Link>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          {/* lock X, allow Y; also min-w-0 to prevent child overflow pushing layout */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-6 min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
