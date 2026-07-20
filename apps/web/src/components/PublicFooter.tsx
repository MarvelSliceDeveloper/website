import Link from "next/link";
import BrandLogo from "./BrandLogo";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between">
        <BrandLogo size="sm" />
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/pages/about" className="transition-colors hover:text-foreground">
            About Us
          </Link>
          <span className="text-border">·</span>
          <Link href="/pages/terms" className="transition-colors hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          <span className="text-border">·</span>
          <Link href="/pages/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Marvel Slice. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
