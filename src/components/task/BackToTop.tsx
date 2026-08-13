import React, { useState, useEffect, useCallback } from "react";
import { ChevronUp } from "lucide-react";

interface BackToTopProps {
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

export default function BackToTop({ scrollContainerRef }: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = scrollContainerRef?.current
      ? scrollContainerRef.current.scrollTop
      : window.scrollY;
    setVisible(scrollTop > 300);
  }, [scrollContainerRef]);

  useEffect(() => {
    const target = scrollContainerRef?.current ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, scrollContainerRef]);

  const scrollToTop = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-24 right-4 z-40 w-9 h-9 rounded-full bg-[#404040] text-white shadow-lg flex items-center justify-center transition-all duration-200 ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
