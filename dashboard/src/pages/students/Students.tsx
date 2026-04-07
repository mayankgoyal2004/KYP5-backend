import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useToggleStudentStatus,
} from "@/hooks/useStudents";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  rollNumber: z.string().optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, limit };
    if (search) params.search = search;
    return params;
  }, [search, page, limit]);

  const { data, isLoading } = useStudents(queryParams);
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const toggleMutation = useToggleStudentStatus();

  const students = data?.data?.data || [];
  const pagination = data?.data?.meta;

  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      rollNumber: "",
      password: "",
      gender: "MALE",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      rollNumber: "",
      password: "",
      gender: "MALE",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      isActive: true,
    });
  };

  const handleCreate = async (formData: StudentForm) => {
    await createMutation.mutateAsync(formData);
    setCreateOpen(false);
    resetForm();
  };

  const openEdit = (student: any) => {
    setSelected(student);
    form.reset({
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      rollNumber: student.rollNumber || "",
      password: "",
      gender: student.gender || "MALE",
      dateOfBirth: student.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split("T")[0]
        : "",
      address: student.address || "",
      city: student.city || "",
      state: student.state || "",
      isActive: student.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = async (formData: StudentForm) => {
    if (!selected) return;
    const { password, ...rest } = formData;
    const payload = password ? formData : rest;
    await updateMutation.mutateAsync({ id: selected.id, data: payload });
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

  return (
    <MainLayout title="Students">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Student Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and manage student registrations and attempts
            </p>
          </div>
          <PermissionGate module="students" action="create">
            <Button
              onClick={() => {
                resetForm();
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Student
            </Button>
          </PermissionGate>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Attempts</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-3">
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : students.map((student: any) => (
                      <tr
                        key={student.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={getImageUrl(student.avatar)} />
                              <AvatarFallback className="bg-primary/10 text-primary uppercase">
                                {student.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span>{student.name}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                                Joined{" "}
                                {format(
                                  new Date(student.createdAt),
                                  "MMM yyyy",
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {student.email}
                            </div>
                            {student.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> {student.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 uppercase tracking-tighter">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <span className="font-bold">
                              {student._count?.testAttempts || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {student.isActive ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none items-center gap-1">
                              <div className="h-1 w-1 rounded-full bg-emerald-600" />{" "}
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground items-center gap-1"
                            >
                              <div className="h-1 w-1 rounded-full bg-muted-foreground" />{" "}
                              Inactive
                            </Badge>
                          )}
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
                              <PermissionGate module="students" action="update">
                                <DropdownMenuItem
                                  onClick={() => openEdit(student)}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                  Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleMutation.mutate(student.id)
                                  }
                                >
                                  {student.isActive ? (
                                    <>
                                      <UserX className="mr-2 h-3.5 w-3.5" />{" "}
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="mr-2 h-3.5 w-3.5" />{" "}
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </PermissionGate>
                              <PermissionGate module="students" action="delete">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelected(student);
                                    setDeleteOpen(true);
                                  }}
                                  className="text-destructive"
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
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

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-xl">
                <GraduationCap className="h-6 w-6 text-primary" /> Add New
                Student
              </DialogTitle>
              <DialogDescription>
                {" "}
                Register a new student to the system.{" "}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4 pt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter student's name"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-[10px] text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-[10px] text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-[10px] text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+91 0000000000"
                    {...form.register("phone")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Roll No (Optional)</Label>
                  <Input
                    placeholder="SL-001"
                    {...form.register("rollNumber")}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(v) => form.setValue("gender", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>DOB</Label>
                  <Input type="date" {...form.register("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="City" {...form.register("city")} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="State" {...form.register("state")} />
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Create Student
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Update Profile: {selected?.name}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleEdit)}
              className="space-y-4 pt-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...form.register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>Roll Number</Label>
                  <Input {...form.register("rollNumber")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Password (Optional)</Label>
                  <Input type="password" {...form.register("password")} />
                </div>
                <div className="space-y-2 pt-6 flex items-center gap-2">
                  <Switch
                    checked={form.watch("isActive")}
                    onCheckedChange={(v) => form.setValue("isActive", v)}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}{" "}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
