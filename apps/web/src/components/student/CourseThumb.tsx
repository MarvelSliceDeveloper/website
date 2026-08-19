"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { getCourseIconUrl, isUsableThumbnail } from "@/lib/course-icons";

interface CourseThumbProps {
  title: string;
  thumbnail?: string | null;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  imageClassName?: string;
  iconClassName?: string;
  fallback?: ReactNode;
  forceIcon?: boolean;
}

/**
 * Dashboard course display thumbnail.
 * - Usable thumbnail URL -> renders it (next/image)
 * - Otherwise -> renders a Devicon tech icon matched from the course title
 * - No icon match -> renders the supplied `fallback` (or nothing)
 * - `forceIcon: true` -> always render the Devicon icon, never the thumbnail
 * The course thumbnail itself is never modified — this is display-only.
 */
export default function CourseThumb({
  title,
  thumbnail,
  alt = "",
  fill = false,
  width = 48,
  height = 48,
  imageClassName = "object-cover",
  iconClassName = "h-1/2 w-1/2 object-contain",
  fallback = null,
  forceIcon = false,
}: CourseThumbProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const iconUrl = getCourseIconUrl(title);

  if (!forceIcon && isUsableThumbnail(thumbnail) && !thumbFailed) {
    const imgProps = {
      src: thumbnail as string,
      unoptimized: true,
      className: imageClassName,
      onError: () => setThumbFailed(true),
    };
    return fill ? (
      <Image {...imgProps} fill alt={alt} />
    ) : (
      <Image {...imgProps} width={width} height={height} alt={alt} />
    );
  }

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconUrl} alt={alt} className={iconClassName} loading="lazy" />
    );
  }

  return <>{fallback}</>;
}
