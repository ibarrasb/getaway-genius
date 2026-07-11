import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const scrollDocumentToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) return undefined;

    scrollDocumentToTop();
    const frame = window.requestAnimationFrame(scrollDocumentToTop);
    const timer = window.setTimeout(scrollDocumentToTop, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
