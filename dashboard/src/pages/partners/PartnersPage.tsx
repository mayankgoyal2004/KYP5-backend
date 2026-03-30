import { useMemo, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreatePartner,
  useDeletePartner,
  usePartners,
  useUpdatePartner,
} from "@/hooks/usePartners";
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
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

const partnerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  website: z.string().optional(),
  order: z.coerce.number().int().nonnegative().default(0),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PartnerForm = z.infer<typeof partnerSchema>;

export default function PartnersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit: viewMode === "grid" ? 12 : 10,
    };
    if (search) params.search = search;
    return params;
  }, [search, page, viewMode]);

  const { data, isLoading } = usePartners(queryParams);
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();
  const deleteMutation = useDeletePartner();

  const partners = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<PartnerForm>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      website: "",
      order: 0,
      logo: "",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      website: "",
      order: 0,
      logo: "",
      isActive: true,
    });
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const buildFormData = (values: PartnerForm) => {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("website", values.website || "");
    fd.append("order", String(values.order));
    fd.append("isActive", String(values.isActive));
    if (logoFile) {
      fd.append("logoFile", logoFile);
    } else if (values.logo) {
      fd.append("logo", values.logo);
    }
    return fd;
  };

  const handleCreate = async (values: PartnerForm) => {
    await createMutation.mutateAsync(buildFormData(values));
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (item: any) => {
    setSelected(item);
    form.reset({
      name: item.name,
      website: item.website || "",
      order: item.order ?? 0,
      logo: item.logo || "",
      isActive: item.isActive,
    });
    setLogoFile(null);
    setLogoPreview(getImageUrl(item.logo) || "");
    setEditOpen(true);
  };

  const handleEdit = async (values: PartnerForm) => {
    if (!selected) return;
    await updateMutation.mutateAsync({
      id: selected.id,
      data: buildFormData(values),
    });
    setEditOpen(false);
    setSelected(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deleteMutation.mutateAsync(selected.id);
    setDeleteOpen(false);
    setSelected(null);
  };

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Partner Name <span className="text-destructive">*</span>
        </Label>
        <Input placeholder="e.g. Open Learning" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Website</Label>
          <Input
            placeholder="https://example.com"
            {...form.register("website")}
          />
        </div>
        <div className="space-y-2">
          <Label>Display Order</Label>
          <Input type="number" min="0" {...form.register("order")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Logo <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <div className="h-24 w-24 overflow-hidden rounded-lg border bg-white shrink-0">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted shrink-0">
              <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex-1">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 transition-colors hover:bg-muted/50">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {logoFile ? logoFile.name : "Upload logo"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked)}
        />
        <Label className="cursor-pointer">Partner is active</Label>
      </div>
    </div>
  );

  return (
    <MainLayout title="Partners">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Building2 className="h-6 w-6 text-primary" />
              Partners
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage partner logos, links, and display order
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
            <PermissionGate module="partners" action="create">
              <Button
                className="gap-2"
                onClick={() => {
                  resetForm();
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Partner
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners..."
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
                <Skeleton key={index} className="h-[230px]" />
              ))}
            </div>
          ) : (
            <Card>
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </Card>
          )
        ) : partners.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No partners found.</p>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner: any) => (
              <Card
                key={partner.id}
                className={`group overflow-hidden transition-all flex flex-col hover:shadow-md ${
                  !partner.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="relative h-44 overflow-hidden bg-muted">
                  <div className="flex h-full w-full items-center justify-center bg-white p-6">
                    {partner.logo ? (
                      <img
                        src={getImageUrl(partner.logo)}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="absolute left-2 top-2 flex gap-2">
                    {partner.isActive ? (
                      <Badge className="bg-green-500/90 text-white text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGate module="partners" action="update">
                          <DropdownMenuItem onClick={() => openEdit(partner)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        </PermissionGate>
                        <PermissionGate module="partners" action="delete">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(partner);
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

                <CardContent className="p-4 flex-1 flex flex-col">
                  <Badge variant="outline" className="text-[10px] w-fit mb-2">
                    Order #{partner.order ?? 0}
                  </Badge>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                    {partner.name}
                  </h3>
                  {partner.website ? (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Visit website
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3">
                      No website added
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t text-[10px] text-muted-foreground">
                    {partner.website ? (
                      <span className="truncate max-w-[120px]">
                        {partner.website.replace(/^https?:\/\//, "")}
                      </span>
                    ) : (
                      <span>Partner</span>
                    )}
                    <span>{format(new Date(partner.createdAt), "dd MMM yyyy")}</span>
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
                      Partner
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Website
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
                  {partners.map((partner: any) => (
                    <tr
                      key={partner.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded border bg-white shrink-0 p-2">
                            {partner.logo ? (
                              <img
                                src={getImageUrl(partner.logo)}
                                alt={partner.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <Building2 className="h-4 w-4 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{partner.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            Website
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not set
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {partner.order ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {partner.isActive ? (
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
                          {format(new Date(partner.createdAt), "dd MMM yyyy")}
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
                            <PermissionGate module="partners" action="update">
                              <DropdownMenuItem onClick={() => openEdit(partner)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                            </PermissionGate>
                            <PermissionGate module="partners" action="delete">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelected(partner);
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
              Page {pagination.page} of {pagination.totalPages} •{" "}
              {pagination.total} total partners
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

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Add Partner
              </DialogTitle>
              <DialogDescription>
                Create a partner entry for the website.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreate)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Partner"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" />
                Edit Partner
              </DialogTitle>
              <DialogDescription>
                Update {selected?.name} partner details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleEdit)} className="mt-2">
              {renderFormFields()}
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Partner</AlertDialogTitle>
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
