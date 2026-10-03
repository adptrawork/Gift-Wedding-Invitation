"use client";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className = "",
  repeat = 4,
  reverse = false,
  pauseOnHover = false,
}: MarqueeProps) {
  const dir = reverse ? "marquee-reverse" : "marquee";
  return (
    <div className={`overflow-hidden ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}} />
      <div
        className="flex w-max"
        style={{
          animation: `${dir} ${className ? (className.includes("slow") ? "30s" : "20s") : "20s"} linear infinite`,
          animationPlayState: pauseOnHover ? "paused" : "running",
        }}
        onMouseEnter={(e) => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = "paused"; }}
        onMouseLeave={(e) => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = "running"; }}
      >
        {Array.from({ length: repeat }).map((_, i) => (
          <div key={i} className="flex-shrink-0">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
