import { cn } from "@/lib/utils";

interface BadgeStatusProps {
  status: "active" | "inactive" | "pending" | "success" | "warning" | "error";
  children: React.ReactNode;
}

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-muted-foreground/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

export const BadgeStatus = ({ status, children }: BadgeStatusProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        statusStyles[status]
      )}
    >
      {children}
    </span>
  );
};
