import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const NAV_OFFSET = 88;

const ScrollToHash = () => {
  const { pathname, hash } = useLocation();
  const firstLoadHandled = useRef(false);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (!firstLoadHandled.current) {
      firstLoadHandled.current = true;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return undefined;
    }

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
      window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }, 40);
      return undefined;
    }

    const targetId = hash.replace("#", "");
    let attempts = 0;

    const timer = window.setInterval(() => {
      const target = document.getElementById(targetId);

      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        window.scrollTo({
          top: Math.max(top, 0),
          behavior: "smooth",
        });
        window.clearInterval(timer);
        return;
      }

      attempts += 1;
      if (attempts > 30) {
        window.clearInterval(timer);
      }
    }, 40);

    return () => {
      window.clearInterval(timer);
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
