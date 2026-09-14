import { Infographic } from "@antv/infographic";
import { useLayoutEffect, useRef } from "react";

type InfographicItem = {
  label?: string;
  desc?: string;
  value?: number;
  icon?: string;
};

// Actually uses the @antv/infographic template engine (list-row-horizontal-icon-arrow,
// chart-column-simple, ...) instead of hand-rolled divs/SVG — v1 had this
// installed but never called. Infographic.render() composes a static SVG tree
// synchronously (no internal animation loop), so — unlike rough-notation —
// it's safe to call once on mount without a GSAP-style frame-seek gotcha.
export const InfographicView: React.FC<{
  template: string;
  items: InfographicItem[];
  width: number;
  height: number;
  themeConfig?: Record<string, unknown>;
}> = ({ template, items, width, height, themeConfig }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const engine = new Infographic({
      container: containerRef.current,
      width,
      height,
      themeConfig,
    });
    engine.render({ template, data: { items } });
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, JSON.stringify(items), width, height, JSON.stringify(themeConfig)]);

  return <div ref={containerRef} style={{ width, height }} />;
};
