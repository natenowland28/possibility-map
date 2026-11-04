"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const cn = clsx;

type Variant = "primary" | "accent" | "ghost" | "outline" | "soft" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white hover:bg-ink/90 shadow-[0_8px_24px_-10px_rgba(31,27,22,0.6)] disabled:bg-ink/30 disabled:shadow-none",
  accent:
    "bg-accent text-white hover:brightness-105 shadow-[0_10px_28px_-12px_var(--accent)] disabled:opacity-40 disabled:shadow-none",
  ghost: "text-ink-soft hover:text-ink hover:bg-ink/5 disabled:opacity-40",
  outline: "border border-line bg-white/60 text-ink hover:bg-white hover:border-ink/15 disabled:opacity-40",
  soft: "bg-accent-soft text-accent hover:brightness-[0.98] disabled:opacity-40",
  danger:
    "border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 hover:text-red-700 disabled:opacity-40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none",
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-14 px-7 text-base",
        variants[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] text-accent", className)}>{children}</div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-medium text-ink-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
