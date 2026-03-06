import { ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BookOpen, CalendarCheck, BarChart3, Award,
  LogOut, Menu, X, GraduationCap, QrCode, MessageSquare, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const getNavItems = (role: string | null): NavItem[] => {
  const common = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  if (role === "admin") {
    return [
      ...common,
      { label: "Workshops", href: "/workshops", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> },
      { label: "Attendance", href: "/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
      { label: "Analytics", href: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Certificates", href: "/certificates", icon: <Award className="h-4 w-4" /> },
    ];
  }
  if (role === "trainer") {
    return [
      ...common,
      { label: "My Workshops", href: "/workshops", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Attendance", href: "/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
      { label: "QR Code", href: "/qr-attendance", icon: <QrCode className="h-4 w-4" /> },
      { label: "Analytics", href: "/analytics", icon: <BarChart3 className="h-4 w-4" /> },
    ];
  }
  return [
    ...common,
    { label: "Workshops", href: "/workshops", icon: <BookOpen className="h-4 w-4" /> },
    { label: "My Attendance", href: "/attendance", icon: <CalendarCheck className="h-4 w-4" /> },
    { label: "Certificates", href: "/certificates", icon: <Award className="h-4 w-4" /> },
    { label: "Feedback", href: "/feedback", icon: <MessageSquare className="h-4 w-4" /> },
  ];
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(role);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-heading text-sm font-bold text-sidebar-accent-foreground">Workshop Hub</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-sidebar-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {profile?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{profile?.name}</p>
              <p className="truncate text-xs text-sidebar-foreground capitalize">{role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {navItems.find((item) => item.href === location.pathname)?.label || "Dashboard"}
          </h2>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
