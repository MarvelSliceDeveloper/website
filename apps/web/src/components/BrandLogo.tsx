import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BrandLogo({
  size = "md",
  className = "",
}: BrandLogoProps) {
  const sizes = {
    sm: { box: "h-10 w-10", img: "h-8 w-auto", text: "text-xl" },
    md: { box: "h-12 w-12", img: "h-10 w-auto", text: "text-2xl" },
    lg: { box: "h-14 w-14", img: "h-12 w-auto", text: "text-3xl" },
  };
  const s = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/logo.svg"
        alt="Marvel Slice"
        width={48}
        height={48}
        className={`${s.img} object-contain shrink-0`}
      />
      <span className={`${s.text} font-extrabold tracking-tight`}>
        <span className="text-foreground">Marvel</span>{" "}
        <span className="text-primary">Slice</span>
      </span>
    </Link>
  );
}
