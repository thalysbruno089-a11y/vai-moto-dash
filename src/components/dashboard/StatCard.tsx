import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "destructive" | "warning";
}

const StatCard = ({ title, value, icon, trend, variant = "default" }: StatCardProps) => {
  const variants = {
    default: "stat-card",
    primary: "stat-card-primary",
    success: "stat-card-success",
    destructive: "stat-card-destructive",
    warning: "stat-card-warning",
  };

  const isColored = variant !== "default";

  return (
    <div className={variants[variant]}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            "text-sm font-medium",
            isColored ? "opacity-90" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              isColored 
                ? "opacity-80" 
                : trend.positive 
                  ? "text-success" 
                  : "text-destructive"
            )}>
              {trend.positive ? "+" : ""}{trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          isColored ? "bg-white/20" : "bg-primary/10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
