import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Archive,
  BellRing,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Inbox,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteNewsletterSubscriber,
  useNewsletterSubscribers,
  useUpdateNewsletterSubscriber,
} from "@/hooks/use-newsletter";

const STATUS_OPTIONS = ["ALL", "SUBSCRIBED", "CONTACTED", "UNSUBSCRIBED", "ARCHIVED"] as const;

function statusBadgeVariant(status: string) {
  if (status === "SUBSCRIBED") return "default";
  if (status === "CONTACTED") return "secondary";
  return "outline";
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function NewsletterPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("ALL");
  const [page, setPage] = useState(1);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    source: "",
    status: "SUBSCRIBED",
    notes: "",
  });

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: 10,
      sortBy: "subscribedAt",
      sortOrder: "desc",
    };
    if (search) params.search = search;
    if (status !== "ALL") params.status = status;
    return params;
  }, [page, search, status]);

  const { data, isLoading } = useNewsletterSubscribers(queryParams);
  const updateMutation = useUpdateNewsletterSubscriber();
  const deleteMutation = useDeleteNewsletterSubscriber();

  const payload = data?.data;
  const subscribers = payload?.data?.data || [];
  const pagination = payload?.data?.meta;
  const summary = payload?.data?.summary;

  const openView = (item: any) => {
    setSelected(item);
    setForm({
      name: item.name || "",
      source: item.source || "",
      status: item.status || "SUBSCRIBED",
      notes: item.notes || "",
    });
    setViewOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    await updateMutation.mutateAsync({
      id: selected.id,
      data: {
        ...form,
        lastContactedAt: form.status === "CONTACTED" ? new Date().toISOString() : null,
      },
    });

    setViewOpen(false);
    setSelected(null);
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout title="Newsletter Subscribers">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage people who joined from the public newsletter form and track follow-up status.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total", value: summary?.total ?? 0, icon: Inbox },
            { label: "Subscribed", value: summary?.subscribed ?? 0, icon: Mail },
            { label: "Contacted", value: summary?.contacted ?? 0, icon: Clock },
            { label: "Archived", value: summary?.archived ?? 0, icon: Archive },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, source, or notes..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as (typeof STATUS_OPTIONS)[number]);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "ALL" ? "All statuses" : statusLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Subscriber
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Subscribed
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      No newsletter subscribers found.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((subscriber: any) => (
                    <tr key={subscriber.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {subscriber.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {subscriber.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {subscriber.source || "website"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(subscriber.status)}>
                          {statusLabel(subscriber.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(subscriber.subscribedAt), "dd MMM yyyy, HH:mm")}
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
                            <DropdownMenuItem onClick={() => openView(subscriber)}>
                              <Edit3 className="mr-2 h-3.5 w-3.5" />
                              Manage Subscriber
                            </DropdownMenuItem>
                            <PermissionGate module="newsletter" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(subscriber);
                                  setDeleteOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
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
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Manage Subscriber
              </DialogTitle>
              <DialogDescription>
                Update internal notes, source, and engagement status for this subscriber.
              </DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-5 py-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Name
                    </span>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Optional subscriber name"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </span>
                    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                      {selected.email}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Source</span>
                    <Input
                      value={form.source}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, source: e.target.value }))
                      }
                      placeholder="website footer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                    <Select
                      value={form.status}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((item) => item !== "ALL").map((option) => (
                          <SelectItem key={option} value={option}>
                            {statusLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border bg-muted/10 p-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Subscribed On
                    </p>
                    <p className="mt-1 text-sm">
                      {format(new Date(selected.subscribedAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/10 p-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Contacted
                    </p>
                    <p className="mt-1 text-sm">
                      {selected.lastContactedAt
                        ? format(new Date(selected.lastContactedAt), "dd MMM yyyy, HH:mm")
                        : "Not contacted yet"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Internal Notes</span>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Example: Interested in product launch updates, invite to webinar, segment by campaign."
                    className="min-h-[140px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewOpen(false)}>
                    Close
                  </Button>
                  <PermissionGate module="newsletter" action="update">
                    <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selected?.email}? This permanently removes the subscriber record from the dashboard.
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
