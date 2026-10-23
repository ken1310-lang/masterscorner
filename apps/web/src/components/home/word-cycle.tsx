import { useEffect, useState } from "react";

const WORDS = ["silambam", "karate", "kalari", "boxing", "MMA", "kids"];

export function HomeWordCycle() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % WORDS.length),
      2400
    );
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const word = WORDS[index] ?? WORDS[0];

  return (
    <span
      aria-live="off"
      className="relative block h-[70px] rx-lg:h-[176px] rx-sm:h-[120px] w-full max-w-[900px] overflow-hidden"
    >
      <span className="sr-only">martial arts</span>
      <span
        aria-hidden="true"
        className="redesign-word-enter absolute inset-0 block text-center font-black rx-lg:text-[168px] rx-sm:text-[112px] text-[62px] text-navy leading-none tracking-[-0.055em]"
        key={word}
      >
        {word}
        <span className="text-brand">.</span>
      </span>
    </span>
  );
}
