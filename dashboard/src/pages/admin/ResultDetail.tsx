import { useNavigate, useParams } from "react-router-dom";
import { useResult } from "@/hooks/useResults";
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
  BarChart3,
  User,
  ClipboardCheck,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Minus,
  Trophy,
  Timer,
  Calendar,
  Phone,
  Mail,
  PieChart,
  FileText,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ResultDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading } = useResult(id || null);
  const attempt = data?.data;

  if (isLoading) {
    return (
      <MainLayout title="Result Details">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </MainLayout>
    );
  }

  if (!attempt) {
    return (
      <MainLayout title="Result Not Found">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Result not found.</p>
          <Button variant="outline" onClick={() => navigate("/results")}>
            Back to Results
          </Button>
        </div>
      </MainLayout>
    );
  }

  const timeSpentMins = attempt.timeSpent ? Math.floor(attempt.timeSpent / 60) : 0;
  const timeSpentSecs = attempt.timeSpent ? attempt.timeSpent % 60 : 0;

  const answers = attempt.userAnswers || [];
  const getSelectedOptionIds = (answer: any) =>
    Array.isArray(answer.selectedOptionIds) && answer.selectedOptionIds.length > 0
      ? answer.selectedOptionIds
      : answer.selectedOptionId
        ? [answer.selectedOptionId]
        : [];
  const isAnswerAttempted = (answer: any) => getSelectedOptionIds(answer).length > 0;
  const totalQuestions = attempt.totalQuestions || attempt.test?.totalQuestions || answers.length;
  const correctCount = attempt.correctCount ?? answers.filter((a: any) => a.isCorrect).length;
  const wrongCount =
    attempt.wrongCount ??
    answers.filter((a: any) => a.isCorrect === false && isAnswerAttempted(a)).length;
  const unansweredCount =
    attempt.skippedCount ??
    totalQuestions - answers.filter((a: any) => isAnswerAttempted(a)).length;
  const passingScore = attempt.test?.passingScore || 0;
  const isPassed = attempt.isPassed ?? attempt.percentage >= passingScore;

  return (
    <MainLayout title="Result Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => navigate("/results")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{attempt.test?.title}</h1>
                <Badge
                  className={`${
                    isPassed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  } flex items-center gap-1.5`}
                >
                  {isPassed ? <Trophy className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {isPassed ? "PASSED" : "FAILED"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Taken on {format(new Date(attempt.startTime), "PPP 'at' p")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2" onClick={() => window.print()}>
               <FileText className="h-4 w-4" /> Export Result
             </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className={`text-xl font-bold ${isPassed ? "text-emerald-600" : "text-red-600"}`}>
                {attempt.percentage?.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Percentage</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <ClipboardCheck className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold">{attempt.score} / {attempt.totalMarks}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scored</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-600">{correctCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Correct</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-600">{wrongCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wrong</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Minus className="h-5 w-5 text-gray-400 mx-auto mb-1" />
              <p className="text-xl font-bold">{unansweredCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Skipped</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Timer className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{timeSpentMins}m {timeSpentSecs}s</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Time Took</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Details Card */}
        <Card className="overflow-hidden border-orange-100 ring-1 ring-orange-50/50">
          <CardHeader className="pb-3 border-b bg-orange-50/10">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <User className="h-4 w-4" /> Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-orange-100">
                <AvatarImage src={getImageUrl(attempt.user?.avatar)} />
                <AvatarFallback className="bg-orange-100 text-orange-700 text-xl font-bold">
                  {attempt.user?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-foreground">{attempt.user?.name}</h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" /> {attempt.user?.email}</span>
                  {attempt.user?.phone && (
                    <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary" /> {attempt.user?.phone}</span>
                  )}
                  {attempt.user?.rollNumber && (
                    <Badge variant="outline" className="font-mono bg-background">ID: {attempt.user?.rollNumber}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-2 px-6 py-3 bg-muted/20 rounded-xl border">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Test Information</p>
                 <div className="flex items-center gap-2">
                     <span className="font-semibold text-sm">Test Detail</span>
                 </div>
                 <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Passing: {passingScore}%</span>
                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> Limit: {attempt.test?.duration}m</span>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Tabs */}
        <Tabs defaultValue="answers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="answers" className="gap-2">
               <FileText className="h-4 w-4" /> Answer Sheet
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
               <PieChart className="h-4 w-4" /> Performance Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="answers" className="space-y-4 py-4">
             {answers.map((answer: any, idx: number) => {
                const question = answer.question;
                if (!question) return null;
                const selectedOptionIds = getSelectedOptionIds(answer);
                const isUnanswered = selectedOptionIds.length === 0;

                return (
                  <Card key={answer.id || idx} className={`overflow-hidden border-none ring-1 ${
                    answer.isCorrect 
                      ? "ring-emerald-200 bg-emerald-50/10" 
                      : isUnanswered 
                      ? "ring-gray-200 bg-muted/10" 
                      : "ring-red-200 bg-red-50/10"
                  }`}>
                    <CardContent className="p-4">
                       <div className="flex items-start gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-bold font-mono text-sm ${
                            answer.isCorrect ? "bg-emerald-100 text-emerald-700" : isUnanswered ? "bg-muted text-muted-foreground" : "bg-red-100 text-red-700"
                          }`}>
                            Q{question.order || idx + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                             <div className="flex justify-between items-start">
                                <h4 className="text-sm font-semibold leading-relaxed">{question.text}</h4>
                                <div className="text-right">
                                   <Badge variant="outline" className="text-[10px] uppercase">{question.type}</Badge>
                                   <p className="text-[10px] text-muted-foreground mt-1">{question.marks} Points</p>
                                </div>
                             </div>

                             <div className="grid sm:grid-cols-2 gap-2">
                                {question.options?.map((opt: any, optIdx: number) => {
                                  const isSelected = selectedOptionIds.includes(opt.id);
                                  const isCorrect = opt.isCorrect;
                                  const label = String.fromCharCode(65 + optIdx);

                                  let borderClass = "border-transparent";
                                  let bgClass = "bg-background/80";
                                  let icon = null;

                                  if (isCorrect) {
                                    borderClass = "border-emerald-500 ring-1 ring-emerald-500";
                                    bgClass = "bg-emerald-100/50";
                                    icon = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
                                  } else if (isSelected) {
                                    borderClass = "border-red-500 ring-1 ring-red-500";
                                    bgClass = "bg-red-100/50";
                                    icon = <XCircle className="h-4 w-4 text-red-600" />;
                                  }

                                  return (
                                    <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border ${borderClass} ${bgClass} transition-all`}>
                                       <span className="text-xs font-bold text-muted-foreground">{label}.</span>
                                       <span className={`text-sm flex-1 ${isCorrect ? "font-bold text-emerald-900" : isSelected ? "font-bold text-red-900" : "text-foreground"}`}>
                                         {opt.text}
                                       </span>
                                       {icon}
                                       {isSelected && (
                                          <span className="text-[10px] font-bold uppercase text-muted-foreground/50">You</span>
                                       )}
                                    </div>
                                  )
                                })}
                             </div>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                )
             })}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 py-4">
             <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Accuracy Breakdown</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span>Efficiency Rate</span>
                           <span className="font-bold">{attempt.percentage?.toFixed(1)}%</span>
                        </div>
                        <Progress value={attempt.percentage} className="h-2" />
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                           <p className="text-2xl font-bold text-emerald-700">{correctCount}</p>
                           <p className="text-[10px] text-emerald-600 font-bold uppercase">Correct</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                           <p className="text-2xl font-bold text-red-700">{wrongCount}</p>
                           <p className="text-[10px] text-red-600 font-bold uppercase">Wrong</p>
                        </div>
                     </div>
                  </CardContent>
                </Card>

                <Card>
                   <CardHeader><CardTitle className="text-sm">Time Analysis</CardTitle></CardHeader>
                   <CardContent className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b">
                         <div className="flex items-center gap-3">
                            <Clock className="h-10 w-10 text-primary p-2 bg-primary/10 rounded-full" />
                            <div>
                               <p className="text-sm font-bold">Total Duration</p>
                               <p className="text-xs text-muted-foreground">{timeSpentMins}m {timeSpentSecs}s spent</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-bold">{attempt.test?.duration}m</p>
                           <p className="text-[10px] text-muted-foreground uppercase">Allocated</p>
                         </div>
                      </div>

                      <div className="space-y-2 pt-2">
                         <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                            <span>Time Usage</span>
                            <span>{Math.round(((attempt.timeSpent || 0) / (attempt.test?.duration * 60 || 1)) * 100)}% Used</span>
                         </div>
                         <Progress value={((attempt.timeSpent || 0) / (attempt.test?.duration * 60 || 1)) * 100} className="h-2 bg-muted transition-all" />
                      </div>
                   </CardContent>
                </Card>
             </div>
             
             <Card>
                <CardHeader><CardTitle className="text-sm">Performance Summary</CardTitle></CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                         <TableRow>
                            <TableHead>Metric</TableHead>
                            <TableHead className="text-right">Result</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         <TableRow>
                            <TableCell className="text-muted-foreground flex items-center gap-2"><ArrowLeft className="h-3 w-3" /> Passing Threshold</TableCell>
                            <TableCell className="text-right font-bold text-blue-600">{passingScore}%</TableCell>
                         </TableRow>
                         <TableRow>
                            <TableCell className="text-muted-foreground flex items-center gap-2"><Minus className="h-3 w-3" /> Negative Marks Incurred</TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {answers.reduce(
                                (acc: number, a: any) =>
                                  !a.isCorrect && isAnswerAttempted(a)
                                    ? acc + (a.question?.negativeMarks || 0)
                                    : acc,
                                0,
                              )}
                            </TableCell>
                         </TableRow>
                         <TableRow>
                            <TableCell className="text-muted-foreground flex items-center gap-2"><Target className="h-3 w-3" /> Average Accuracy</TableCell>
                            <TableCell className="text-right font-bold">{(correctCount / (totalQuestions || 1) * 100).toFixed(1)}%</TableCell>
                         </TableRow>
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
