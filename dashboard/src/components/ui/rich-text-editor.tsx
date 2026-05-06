import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link", "clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "link",
  "color",
  "background",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  return (
    <div className={cn("rich-text-editor w-full", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background rounded-md overflow-hidden"
      />
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          border-bottom: none;
          background-color: hsl(var(--muted) / 0.5);
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border: 1px solid hsl(var(--border)) !important;
          min-height: 150px;
          font-family: inherit;
          font-size: 0.875rem;
          background-color: hsl(var(--background));
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
          left: 15px;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-snow .ql-picker-options {
          background-color: hsl(var(--popover));
          border-color: hsl(var(--border));
        }
        .rich-text-editor .ql-snow.ql-toolbar button:hover,
        .rich-text-editor .ql-snow.ql-toolbar button:focus,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
          color: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke {
          stroke: hsl(var(--primary));
        }
        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
