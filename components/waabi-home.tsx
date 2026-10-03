"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger);

const U = "https://motionprompts.dev/c/waabi-scroll-animation/";
const HERO = `${U}hero.jpg`;
const THUMBS = [`${U}img1.jpg`, `${U}img10.jpg`, `${U}img11.jpg`, `${U}img12.jpg`, `${U}img13.jpg`, `${U}img14.jpg`, `${U}img15.jpg`];

export function WaabiHome() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;

    // Smooth scroll (Lenis) already handled globally by SmoothScrollProvider
    // in app/layout.tsx. We only need to pump ScrollTrigger on window scroll.
    const onWinScroll = () => ScrollTrigger.update();
    window.addEventListener("scroll", onWinScroll, { passive: true });
    gsap.ticker.lagSmoothing(0);

    const heroHeader = root.querySelector<HTMLDivElement>(".hero-header")!;
    const heroCopyH3 = root.querySelector<HTMLHeadingElement>(".hero-copy h3")!;
    const heroImg = root.querySelector<HTMLDivElement>(".hero-img")!;
    let heroCopySplit: any;
    let copyFadeTween: gsap.core.Tween | undefined;
    let isHeroCopyHidden = false;

    const ctx = gsap.context(() => {
      heroCopySplit = SplitText.create(".hero-copy h3", { type: "words", wordsClass: "word" });

      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: `+${window.innerHeight * 3.5}px`,
        pin: true,
        pinSpacing: false,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Phase 1: header slide up out
          const heroHeaderProgress = Math.min(progress / 0.29, 1);
          gsap.set(heroHeader, { yPercent: -heroHeaderProgress * 100 });

          // Phase 2: words reveal
          const heroWordsProgress = Math.max(0, Math.min((progress - 0.29) / 0.21, 1));
          const totalWords = heroCopySplit.words.length;
          heroCopySplit.words.forEach((word: any, i: number) => {
            const wordStart = i / totalWords;
            const wordEnd = (i + 1) / totalWords;
            const wordOpacity = Math.max(0, Math.min((heroWordsProgress - wordStart) / (wordEnd - wordStart), 1));
            gsap.set(word, { opacity: wordOpacity });
          });

          // Phase 3: copy fade out (latched)
          if (progress > 0.64 && !isHeroCopyHidden) {
            isHeroCopyHidden = true;
            copyFadeTween = gsap.to(heroCopyH3, { opacity: 0, duration: 0.2 });
          } else if (progress <= 0.64 && isHeroCopyHidden) {
            isHeroCopyHidden = false;
            copyFadeTween = gsap.to(heroCopyH3, { opacity: 1, duration: 0.2 });
          }

          // Phase 4: hero image shrinks
          const heroImgProgress = Math.max(0, Math.min((progress - 0.71) / 0.29, 1));
          const w = gsap.utils.interpolate(window.innerWidth, 150, heroImgProgress);
          const h = gsap.utils.interpolate(window.innerHeight, 150, heroImgProgress);
          const r = gsap.utils.interpolate(0, 10, heroImgProgress);
          gsap.set(heroImg, { width: w, height: h, borderRadius: r });
        },
      });

      // Parallax columns
      const cols = [
        { id: "#about-imgs-col-1", y: -500 },
        { id: "#about-imgs-col-2", y: -250 },
        { id: "#about-imgs-col-3", y: -250 },
        { id: "#about-imgs-col-4", y: -500 },
      ];
      cols.forEach(({ id, y }) => {
        gsap.to(id, {
          y,
          scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }, root);

    return () => {
      copyFadeTween?.kill();
      ctx.revert();
      gsap.set([heroHeader, heroCopyH3, heroImg], { clearProps: "all" });
      heroCopySplit?.revert();
      window.removeEventListener("scroll", onWinScroll);
    };
  }, []);

  return (
    <div ref={rootRef} className="waabi-home">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
        .waabi-home * { margin:0; padding:0; box-sizing:border-box; }
        .waabi-home { font-family:"Inter",sans-serif; background:#e3e3db; }
        .waabi-home img { width:100%; height:100%; object-fit:cover; }
        .waabi-home h1,.waabi-home h3 { font-weight:400; letter-spacing:-0.05rem; line-height:1; }
        .waabi-home h1 { font-size:5rem; }
        .waabi-home h3 { font-size:3rem; }
        .waabi-home section { position:relative; width:100%; height:100svh; }
        .waabi-home .hero-img,.waabi-home .hero-header,.waabi-home .hero-copy { position:absolute; width:100%; height:100%; will-change:transform,opacity,width,height; }
        .waabi-home .hero-img { top:50%; left:50%; transform:translate(-50%,-50%); overflow:hidden; }
        .waabi-home .hero-header,.waabi-home .hero-copy { padding:4rem; color:#fff; display:flex; align-items:flex-end; }
        .waabi-home .hero-header h1 { width:75%; }
        .waabi-home .hero-copy h3 { width:50%; }
        .waabi-home .about,.waabi-home .outro { display:flex; justify-content:center; align-items:center; text-align:center; }
        .waabi-home .about { margin-top:275svh; }
        .waabi-home .about-images { width:100%; height:100%; display:flex; justify-content:space-between; align-items:center; padding:4rem; }
        .waabi-home .about-imgs-col { position:relative; height:125%; display:flex; flex-direction:column; justify-content:space-around; will-change:transform; }
        .waabi-home .about-imgs-col .img { width:125px; height:125px; border-radius:10px; overflow:hidden; }
        .waabi-home #about-imgs-col-1 { transform:translateY(1000px); }
        .waabi-home #about-imgs-col-2 { transform:translateX(-225px) translateY(500px); }
        .waabi-home #about-imgs-col-3 { transform:translateX(225px) translateY(500px); }
        .waabi-home #about-imgs-col-4 { transform:translateY(1000px); }
        .waabi-home .about-header { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:40%; }
        .waabi-home .outro { background:#cecec6; }
        .waabi-home .outro h3 { width:35%; }
      `}</style>

      <section className="hero">
        <div className="hero-img"><img src={HERO} alt="hero" /></div>
        <div className="hero-header"><h1>A study of motion unfolding inside a single frame</h1></div>
        <div className="hero-copy"><h3>The moment where stillness transforms into movement</h3></div>
      </section>

      <section className="about">
        <div className="about-images">
          {[1,2,3,4].map((c) => {
            const slice = Array.from({ length: 4 }, (_, k) => THUMBS[(c - 1) * 4 + k < 7 ? (c - 1) * 4 + k : ((c - 1) * 4 + k) % THUMBS.length]);
            return (
              <div key={c} className="about-imgs-col" id={`about-imgs-col-${c}`}>
                {slice.map((src, i) => (
                  <div key={i} className="img"><img src={src} alt="" /></div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="about-header"><h3>Fragments of motion and atmosphere gathered into a drifting collection of quiet visual moments.</h3></div>
      </section>

      <section className="outro">
        <h3>The frame settles back into quiet stillness.</h3>
      </section>
    </div>
  );
}
