import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import Reveal from "../components/ui/Reveal";

function alignClass(align) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export default function LegalPage({ pageKey }) {
  const { data, isLoading } = useQuery({
    queryKey: ["legal-page", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_pages")
        .select("*")
        .eq("page_key", pageKey)
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!pageKey,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = Array.isArray(data?.sections) ? data.sections : [];

  if (!data || (!data.title && !data.intro && sections.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-dark-navy mb-4">Coming Soon</h1>
        <p className="!text-text-gray mb-8">
          This page is being prepared and will be available shortly.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-orange hover:underline"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Reveal className="mb-10 sm:mb-12">
        {data.title && (
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-navy mb-4">
            {data.title}
          </h1>
        )}
        {data.intro && (
          <p className="!text-text-gray text-base sm:text-lg">{data.intro}</p>
        )}
      </Reveal>

      {sections.map((section, i) => (
        <Reveal key={section.id || i} className="mb-8 sm:mb-10">
          {section.heading && (
            <h2
              className={`text-xl sm:text-2xl font-bold text-dark-navy mb-3 ${alignClass(section.heading_align)}`}
            >
              {section.heading}
            </h2>
          )}
          {section.body && (
            <div
              className={`whitespace-pre-line text-base leading-relaxed !text-text-gray ${alignClass(section.body_align)}`}
            >
              {section.body}
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
}
