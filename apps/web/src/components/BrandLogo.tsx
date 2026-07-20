import Link from "next/link";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const sizes = {
    sm: { box: "h-8 w-8", img: "h-5 w-auto", text: "text-lg" },
    md: { box: "h-10 w-10", img: "h-6 w-auto", text: "text-xl" },
    lg: { box: "h-12 w-12", img: "h-7 w-auto", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${s.box} flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/10`}>
        <img
          src="/images/logo.svg"
          alt="Marvel Slice"
          className={`${s.img} object-contain`}
        />
      </div>
      <span className={`${s.text} font-extrabold tracking-tight`}>
        <span className="text-primary">Marvel</span>{" "}
        <span className="text-primary/70">Slice</span>
      </span>
    </Link>
  );
}
