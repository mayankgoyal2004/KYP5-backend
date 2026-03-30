import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <MainLayout title="My Profile">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <Card className="border border-border/50 shadow-sm overflow-hidden bg-card">
          <div className="h-32 bg-gradient-to-r from-primary/80 to-primary/40" />
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={user?.avatarUrl || ""} alt={user?.name} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {user?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-muted-foreground font-medium">Platform Administrator</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="uppercase tracking-widest text-[10px]">
                    {user?.role?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center gap-4 text-sm bg-muted/30 p-4 rounded-xl">
                <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Email Address</p>
                  <p className="font-medium text-foreground">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm bg-muted/30 p-4 rounded-xl">
                <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Phone Number</p>
                  <p className="font-medium text-foreground">{user?.phone || "Not Set"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm bg-muted/30 p-4 rounded-xl">
                <div className="bg-primary/10 p-2.5 rounded-full text-primary shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Account Role</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">{user?.role?.replace("_", " ").toLowerCase() || "User"}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </MainLayout>
  );
}
