import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "destructive";
};

export function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
  const styles =
    variant === "outline"
      ? "border border-white/20 text-white hover:bg-white/5"
      : variant === "destructive"
        ? "bg-red-500 text-white hover:bg-red-400"
        : "bg-green-500 text-black hover:bg-green-400";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
