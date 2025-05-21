import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto",
        className
      )}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      {children}
    </div>
  );
}
