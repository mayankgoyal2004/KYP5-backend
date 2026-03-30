import { useState, useMemo } from "react";
import { useContacts, useDeleteContact } from "@/hooks/use-contacts";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Mail,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Inbox,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: 10 };
    if (search) params.search = search;
    return params;
  }, [search, page]);

  const { data, isLoading } = useContacts(queryParams);
  const deleteMutation = useDeleteContact();

  const messages = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const openView = (item: any) => {
    setSelected(item);
    setViewOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Contact Messages">
      <div className="space-y-6">
        {/* ─── Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Contact Messages
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage inquiries from the contact form
            </p>
          </div>
        </div>

        {/* ─── Search ──────────────────────────────── */}
        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or subject..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* ─── Table ───────────────────────────────── */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Sender
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : messages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      No messages found.
                    </td>
                  </tr>
                ) : (
                  messages.map((m: any) => (
                    <tr
                      key={m.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !m.isRead ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {m.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {m.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[300px] truncate">
                        {m.subject}
                      </td>
                      <td className="px-4 py-3">
                        {m.isRead ? (
                          <Badge variant="outline" className="text-[10px] gap-1 bg-muted/50">
                            <CheckCircle2 className="h-3 w-3" />
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[10px] gap-1 bg-primary pulse-subtle">
                            <Clock className="h-3 w-3" />
                            New
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.createdAt), "dd MMM yyyy, HH:mm")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openView(m)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Message
                            </DropdownMenuItem>
                            <PermissionGate module="contacts" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(m);
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* ═══ VIEW DIALOG ═════════════════════════════ */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Message Details
              </DialogTitle>
              <DialogDescription>
                Message received on {selected && format(new Date(selected.createdAt), "PPPP p")}
              </DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> From
                    </span>
                    <p className="text-sm font-semibold">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">{selected.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </span>
                    <p className="text-sm">
                      {format(new Date(selected.createdAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Subject</span>
                  <p className="text-sm font-bold bg-muted/30 p-2 rounded border border-muted">
                    {selected.subject}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Message</span>
                  <div className="text-sm bg-muted/10 p-4 rounded border border-muted min-h-[150px] whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setViewOpen(false)}>
                    Close
                  </Button>
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}>
                    <Button className="gap-2">
                      <Mail className="h-4 w-4" />
                      Reply via Email
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE DIALOG ═══════════════════════════ */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Message</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this message from "{selected?.name}"? This action cannot be undone.
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
