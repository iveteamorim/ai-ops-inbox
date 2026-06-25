import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 ${className}`} {...props} />
  );
}

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className = "", ...props }: CardContentProps) {
  return <div className={className} {...props} />;
}
