import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTest, useDeleteTest } from "@/hooks/useTests";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ClipboardCheck,
  BookOpen,
  Clock,
  Users,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Settings2,
  BarChart3,
  Pencil,
  Plus,
  Calendar,
  Target,
  Minus,
  Eye,
  EyeOff,
  Timer,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
  BookMarked,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function TestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useTest(id || null);
  const { mutateAsync: deleteTest, isPending: isDeleting } = useDeleteTest();
  
  const test = data?.data;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteTest(id);
      navigate("/tests");
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Test Details">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!test) {
    return (
      <MainLayout title="Test Not Found">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <ClipboardCheck className="h-16 w-16 text-muted-foreground/20" />
          <p className="text-muted-foreground font-medium text-lg">Test not found.</p>
          <Button variant="outline" onClick={() => navigate("/tests")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Tests
          </Button>
        </div>
      </MainLayout>
    );
  }

  const questionCount = test.questions?.length || 0;
  const totalMarks = test.questions?.reduce((sum: number, q: any) => sum + q.marks, 0) || test.totalMarks;

  return (
    <MainLayout title={test.title}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background"
              onClick={() => navigate("/tests")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{test.title}</h1>
                <Badge 
                  variant="outline" 
                  className="text-[10px] p-0 overflow-hidden bg-muted/50 border-muted-foreground/20"
                >
                  {test.course?.thumbnail ? (
                    <img
                      src={test.course.thumbnail}
                      alt={test.course.title}
                      className="h-5 w-8 object-cover mr-1.5 border-r"
                    />
                  ) : (
                    <BookOpen className="h-3 w-3 mx-1.5" />
                  )}
                  <span className="pr-2">{test.course?.title}</span>
                </Badge>
                {test.isActive ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] hover:bg-emerald-500/15">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    <XCircle className="h-3 w-3 mr-1" /> Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated {format(new Date(test.updatedAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <PermissionGate module="questions" action="read">
              <Button 
                variant="outline" 
                className="gap-2 bg-background border-primary/20 hover:border-primary/40 text-primary"
                onClick={() => navigate(`/questions?testId=${test.id}`)}
              >
                <FileText className="h-4 w-4" /> Questions
              </Button>
            </PermissionGate>
            <PermissionGate module="tests" action="update">
              <Button 
                variant="outline" 
                className="gap-2 bg-background shadow-sm"
                onClick={() => navigate(`/tests/${test.id}/edit`)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </PermissionGate>
            <PermissionGate module="tests" action="delete">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 shadow-sm border-none">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Test</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <span className="font-semibold">"{test.title}"</span>? 
                      This will permanently remove the test and all its questions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </PermissionGate>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-b-2 border-b-primary overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <HelpCircle className="h-5 w-5 text-primary mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.totalQuestions}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Ques</p>
            </CardContent>
          </Card>
          <Card className="border-b-2 border-b-amber-500 overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.duration}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Minutes</p>
            </CardContent>
          </Card>
          <Card className="border-b-2 border-b-emerald-500 overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <Target className="h-5 w-5 text-emerald-500 mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.totalMarks}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Marks</p>
            </CardContent>
          </Card>
          <Card className="border-b-2 border-b-blue-500 overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.allowedAttempts}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Attempts</p>
            </CardContent>
          </Card>
          <Card className="border-b-2 border-b-violet-500 overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <BarChart3 className="h-5 w-5 text-violet-500 mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.passingScore}%</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Pass Score</p>
            </CardContent>
          </Card>
          <Card className="border-b-2 border-b-rose-500 overflow-hidden hover:shadow-sm transition-all">
            <CardContent className="p-4 text-center space-y-1">
              <ClipboardCheck className="h-5 w-5 text-rose-500 mx-auto mb-1 opacity-70" />
              <p className="text-xl font-bold tracking-tight">{test.minAnswersRequired}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Min Answers</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner if course is inactive */}
        {!test.isActive && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">This test is currently inactive and will not be visible to students.</p>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="overview" className="gap-2">
              <Settings2 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <HelpCircle className="h-4 w-4" /> Questions ({questionCount})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" /> Schedule
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" /> Instructions & Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instructions</h4>
                    <div className="p-4 rounded-lg bg-muted/20 border text-sm prose dark:prose-invert max-w-none prose-sm leading-relaxed">
                      {test.instructions || <span className="italic opacity-50">No instructions provided.</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terms & Conditions</h4>
                    <div className="p-4 rounded-lg bg-muted/20 border text-sm italic opacity-80 leading-relaxed">
                      {test.termsConditions || <span className="opacity-50">No terms provided.</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" /> Test Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "Negative Marking",
                      value: test.negativeMarking ? `Enabled (-${test.negativeMarkValue})` : "Disabled",
                      icon: <Minus className={`h-3.5 w-3.5 ${test.negativeMarking ? 'text-red-500' : 'text-muted-foreground'}`} />,
                      active: test.negativeMarking
                    },
                    {
                      label: "Question Order",
                      value: test.shuffleQuestions ? "Shuffled per attempt" : "Fixed order",
                      icon: <HelpCircle className={`h-3.5 w-3.5 ${test.shuffleQuestions ? 'text-primary' : 'text-muted-foreground'}`} />,
                      active: test.shuffleQuestions
                    },
                    {
                      label: "Auto Submit",
                      value: "Always enabled",
                      icon: <Timer className="h-3.5 w-3.5 text-amber-500" />,
                      active: true
                    },
                    {
                      label: "Immediate Results",
                      value: test.showResult ? "Yes" : "No",
                      icon: <Eye className={`h-3.5 w-3.5 ${test.showResult ? 'text-emerald-500' : 'text-muted-foreground'}`} />,
                      active: test.showResult
                    },
                    {
                      label: "Show Correct Answers",
                      value: test.showAnswers ? "Yes" : "No",
                      icon: <EyeOff className={`h-3.5 w-3.5 ${test.showAnswers ? 'text-primary' : 'text-muted-foreground'}`} />,
                      active: test.showAnswers
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                      <Badge variant={item.active ? "default" : "secondary"} className="text-[9px] font-bold h-4">
                        {item.value}
                      </Badge>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Languages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {test.testLanguages?.map((item: any) => (
                        <Badge key={item.language.id} variant="outline" className="text-[10px]">
                          {item.language.name} ({item.language.code.toUpperCase()})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4 flex items-center justify-between opacity-50">
                    <span className="text-[10px] font-mono">ID: {test.id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Questions Tab Content */}
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Questions Listing ({questionCount})</CardTitle>
                <div className="flex gap-2">
                  <PermissionGate module="questions" action="create">
                    <Button 
                      size="sm" 
                      className="h-8 gap-1"
                      onClick={() => navigate(`/questions/new?testId=${test.id}`)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Question
                    </Button>
                  </PermissionGate>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {questionCount === 0 ? (
                  <div className="text-center py-24 space-y-3">
                    <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-muted-foreground text-sm font-medium">No questions added yet.</p>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/questions/new?testId=${test.id}`)}>
                      Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="w-[60px]">Sr.</TableHead>
                          <TableHead>Question Text</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">Marks</TableHead>
                          <TableHead className="text-center">Difficulty</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {test.questions?.map((q: any, idx: number) => (
                          <TableRow key={q.id} className="group hover:bg-muted/20">
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <p className="text-sm leading-relaxed line-clamp-2">{q.text}</p>
                              {q.imageUrl && <Badge variant="secondary" className="mt-1 text-[8px] h-3">Includes Image</Badge>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                                {q.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs font-semibold">{q.marks}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                className={`text-[9px] uppercase ${
                                  q.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-600 border-none' :
                                  q.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-600 border-none' :
                                  'bg-amber-500/10 text-amber-600 border-none'
                                }`}
                              >
                                {q.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <PermissionGate module="questions" action="update">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                  onClick={() => navigate(`/questions/${q.id}/edit?testId=${test.id}`)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </PermissionGate>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {questionCount > 0 && (
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate(`/questions?testId=${test.id}`)}
                >
                  <FileText className="h-4 w-4" /> Go to Full Management
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Schedule Tab Content */}
          <TabsContent value="schedule">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Availability Window
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Starts From</p>
                      <p className="text-lg font-bold">
                        {test.startDate ? format(new Date(test.startDate), "dd MMM yyyy") : "OPEN START"}
                      </p>
                      <p className="text-[10px] opacity-60">
                         {test.startDate ? format(new Date(test.startDate), "hh:mm a") : "Anytime"}
                      </p>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Ends At</p>
                      <p className="text-lg font-bold">
                        {test.endDate ? format(new Date(test.endDate), "dd MMM yyyy") : "NO EXPIRY"}
                      </p>
                      <p className="text-[10px] opacity-60">
                         {test.endDate ? format(new Date(test.endDate), "hh:mm a") : "Until Disabled"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/20 border rounded-lg">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
                      <Target className="h-3.5 w-3.5" /> Status Timeline
                    </h4>
                    <div className="flex items-center gap-2 pt-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${test.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      <p className="text-sm font-medium">
                        {test.isActive ? "Test is live and accepting submissions (within window)" : "Test is offline"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Delivery Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Submissions</span>
                      <span className="font-bold">{test._count?.testAttempts || 0}</span>
                    </div>
                    <Progress value={(test._count?.testAttempts || 0) > 0 ? 100 : 0} className="h-1.5" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/20 rounded-md text-center">
                      <p className="text-sm font-bold text-primary">N/A</p>
                      <p className="text-[10px] text-muted-foreground">Avg. Score</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-md text-center">
                      <p className="text-sm font-bold text-primary">N/A</p>
                      <p className="text-[10px] text-muted-foreground">Highest Score</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground italic pt-2">Analytics data is generated upon test completion.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
