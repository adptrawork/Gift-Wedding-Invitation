"use client";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
  animate?: boolean;
}

export function GradientText({
  children,
  className = "",
  from = "#d4a574",
  to = "#8b6f47",
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={`bg-clip-text text-transparent ${animate ? "animate-gradient-x" : ""} ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from}, ${to}, ${from})`,
        backgroundSize: "200% auto",
      }}
    >
      {children}
    </span>
  );
}
