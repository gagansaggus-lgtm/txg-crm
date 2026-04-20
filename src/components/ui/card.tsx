import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section className={cn("card-surface rounded-[1.5rem] p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}
