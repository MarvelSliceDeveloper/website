// ──────────────────────────────────────────────────────────────────────────────
// Course icon lookup — Devicon (https://devicon.dev/)
// Used ONLY for dashboard course display: when a course has no usable
// thumbnail we render a technology icon matched from the course title.
// The course thumbnail itself is never replaced.
// ──────────────────────────────────────────────────────────────────────────────

const DEVCON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

type IconEntry = { keywords: string[]; icon: string };

// Order matters: more specific terms first so e.g. "NumPy" wins over "Python".
const ICON_MAP: IconEntry[] = [
  { keywords: ["numpy"], icon: "numpy/numpy-original" },
  { keywords: ["pandas"], icon: "pandas/pandas-original" },
  { keywords: ["matplotlib"], icon: "matplotlib/matplotlib-original" },
  { keywords: ["data visualization"], icon: "matplotlib/matplotlib-original" },
  { keywords: ["tensorflow"], icon: "tensorflow/tensorflow-original" },
  { keywords: ["scikit", "sklearn"], icon: "scikitlearn/scikitlearn-original" },
  { keywords: ["machine learning"], icon: "tensorflow/tensorflow-original" },
  { keywords: ["jupyter"], icon: "jupyter/jupyter-original" },
  { keywords: ["postgres"], icon: "postgresql/postgresql-original" },
  { keywords: ["mysql"], icon: "mysql/mysql-original" },
  { keywords: ["sqlite"], icon: "sqlite/sqlite-original" },
  { keywords: ["sql"], icon: "postgresql/postgresql-original" },
  { keywords: ["anaconda"], icon: "anaconda/anaconda-original" },
  { keywords: ["react"], icon: "react/react-original" },
  { keywords: ["node"], icon: "nodejs/nodejs-original" },
  { keywords: ["typescript"], icon: "typescript/typescript-original" },
  { keywords: ["javascript"], icon: "javascript/javascript-original" },
  { keywords: ["html"], icon: "html5/html5-original" },
  { keywords: ["css"], icon: "css3/css3-original" },
  { keywords: ["github"], icon: "github/github-original" },
  { keywords: ["git"], icon: "git/git-original" },
  { keywords: ["docker"], icon: "docker/docker-original" },
  { keywords: ["linux"], icon: "linux/linux-original" },
  { keywords: ["python"], icon: "python/python-original" },
];

/** Standalone "R" (e.g. "R Programming") — avoids matching the letter inside words. */
const R_ENTRY: IconEntry = { keywords: [], icon: "r/r-original" };

/**
 * Best-effort Devicon icon URL for a course title.
 * Returns null when no keyword matches so the caller can render its own
 * fallback (e.g. IconBook / emoji).
 */
export function getCourseIconUrl(title: string): string | null {
  const t = title.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some((k) => t.includes(k))) {
      return `${DEVCON_BASE}/${entry.icon}.svg`;
    }
  }
  if (/(^|\s)r($|\s)/.test(t)) {
    return `${DEVCON_BASE}/${R_ENTRY.icon}.svg`;
  }
  return null;
}

/**
 * True when the value looks like a usable image URL (local path or http(s)).
 * Empty strings, placeholders, and free-text values are treated as missing.
 */
export function isUsableThumbnail(thumb: string | null | undefined): boolean {
  return !!thumb && (thumb.startsWith("/") || thumb.startsWith("http"));
}
