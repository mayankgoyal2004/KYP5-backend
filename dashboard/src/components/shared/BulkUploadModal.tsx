import { useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Upload, FileUp, X, CheckCircle, AlertCircle } from "lucide-react";
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
import { toast } from "sonner";

interface BulkUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (data: any[]) => Promise<void>;
    title?: string;
    description?: React.ReactNode;
    sampleFileUrl?: string;
    sampleFileName?: string;
    onDownloadSample?: () => void;
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
}: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = xlsx.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = xlsx.utils.sheet_to_json(worksheet);

            if (json.length > 0) {
                setColumns(Object.keys(json[0] as object));
                setDataPreview(json);
            } else {
                toast.error("The uploaded file is empty.");
                resetState();
            }
        } catch (error) {
            console.error("Error parsing file:", error);
            toast.error("Failed to parse the file. Please ensure it's a valid Excel or CSV.");
            resetState();
        }
    };

    const resetState = () => {
        setFile(null);
        setDataPreview([]);
        setColumns([]);
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
        try {
            await onUpload(dataPreview);
            toast.success(`Successfully processed ${dataPreview.length} records.`);
            handleOpenChange(false);
        } catch (error: any) {
            console.error("Upload failed:", error);
            toast.error(error.message || "Failed to upload data. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
                    {!file ? (
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-1">Click or drag file to upload</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Supports .xlsx, .xls, and .csv files
                            </p>
                            <Button type="button" variant="outline">Select File</Button>
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
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md mb-4 border">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-primary/10 p-2 rounded-md">
                                        <FileUp className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(1)} KB • {dataPreview.length} rows found
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
                                                        <TableHead key={col} className="whitespace-nowrap">{col}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dataPreview.slice(0, 5).map((row, i) => (
                                                    <TableRow key={i}>
                                                        {columns.map((col) => (
                                                            <TableCell key={`${i}-${col}`} className="whitespace-nowrap max-w-[200px] truncate">
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
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadClick}
                        disabled={!file || dataPreview.length === 0 || isUploading}
                    >
                        {isUploading ? "Uploading..." : "Upload Data"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
