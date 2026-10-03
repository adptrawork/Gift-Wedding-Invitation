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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}} />
      <span
        className={`bg-clip-text text-transparent ${className}`}
        style={{
          backgroundImage: `linear-gradient(90deg, ${from}, ${to}, ${from})`,
          backgroundSize: "200% auto",
          animation: animate ? "gradient-x 3s ease infinite" : undefined,
        }}
      >
        {children}
      </span>
    </>
  );
}
