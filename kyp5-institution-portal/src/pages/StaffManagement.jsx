import React, { useState } from "react";
import { Users, UserPlus, Shield, Mail, CheckCircle2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

export default function StaffManagement() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("COUNSELOR");
  const [invited, setInvited] = useState(false);

  const [staffMembers, setStaffMembers] = useState([
    {
      id: "1",
      name: "Dr. Rajesh Kumar",
      email: "rajesh@stmarys.edu",
      role: "INSTITUTION_OWNER",
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "Priya Sundaram",
      email: "priya@stmarys.edu",
      role: "COUNSELOR",
      status: "ACTIVE",
    },
    {
      id: "3",
      name: "Vikram Malhotra",
      email: "vikram@stmarys.edu",
      role: "TEACHER",
      status: "INVITED",
    },
  ]);

  const handleInvite = (e) => {
    e.preventDefault();
    setInvited(true);
    setTimeout(() => {
      setStaffMembers((prev) => [
        ...prev,
        {
          id: `s_${Date.now()}`,
          name,
          email,
          role,
          status: "INVITED",
        },
      ]);
      setShowInviteModal(false);
      setInvited(false);
      setName("");
      setEmail("");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Staff & Counselor Management
            </h1>
            <Badge variant="outline" className="text-xs font-bold">
              {staffMembers.length} Members
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Manage school administrative coordinators, teachers, and career counselors.
          </p>
        </div>

        <Button
          onClick={() => setShowInviteModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Staff Member</span>
        </Button>
      </div>

      {/* ─── Staff List Card ─── */}
      <Card className="rounded-2xl border-border shadow-xs overflow-hidden">
        <div className="divide-y divide-border/60">
          {staffMembers.map((m) => (
            <div
              key={m.id}
              className="p-5 flex items-center justify-between hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {m.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="font-semibold text-xs">
                  {m.role.replace("_", " ")}
                </Badge>
                <Badge
                  variant={m.status === "ACTIVE" ? "success" : "warning"}
                  className="text-[10px]"
                >
                  {m.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── INVITE STAFF MODAL ─── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Invite Staff Member</span>
            </DialogTitle>
            <DialogDescription>
              Add a teacher or counselor to access your school workspace.
            </DialogDescription>
          </DialogHeader>

          {invited && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Invitation dispatched to {email}!</span>
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4 text-xs font-medium">
            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Full Name</label>
              <Input
                required
                placeholder="e.g. Dr. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Email Address</label>
              <Input
                type="email"
                required
                placeholder="e.g. rajesh@stmarys.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-11 px-3 bg-card border border-input rounded-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="COUNSELOR">Counselor (Stream & Guidance)</option>
                <option value="TEACHER">Teacher (Batch Manager)</option>
                <option value="INSTITUTION_ADMIN">Institution Administrator</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="font-bold">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
