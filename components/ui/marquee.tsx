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
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"} ${
          pauseOnHover ? "hover:[animation-play-state:paused]" : ""
        }`}
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
