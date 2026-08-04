import { describe, it, expect } from "vitest";
import { parseVideoUrl } from "../../utils/video";

describe("parseVideoUrl", () => {
  describe("YouTube URLs", () => {
    it("parses standard watch URL", () => {
      const result = parseVideoUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      );
      expect(result).toEqual({ type: "youtube", embedId: "dQw4w9WgXcQ" });
    });

    it("parses youtu.be short URL", () => {
      const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(result).toEqual({ type: "youtube", embedId: "dQw4w9WgXcQ" });
    });

    it("parses embed URL", () => {
      const result = parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
      expect(result).toEqual({ type: "youtube", embedId: "dQw4w9WgXcQ" });
    });

    it("parses shorts URL", () => {
      const result = parseVideoUrl(
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      );
      expect(result).toEqual({ type: "youtube", embedId: "dQw4w9WgXcQ" });
    });
  });

  describe("Vimeo URLs", () => {
    it("parses vimeo URL", () => {
      const result = parseVideoUrl("https://vimeo.com/123456789");
      expect(result).toEqual({ type: "vimeo", embedId: "123456789" });
    });
  });

  describe("Loom URLs", () => {
    it("parses loom share URL", () => {
      const result = parseVideoUrl("https://www.loom.com/share/abc123def456");
      expect(result).toEqual({ type: "loom", embedId: "abc123def456" });
    });

    it("parses loom embed URL", () => {
      const result = parseVideoUrl("https://www.loom.com/embed/abc123def456");
      expect(result).toEqual({ type: "loom", embedId: "abc123def456" });
    });
  });

  describe("unsupported URLs", () => {
    it("returns null for non-video URL", () => {
      expect(parseVideoUrl("https://example.com/video")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseVideoUrl("")).toBeNull();
    });

    it("returns null for random text", () => {
      expect(parseVideoUrl("not a url")).toBeNull();
    });
  });
});
