import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-warning/15 text-warning border-warning/30",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-primary/15 text-primary border-primary/30",
  },
  resolved: {
    label: "Resolved",
    classes: "bg-success/15 text-success border-success/30",
  },
  rejected: {
    label: "Rejected",
    classes: "bg-destructive/15 text-destructive border-destructive/30",
  },
  completed: {
    label: "Completed",
    classes: "bg-success/15 text-success border-success/30",
  },
  running: {
    label: "Running",
    classes: "bg-primary/15 text-primary border-primary/30",
  },
  on_hold: {
    label: "On Hold",
    classes: "bg-warning/15 text-warning border-warning/30",
  },
  active: {
    label: "Active",
    classes: "bg-success/15 text-success border-success/30",
  },
  inactive: {
    label: "Inactive",
    classes: "bg-muted text-muted-foreground border-border",
  },
  under_maintenance: {
    label: "Maintenance",
    classes: "bg-warning/15 text-warning border-warning/30",
  },
  closed: {
    label: "Closed",
    classes: "bg-destructive/15 text-destructive border-destructive/30",
  },
  proposed: {
    label: "Proposed",
    classes: "bg-primary/15 text-primary border-primary/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || {
    label: status,
    classes: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const map: Record<string, { label: string; classes: string }> = {
    high: {
      label: "High",
      classes: "bg-destructive/15 text-destructive border-destructive/30",
    },
    medium: {
      label: "Medium",
      classes: "bg-warning/15 text-warning border-warning/30",
    },
    low: {
      label: "Low",
      classes: "bg-success/15 text-success border-success/30",
    },
  };
  const config = map[priority] || {
    label: priority,
    classes: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
