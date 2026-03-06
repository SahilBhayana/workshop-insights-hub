import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, BookOpen, BarChart3, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Workshop Hub</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Login</Link></Button>
            <Button asChild><Link to="/auth">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Workshop Attendance <br />
              <span className="text-gradient">&amp; Analytics System</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Streamline workshop management, track attendance with QR codes, and gain actionable insights with powerful analytics dashboards.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              { icon: <BookOpen className="h-6 w-6" />, title: "Workshop Management", desc: "Create and manage workshops with sessions, categories, and enrollment tracking." },
              { icon: <BarChart3 className="h-6 w-6" />, title: "Rich Analytics", desc: "Visual dashboards with attendance trends, participation rates, and engagement metrics." },
              { icon: <Users className="h-6 w-6" />, title: "Role-Based Access", desc: "Separate dashboards for admins, trainers, and students with tailored features." },
            ].map((f, i) => (
              <div key={i} className="stat-card text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
