import { useState } from "react";
import { useRecycleBin, useRestoreRecycleItem, useDeleteRecycleItem } from "@/hooks/useRecycleBin";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Trash2,
  RotateCcw,
  Search,
  MoreHorizontal,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecycleBinPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useRecycleBin({ page, limit, search });
  const restoreMutation = useRestoreRecycleItem();
  const deleteMutation = useDeleteRecycleItem();

  const entries = data?.data || [];
  const meta = data?.meta;

  const handleRestore = async (id: string) => {
    await restoreMutation.mutateAsync(id);
  };

  const handleDeletePermanent = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout title="Recycle Bin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-primary" />
              Recycle Bin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Restore accidentally deleted items or permanently remove them
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deleted items..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record Name / Label</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Deleted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                        The recycle bin is empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry: any) => (
                      <TableRow key={entry.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{entry.recordLabel}</span>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {entry.recordId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize bg-muted/50 border-none px-2 py-0.5 text-[10px] font-bold">
                            {entry.module.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.deletedAt ? format(new Date(entry.deletedAt), "PPP p") : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleRestore(entry.id)}
                                disabled={restoreMutation.isPending}
                                className="gap-2"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restore Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(entry.id)}
                                className="text-destructive gap-2"
                              >
                                <Trash className="h-3.5 w-3.5" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {entries.length} of {meta.total} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium">Page {page} of {meta.totalPages}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3 items-start">
           <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
           <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Important Note</h4>
              <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                 Items in the recycle bin are "soft-deleted" and can be recovered anytime. 
                 Permanently deleting an item will remove it from the database forever and cannot be undone.
              </p>
           </div>
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" /> Confirm Permanent Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you absolutely sure? This action will permanently remove this record from the system. 
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePermanent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
