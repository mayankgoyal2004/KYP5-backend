import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileText,
  HelpCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link2,
} from "lucide-react";
import {
  useCreateHelpCenter,
  useDeleteHelpCenter,
  useHelpCenters,
  useUpdateHelpCenter,
} from "@/hooks/useHelpCenter";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { getImageUrl } from "@/lib/utils";

const helpCenterSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  buttonText: z.string().optional().default("View Guide"),
  pdfPath: z.string().optional(),
  link: z.string().optional().or(z.literal("")),
  icon: z.string().optional().default("fa-regular fa-file-lines"),
  order: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

type HelpCenterForm = z.infer<typeof helpCenterSchema>;

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit: viewMode === "grid" ? 9 : 10 };
    if (search) params.search = search;
    return params;
  }, [page, search, viewMode]);

  const { data, isLoading } = useHelpCenters(queryParams);
  const createMutation = useCreateHelpCenter();
  const updateMutation = useUpdateHelpCenter();
  const deleteMutation = useDeleteHelpCenter();

  const guides = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<HelpCenterForm>({
    resolver: zodResolver(helpCenterSchema),
    defaultValues: {
      title: "",
      description: "",
      buttonText: "View Guide",
      pdfPath: "",
      link: "",
      icon: "fa-regular fa-file-lines",
      order: 0,
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      buttonText: "View Guide",
      pdfPath: "",
      link: "",
      icon: "fa-regular fa-file-lines",
      order: 0,
      isActive: true,
    });
    setSelected(null);
    setPdfFile(null);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
  };

  const buildFormData = (values: HelpCenterForm) => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("description", values.description);
    fd.append("buttonText", values.buttonText || "View Guide");
    fd.append("link", values.link || "");
    fd.append("icon", values.icon || "fa-regular fa-file-lines");
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (pdfFile) {
      fd.append("pdfFile", pdfFile);
    } else if (values.pdfPath) {
      fd.append("pdfPath", values.pdfPath);
    }
    return fd;
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      title: item.title,
      description: item.description,
      buttonText: item.buttonText || "View Guide",
      pdfPath: item.pdfPath || "",
      link: item.link || "",
      icon: item.icon || "fa-regular fa-file-lines",
      order: item.order ?? 0,
      isActive: item.isActive,
    });
    setPdfFile(null);
    setEditOpen(true);
  };

  const submitCreate = async (values: HelpCenterForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const submitEdit = async (values: HelpCenterForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({ id: selected.id, data: buildFormData(values) });
    setEditOpen(false);
    resetForm();
  };

  const submitDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const iconOptions = [
    { label: "Document (fa-regular fa-file-lines)", value: "fa-regular fa-file-lines" },
    { label: "User Plus (fa-solid fa-user-plus)", value: "fa-solid fa-user-plus" },
    { label: "Login (fa-solid fa-right-to-bracket)", value: "fa-solid fa-right-to-bracket" },
    { label: "Shield (fa-solid fa-shield-halved)", value: "fa-solid fa-shield-halved" },
    { label: "Gear (fa-solid fa-gear)", value: "fa-solid fa-gear" },
    { label: "Question (fa-solid fa-circle-question)", value: "fa-solid fa-circle-question" },
  ];

  const formFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input placeholder="e.g. Registration SOP" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Learn how to create your account..."
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input placeholder="View Guide" {...form.register("buttonText")} />
        </div>
        <div className="space-y-2">
          <Label>Icon Class</Label>
          <Input placeholder="fa-regular fa-file-lines" {...form.register("icon")} />
          <div className="flex flex-wrap gap-1 mt-1">
            {iconOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="text-[10px] bg-muted hover:bg-accent px-1.5 py-0.5 rounded"
                onClick={() => form.setValue("icon", opt.value)}
              >
                {opt.label.split(" (")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
        <div className="flex items-center gap-3 pt-8">
          <Switch
            checked={form.watch("isActive")}
            onCheckedChange={(checked) => form.setValue("isActive", checked)}
          />
          <Label className="cursor-pointer">Guide is active</Label>
        </div>
      </div>
      
      <div className="border-t pt-4 space-y-4">
        <div className="space-y-2">
          <Label>Guide PDF File (Downloads when clicked)</Label>
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 justify-center transition-colors hover:bg-muted/50">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">
                  {pdfFile ? pdfFile.name : (form.watch("pdfPath") ? "PDF uploaded (click to change)" : "Upload PDF Guide")}
                </span>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
            </label>
            {form.watch("pdfPath") && !pdfFile && (
              <a
                href={getImageUrl(form.watch("pdfPath"))}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline flex items-center gap-1 shrink-0"
              >
                <FileText className="h-3.5 w-3.5" /> View Current
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Or Custom Link URL (Optional fallback)</Label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 rounded-md border border-input bg-muted text-muted-foreground text-sm">
              <Link2 className="h-4 w-4" />
            </span>
            <Input placeholder="https://example.com/some-page" {...form.register("link")} />
          </div>
          {form.formState.errors.link && (
            <p className="text-xs text-destructive">{form.formState.errors.link.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help Center Guides</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage step-by-step SOP documents and reference links shown on the public site.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border bg-muted/50 p-1 shrink-0">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3"
              >
                List
              </Button>
            </div>
            <PermissionGate module="help_center" action="create">
              <Button onClick={openCreate} className="h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Guide
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help guides..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-24 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : guides.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg">No Help Guides Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              There are no help center guides created yet. Get started by adding a new one.
            </p>
            <PermissionGate module="help_center" action="create">
              <Button onClick={openCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Guide
              </Button>
            </PermissionGate>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((item: any) => (
              <Card key={item.id} className={`overflow-hidden border-2 ${item.isActive ? "border-muted" : "border-destructive/30 opacity-75"}`}>
                <CardContent className="p-6 relative flex flex-col justify-between h-full min-h-[180px]">
                  <div className="absolute right-4 top-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="help_center" action="update">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit Guide
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="help_center" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelected(item);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Guide
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Order: {item.order}</Badge>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-lg text-lg shrink-0 mt-1">
                        <i className={item.icon || "fa-regular fa-file-lines"} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg leading-snug line-clamp-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-[11px] font-mono text-muted-foreground/60">
                      {item.pdfPath ? "📄 PDF Guide" : (item.link ? "🔗 Custom URL" : "No file/link")}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={item.pdfPath ? getImageUrl(item.pdfPath) : (item.link || "#")} target="_blank" rel="noreferrer">
                        {item.buttonText || "View Guide"}
                      </a>
                    </Button>
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {guides.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.order}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 text-primary rounded flex items-center justify-center flex-shrink-0">
                            <i className={item.icon || "fa-regular fa-file-lines"} />
                          </div>
                          <span className="font-medium truncate max-w-[200px]">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-4 py-3">
                        {item.pdfPath ? (
                          <Badge variant="outline" className="text-[10px]">
                            PDF Guide
                          </Badge>
                        ) : item.link ? (
                          <Badge variant="outline" className="text-[10px]">
                            Link URL
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <PermissionGate module="help_center" action="update">
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="help_center" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelected(item);
                                  setDeleteOpen(true);
                                }}
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

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">
              Showing page {page} of {pagination.pages} ({pagination.total} total items)
            </span>
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
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitCreate)}>
            <DialogHeader>
              <DialogTitle>Add Help Center Guide</DialogTitle>
              <DialogDescription>
                Create a new guide. Upload a PDF guide file that users can download.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Guide
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={form.handleSubmit(submitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Help Center Guide</DialogTitle>
              <DialogDescription>
                Update the guide details. Upload a new PDF to replace the old one.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT DIALOG */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Help Guide?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be
              undone, and the associated PDF file will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={submitDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
