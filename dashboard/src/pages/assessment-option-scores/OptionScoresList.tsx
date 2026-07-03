import { useMemo, useState } from "react";
import { useAssessmentOptionScores, useDeleteAssessmentOptionScore } from "@/hooks/useAssessmentOptionScores";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OptionScoresList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const navigate = useNavigate();

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 10 };
    if (search) params.search = search;
    return params;
  }, [search, page]);

  const { data, isLoading } = useAssessmentOptionScores(queryParams);
  const deleteMutation = useDeleteAssessmentOptionScore();

  const scores = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Option Scores">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListOrdered className="h-6 w-6 text-primary" />
              Option Scores
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage scores mapped between options and groups
            </p>
          </div>
          <PermissionGate module="assessment_option_scores" action="create">
            <Button onClick={() => navigate("/assessment-option-scores/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Option Score
            </Button>
          </PermissionGate>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search option scores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Option</th>
                    <th className="px-4 py-3 font-medium">Group</th>
                    <th className="px-4 py-3 font-medium">Sub-Group</th>
                    <th className="px-4 py-3 font-medium text-center">Score</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                      </tr>
                    ))
                  ) : scores.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No scores found.
                      </td>
                    </tr>
                  ) : (
                    scores.map((score: any) => (
                      <tr key={score.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={score.option?.text}>
                          {score.option?.text || "Unknown Option"}
                        </td>
                        <td className="px-4 py-3">{score.group?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{score.subGroup?.name || "-"}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{score.score}</td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <PermissionGate module="assessment_option_scores" action="update">
                                <DropdownMenuItem onClick={() => navigate(`/assessment-option-scores/${score.id}/edit`)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              </PermissionGate>
                              <PermissionGate module="assessment_option_scores" action="delete">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelected(score);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </PermissionGate>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(page * 10, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the option score mapping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
