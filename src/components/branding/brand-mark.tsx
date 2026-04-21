import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  compact?: boolean;
  variant?: "default" | "light";
  className?: string;
};

export function BrandMark({ compact = false, variant = "default", className }: BrandMarkProps) {
  const src =
    variant === "light" ? "/brand/transway-logo-white.png" : "/brand/transway-logo.png";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={src}
        alt="Transway Xpress Global"
        width={compact ? 120 : 148}
        height={compact ? 36 : 44}
        priority
        className="h-auto w-auto"
        style={{ width: compact ? 120 : 148, height: "auto" }}
      />
    </div>
  );
}
