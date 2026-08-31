import { ReactLenis } from "@studio-freight/react-lenis";

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll = ({ children }: SmoothScrollProps) => {
  return (
    <ReactLenis
      root
      options={{
        duration: 0.8,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        infinite: false,
        gestureOrientation: "vertical",
      } as Record<string, unknown>}
    >
      {children}
    </ReactLenis>
  );
};

export default SmoothScroll;
