import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const UsersPage = () => {
  const { role: currentRole } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) return;
    const { data: roles } = await supabase.from("user_roles").select("*");
    const roleMap: Record<string, string> = {};
    roles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setUsers(profiles.map((p: any) => ({ ...p, role: roleMap[p.id] || "student" })));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: "admin" | "trainer" | "student") => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) { toast.error(delErr.message); return; }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (insErr) { toast.error(insErr.message); return; }
    toast.success(`Role updated to ${newRole}`);
    fetchUsers();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">Manage platform users and roles</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {currentRole === "admin" && <TableHead>Assign Role</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : u.role === "trainer" ? "secondary" : "outline"} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  {currentRole === "admin" && (
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v as any)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={currentRole === "admin" ? 5 : 4} className="text-center text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
