import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useInstitutions,
  useDeleteInstitution,
} from "@/hooks/useInstitutions";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InstitutionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

  const queryParams = {
    page,
    limit: 10,
    search: search || undefined,
  };

  const { data, isLoading } = useInstitutions(queryParams);
  const deleteMutation = useDeleteInstitution();

  const responseData = data?.data;
  const institutions = responseData?.data || [];
  const meta = responseData?.meta || { total: 0, totalPages: 1 };

  const handleDelete = async () => {
    if (!selectedInstId) return;
    try {
      await deleteMutation.mutateAsync(selectedInstId);
      setSelectedInstId(null);
    } catch (error) {
      // Handled by toast
    }
  };

  return (
    <MainLayout title="Institutions">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Institutions</h1>
            <p className="text-muted-foreground text-sm">
              Manage school/college branding, logos, and registration referral codes.
            </p>
          </div>
          <PermissionGate module="institutions" action="create">
            <Button className="gap-2" onClick={() => navigate("/institutions/create")}>
              <Plus className="h-4 w-4" />
              Add Institution
            </Button>
          </PermissionGate>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or referral code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Logo</th>
                    <th className="px-4 py-3 font-medium">Institution Name</th>
                    <th className="px-4 py-3 font-medium">Referral Code</th>
                    <th className="px-4 py-3 font-medium">Contact Details</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Created At</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : institutions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        <Building2 className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                        No institutions found.
                      </td>
                    </tr>
                  ) : (
                    institutions.map((inst: any) => (
                      <tr
                        key={inst.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {inst.logoUrl ? (
                            <div className="w-12 h-12 rounded border bg-white flex items-center justify-center overflow-hidden">
                              <img
                                src={getImageUrl(inst.logoUrl)}
                                className="max-w-full max-h-full object-contain"
                                alt=""
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-muted-foreground/40">
                              <Building2 className="h-6 w-6" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {inst.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="font-mono tracking-wider px-2 py-0.5 shadow-none">
                            {inst.referralCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 space-y-1">
                          {inst.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {inst.email}
                            </div>
                          )}
                          {(inst.phone1 || inst.phone2) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {inst.phone1 || inst.phone2}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {inst.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none items-center gap-1 shadow-none">
                              <div className="h-1 w-1 rounded-full bg-emerald-600" />{" "}
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground items-center gap-1 shadow-none"
                            >
                              <div className="h-1 w-1 rounded-full bg-muted-foreground" />{" "}
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(inst.createdAt), "dd MMM yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <PermissionGate module="institutions" action="update">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/institutions/edit/${inst.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                            <PermissionGate module="institutions" action="delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setSelectedInstId(inst.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-muted-foreground">
                  Showing page {page} of {meta.totalPages}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!selectedInstId} onOpenChange={(open) => !open && setSelectedInstId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Delete Institution
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this institution? This action will permanently remove it from the system. Mapped students will lose their branding connection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
