import { useState, useRef } from "react";
import * as xlsx from "xlsx";
import {
  Upload,
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface BulkUploadResult {
  created: number;
  skippedDuplicates: number;
  errorsCount: number;
  totalProcessed: number;
  duplicates: Array<{ row: number; text: string; reason: string }>;
  errors: Array<{
    type: "validation" | "database";
    row?: number;
    rows?: number[];
    field?: string;
    batchIndex?: number;
    message: string;
  }>;
  performance?: {
    totalMs: number;
    validationMs: number;
    dedupMs: number;
    databaseMs: number;
    batchCount: number;
    batchSize: number;
  };
}

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (data: any[]) => Promise<any>;
  title?: string;
  description?: React.ReactNode;
  sampleFileUrl?: string;
  sampleFileName?: string;
  onDownloadSample?: () => void;
  maxRowWarning?: number;
}

export function BulkUploadModal({
  open,
  onOpenChange,
  onUpload,
  title = "Bulk Upload",
  description = "Upload an Excel or CSV file to import multiple records at once.",
  sampleFileUrl,
  sampleFileName = "template.csv",
  onDownloadSample,
  maxRowWarning = 500,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showLargeFileWarning, setShowLargeFileWarning] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadResult(null);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = xlsx.utils.sheet_to_json(worksheet);

      if (json.length > 0) {
        setColumns(Object.keys(json[0] as object));
        setDataPreview(json);

        if (json.length > maxRowWarning) {
          setShowLargeFileWarning(true);
        }
      } else {
        toast.error("The uploaded file is empty.");
        resetState();
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error(
        "Failed to parse the file. Please ensure it's a valid Excel or CSV."
      );
      resetState();
    }
  };

  const resetState = () => {
    setFile(null);
    setDataPreview([]);
    setColumns([]);
    setUploadResult(null);
    setShowLargeFileWarning(false);
    setShowErrorDetails(false);
    setShowDuplicateDetails(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleUploadClick = async () => {
    if (dataPreview.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setShowLargeFileWarning(false);

    try {
      setUploadProgress(30);
      const result = await onUpload(dataPreview);
      setUploadProgress(100);

      // Extract result data from the API response
      const resultData: BulkUploadResult = result?.data || result;
      if (resultData && typeof resultData.created === "number") {
        setUploadResult(resultData);
      } else {
        // Legacy response format — just close
        toast.success(
          `Successfully processed ${dataPreview.length} records.`
        );
        handleOpenChange(false);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      // Try to extract result from error response
      const errorResult = error?.response?.data?.data;
      if (errorResult && typeof errorResult.created === "number") {
        setUploadResult(errorResult);
      } else {
        toast.error(
          error?.response?.data?.message ||
            error.message ||
            "Failed to upload data. Please try again."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // ── Results View ─────────────────────────────────────────
  if (uploadResult) {
    const { created, skippedDuplicates, errorsCount, totalProcessed, duplicates, errors, performance } =
      uploadResult;
    const hasIssues = skippedDuplicates > 0 || errorsCount > 0;

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {created > 0 && !hasIssues && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Upload Successful
                </>
              )}
              {created > 0 && hasIssues && (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Partial Upload
                </>
              )}
              {created === 0 && (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Upload Failed
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 text-center bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {created}
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">Created</p>
              </div>
              <div className="border rounded-lg p-3 text-center bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {skippedDuplicates}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Duplicates Skipped</p>
              </div>
              <div className="border rounded-lg p-3 text-center bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {errorsCount}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">Errors</p>
              </div>
            </div>

            {/* Total processed info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Total rows processed: {totalProcessed}</span>
              {performance && (
                <span>
                  Completed in {(performance.totalMs / 1000).toFixed(1)}s
                  ({performance.batchCount} batches)
                </span>
              )}
            </div>

            {/* Duplicates Details */}
            {duplicates && duplicates.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors text-left"
                  onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                >
                  <span className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    {duplicates.length} Duplicate(s) Skipped
                  </span>
                  {showDuplicateDetails ? (
                    <ChevronUp className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600" />
                  )}
                </button>
                {showDuplicateDetails && (
                  <ScrollArea className="max-h-[200px]">
                    <div className="divide-y">
                      {duplicates.map((dup, i) => (
                        <div key={i} className="px-3 py-2 text-xs flex items-start gap-2">
                          <Badge variant="outline" className="shrink-0 text-[10px] py-0">
                            Row {dup.row}
                          </Badge>
                          <span className="text-muted-foreground truncate flex-1">
                            {dup.text}
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 shrink-0">
                            {dup.reason}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Errors Details */}
            {errors && errors.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors text-left"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                >
                  <span className="text-sm font-medium flex items-center gap-2 text-red-700 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    {errors.length} Error(s)
                  </span>
                  {showErrorDetails ? (
                    <ChevronUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-red-600" />
                  )}
                </button>
                {showErrorDetails && (
                  <ScrollArea className="max-h-[200px]">
                    <div className="divide-y">
                      {errors.map((err, i) => (
                        <div key={i} className="px-3 py-2 text-xs flex items-start gap-2">
                          <Badge
                            variant={err.type === "validation" ? "outline" : "destructive"}
                            className="shrink-0 text-[10px] py-0"
                          >
                            {err.type === "validation"
                              ? `Row ${err.row}`
                              : `Batch ${err.batchIndex}`}
                          </Badge>
                          {err.field && (
                            <Badge variant="secondary" className="shrink-0 text-[10px] py-0">
                              {err.field}
                            </Badge>
                          )}
                          <span className="text-red-600 dark:text-red-400 flex-1">
                            {err.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Upload View ──────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Uploading Progress */}
          {isUploading && (
            <div className="space-y-3 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Processing {dataPreview.length} rows...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Validating, checking duplicates, and inserting in batches
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {!file && !isUploading ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">
                Click or drag file to upload
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports .xlsx, .xls, and .csv files (up to 2,000 rows)
              </p>
              <Button type="button" variant="outline">
                Select File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
              />

              {(sampleFileUrl || onDownloadSample) && (
                <div className="mt-6">
                  {onDownloadSample ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadSample();
                      }}
                      className="text-sm text-primary hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <FileUp className="h-4 w-4" /> Download Sample Template
                    </button>
                  ) : (
                    <a
                      href={sampleFileUrl}
                      download={sampleFileName}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <FileUp className="h-4 w-4" /> Download Sample Template
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : file && !isUploading ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* File info */}
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md mb-3 border">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB •{" "}
                      {dataPreview.length} rows found
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetState}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Large file warning */}
              {showLargeFileWarning && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md mb-3">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-400">
                    <p className="font-medium">Large file detected ({dataPreview.length} rows)</p>
                    <p className="mt-0.5">
                      The upload will be processed in batches. Duplicates will
                      be automatically detected and skipped. This may take a
                      moment.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {dataPreview.length > 0 && (
                <div className="border rounded-md flex-1 overflow-hidden flex flex-col">
                  <div className="p-2 border-b bg-muted/30">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Data Preview (First 5 rows)
                    </p>
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <TableRow>
                          {columns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataPreview.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {columns.map((col) => (
                              <TableCell
                                key={`${i}-${col}`}
                                className="whitespace-nowrap max-w-[200px] truncate"
                              >
                                {String(row[col] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  {dataPreview.length > 5 && (
                    <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 border-t">
                      And {dataPreview.length - 5} more rows...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadClick}
            disabled={!file || dataPreview.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Upload ${dataPreview.length} Row${dataPreview.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
