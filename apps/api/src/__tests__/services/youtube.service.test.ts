import { describe, it, expect } from "vitest";
import {
  extractVideoId,
  parseISO8601Duration,
} from "../../services/youtube.service";

describe("extractVideoId", () => {
  it("extracts ID from youtube.com/watch?v=", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtu.be/", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtube.com/embed/", () => {
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtube.com/v/", () => {
    expect(extractVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtube.com/shorts/", () => {
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from youtube.com/live/", () => {
    expect(extractVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID when v= is not the first query param", () => {
    expect(
      extractVideoId(
        "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
      ),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from m.youtube.com/watch?v=", () => {
    expect(extractVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts ID from watch?v= with trailing params", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s"),
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from youtu.be/ with trailing params", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ?si=abc123")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts bare 11-char video ID with surrounding whitespace", () => {
    expect(extractVideoId("  dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts bare 11-char video ID", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for invalid URL", () => {
    expect(extractVideoId("https://example.com/video")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractVideoId("")).toBeNull();
  });

  it("returns null for string shorter than 11 chars", () => {
    expect(extractVideoId("short")).toBeNull();
  });
});

describe("parseISO8601Duration", () => {
  it("parses seconds only", () => {
    expect(parseISO8601Duration("PT30S")).toBe(30);
  });

  it("parses minutes and seconds", () => {
    expect(parseISO8601Duration("PT5M30S")).toBe(330);
  });

  it("parses hours, minutes, and seconds", () => {
    expect(parseISO8601Duration("PT1H30M15S")).toBe(5415);
  });

  it("parses hours only", () => {
    expect(parseISO8601Duration("PT2H")).toBe(7200);
  });

  it("parses minutes only", () => {
    expect(parseISO8601Duration("PT45M")).toBe(2700);
  });

  it("returns 0 for PT0S", () => {
    expect(parseISO8601Duration("PT0S")).toBe(0);
  });

  it("returns 0 for invalid format", () => {
    expect(parseISO8601Duration("invalid")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(parseISO8601Duration("")).toBe(0);
  });
});
