import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BannerVideo } from "@/components/public/banner-video";

describe("banner video", () => {
  it("plays itself and has no button", () => {
    const markup = renderToStaticMarkup(
      createElement(BannerVideo, { src: "/banner.mp4", label: "Campaign video", playLabel: "Play video" }),
    );
    const folded = markup.toLowerCase();
    expect(folded).toContain("<video");
    expect(folded).toContain('autoplay=""');
    expect(folded).toContain('loop=""');
    expect(folded).toContain('muted=""');
    expect(folded).toContain('playsinline=""');
    expect(markup).toContain('src="/banner.mp4#t=0.1"');
    expect(folded).not.toContain('controls=""');
    expect(markup).not.toContain("<button");
  });
});
