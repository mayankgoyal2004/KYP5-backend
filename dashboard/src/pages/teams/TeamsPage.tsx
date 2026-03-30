import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteTeam, useTeams } from "@/hooks/useTeams";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

export default function TeamsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    return params;
  }, [search, page, viewMode]);

  const { data, isLoading } = useTeams(queryParams);
  const deleteMutation = useDeleteTeam();

  const teams = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Team">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <UserRound className="h-6 w-6 text-primary" />
              Team
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage team members, roles, and display order
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border bg-muted/50 p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <PermissionGate module="teams" action="create">
              <Button className="gap-2" onClick={() => navigate("/team/new")}>
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or role..."
              className="pl-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-[300px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : teams.length === 0 ? (
          <Card className="p-12 text-center">
            <UserRound className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No team members found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((member: any) => (
              <Card
                key={member.id}
                className={`group overflow-hidden transition-all hover:shadow-md ${
                  !member.isActive ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <Badge variant="outline" className="text-[10px]">
                      #{member.order ?? 0}
                    </Badge>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate module="teams" action="update">
                            <DropdownMenuItem
                              onClick={() => navigate(`/team/${member.id}/edit`)}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate module="teams" action="delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(member);
                                setDeleteOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mb-4 flex justify-center">
                    <Avatar className="h-24 w-24 border">
                      <AvatarImage src={getImageUrl(member.avatar)} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {member.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="line-clamp-1 text-sm font-semibold">
                        {member.name}
                      </h3>
                      {member.isActive ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {member.role}
                    </Badge>
                    {member.bio ? (
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {member.bio}
                      </p>
                    ) : null}
                    {member.email ? (
                      <div className="inline-flex items-center gap-1 text-xs text-primary">
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </div>
                    ) : null}
                    <p className="pt-2 text-[10px] text-muted-foreground">
                      Added {format(new Date(member.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Member
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teams.map((member: any) => (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage src={getImageUrl(member.avatar)} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{member.name}</p>
                            {member.bio ? (
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                {member.bio}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {member.email || (
                          <span className="text-xs text-muted-foreground">
                            Not set
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {member.order ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(member.createdAt), "dd MMM yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="teams" action="update">
                              <DropdownMenuItem
                                onClick={() => navigate(`/team/${member.id}/edit`)}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="teams" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(member);
                                  setDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total members
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selected?.name}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
