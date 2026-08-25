import { useState } from "react";
import {
  FiCheckCircle,
  FiMapPin,
  FiPhone,
  FiMail,
  FiBriefcase,
} from "react-icons/fi";
import * as LuIcons from "react-icons/lu";
import Button from "./Button";
import Card from "./Card";
import AccordionItem from "./AccordionItem";
import Reveal, { Stagger, StaggerItem } from "./Reveal";
import ContactSection from "./ContactSection";
import AnimatedNumber from "./AnimatedNumber";

function safeParse(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  if (val && typeof val === "object" && !Array.isArray(val)) return [val];
  return [];
}

function safeString(val) {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") return String(val);
  return val || "";
}

function DynamicIcon({ name, className }) {
  if (!name) return null;
  const IconComp = LuIcons[`Lu${name}`];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}

function FaqListSection({ section }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Reveal className="w-full mx-auto">
      {section.heading && (
        <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">
          {section.heading}
        </h2>
      )}
      <div className="space-y-2">
        {(section.items || []).map((faq, i) => (
          <AccordionItem
            key={i}
            title={faq.question}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          >
            {faq.answer}
          </AccordionItem>
        ))}
      </div>
    </Reveal>
  );
}

export default function SectionRenderer({ section, className }) {
  switch (section.section_type) {
    case "text": {
      const parsed = safeParse(section.content);
      const blocks =
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        typeof parsed[0] === "object"
          ? parsed
          : null;
      const ha = section.headingAlign || "center";
      const ca = section.contentAlign || "center";
      if (blocks) {
        const contentBlocks = blocks.map((b, i) =>
          b.type === "heading" ? (
            <h2
              key={i}
              className={`text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-${ha}`}
            >
              {b.text}
            </h2>
          ) : (
            <div
              key={i}
              className={`text-gray-700 text-base leading-relaxed text-${ca} ${section.image_url ? "mb-4" : ""}`}
            >
              {b.text}
            </div>
          ),
        );
        if (section.image_url) {
          const heading = blocks.find((b) => b.type === "heading")?.text || "";
          const paragraphs = blocks.filter((b) => b.type === "paragraph");
          return (
            <Reveal className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {heading && (
                <div className="mb-10">
                  <h2 className="text-3xl sm:text-4xl font-bold text-blue-700 text-center">
                    {heading}
                  </h2>
                  <div className="w-16 h-1 bg-brand-orange mt-3 mx-auto" />
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className="space-y-4">
                  {paragraphs.map((b, i) => (
                    <div
                      key={i}
                      className="text-gray-700 text-base leading-relaxed text-left"
                    >
                      {b.text}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <img
                    src={section.image_url}
                    alt={heading}
                    className="w-full max-w-[500px] aspect-square object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </Reveal>
          );
        }
        return (
          <Reveal className="py-16 max-w-4xl mx-auto">{contentBlocks}</Reveal>
        );
      }
      const paragraphs = safeParse(section.content);
      const content =
        Array.isArray(paragraphs) && paragraphs.length > 0
          ? paragraphs.join("\n\n")
          : safeString(section.content);
      return (
        <Reveal className={`py-16 max-w-4xl mx-auto text-${ca}`}>
          {section.heading && (
            <h2
              className={`text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-${ha}`}
            >
              {section.heading}
            </h2>
          )}
          {content && (
            <div className="text-gray-700 text-base leading-relaxed">
              {content}
            </div>
          )}
        </Reveal>
      );
    }
    case "text_stats": {
      const paragraphs = safeParse(section.content);
      const content =
        Array.isArray(paragraphs) && paragraphs.length > 0
          ? paragraphs.join("\n\n")
          : safeString(section.content);
      const items = safeParse(section.items);
      const ha = section.headingAlign || "center";
      const ca = section.contentAlign || "center";
      const statIcons = [
        "LuGraduationCap",
        "LuBookOpen",
        "LuUsers",
        "LuAward",
        "LuTarget",
        "LuTrendingUp",
        "LuGlobe",
        "LuHeartHandshake",
      ];
      const statIconBg = [
        "bg-brand-orange/10",
        "bg-blue-100",
        "bg-emerald-100",
        "bg-purple-100",
        "bg-pink-100",
        "bg-cyan-100",
        "bg-indigo-100",
        "bg-teal-100",
      ];
      const statIconColor = [
        "text-brand-orange",
        "text-blue-500",
        "text-emerald-500",
        "text-purple-500",
        "text-pink-500",
        "text-cyan-500",
        "text-indigo-500",
        "text-teal-500",
      ];
      const statCard = (stat, i) => (
        <div
          key={i}
          className="text-center p-4 sm:p-6 lg:p-[30px] bg-white rounded-[18px] shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-xl cursor-default"
          style={{
            boxShadow:
              "rgba(17, 17, 26, 0.08) 0px 4px 16px, rgba(17, 17, 26, 0.04) 0px 8px 32px",
          }}
        >
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${statIconBg[i % 8]} flex items-center justify-center mx-auto mb-2 sm:mb-3`}
          >
            <DynamicIcon
              name={stat.icon || statIcons[i % 8]}
              className={`w-5 h-5 sm:w-6 sm:h-6 ${statIconColor[i % 8]}`}
            />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-orange leading-none">
            <AnimatedNumber value={stat.number} />
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1.5 sm:mt-2">
            {stat.label}
          </div>
        </div>
      );
      return (
        <div className={`relative ${className || "py-[100px]"}`}>
          {section.image_url ? (
            <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-[55fr_45fr] gap-y-12 lg:gap-x-[70px] items-start">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  {section.heading && (
                    <>
                      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                        <span className="block text-blue-700">
                          {section.heading.split(" ")[0]}
                        </span>
                        <span className="block text-brand-orange">
                          {section.heading.split(" ").slice(1).join(" ")}
                        </span>
                      </h2>
                      <div className="w-20 h-1.5 bg-brand-orange mt-5 mb-[30px] lg:mb-[50px] mx-auto lg:mx-0" />
                    </>
                  )}
                  <div className="max-w-[600px] space-y-6 mx-auto lg:mx-0">
                    {content
                      .split("\n\n")
                      .filter(Boolean)
                      .map((p, i) => (
                        <p
                          key={i}
                          className="text-gray-700 text-base leading-relaxed text-center lg:text-left"
                        >
                          {p}
                        </p>
                      ))}
                  </div>
                </div>
                <div className="lg:mt-[40px] flex justify-center">
                  <img
                    src={section.image_url}
                    alt={section.heading || ""}
                    className="w-full max-w-[500px] aspect-square object-cover rounded-2xl shadow-lg"
                  />
                </div>
              </div>
              {items.length > 0 && (
                <div className="mt-[30px] sm:mt-[50px]">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {items.map((stat, i) => statCard(stat, i))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`max-w-4xl mx-auto text-${ca} mb-12`}>
                {content}
              </div>
              {items.length > 0 && (
                <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {items.map((stat, i) => statCard(stat, i))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    case "image":
      return (
        <Reveal className="max-w-4xl mx-auto text-center">
          {section.heading && (
            <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-4">
              {section.heading}
            </h2>
          )}
          {section.image_url && (
            <img
              src={section.image_url}
              alt={section.heading || ""}
              className="w-full max-h-96 object-cover rounded-xl shadow-sm"
            />
          )}
          {section.content && (
            <p className="text-text-gray text-base mt-4">{section.content}</p>
          )}
        </Reveal>
      );
    case "cards":
      return (
        <div>
          {section.heading && (
            <Reveal
              as="h2"
              className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center"
            >
              {section.heading}
            </Reveal>
          )}
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(section.content || "")
              .split("\n")
              .filter(Boolean)
              .map((item, i) => (
                <StaggerItem key={i} className="h-full">
                  <Card className="p-6">
                    {section.image_url && (
                      <img
                        src={section.image_url}
                        alt=""
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    )}
                    <p className="text-dark-navy font-medium">{item}</p>
                  </Card>
                </StaggerItem>
              ))}
          </Stagger>
        </div>
      );
    case "features":
      return (
        <div className="max-w-3xl mx-auto">
          {section.heading && (
            <Reveal
              as="h2"
              className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center"
            >
              {section.heading}
            </Reveal>
          )}
          <Stagger className="space-y-4">
            {(
              section.items ||
              (section.content || "").split("\n").filter(Boolean)
            ).map((item, i) => (
              <StaggerItem key={i} className="flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <span className="text-text-gray text-base">
                  {typeof item === "string" ? item : item.title}
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    case "stats_row": {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      const ha = section.headingAlign || "center";
      return (
        <Reveal className="py-16">
          {section.heading && (
            <h2
              className={`text-3xl sm:text-4xl font-bold text-dark-navy mb-8 text-${ha}`}
            >
              {section.heading}
            </h2>
          )}
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {items.map((stat, i) => (
              <div
                key={i}
                className="text-center p-4 sm:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-gray-300 border border-transparent cursor-default"
                style={{
                  boxShadow:
                    "rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.05) 0px 8px 32px",
                }}
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-orange">
                  <AnimatedNumber value={stat.number} />
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1.5 sm:mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      );
    }
    case "team_grid": {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      return (
        <div>
          {section.heading && (
            <Reveal
              as="h2"
              className="text-xl sm:text-2xl font-bold text-dark-navy mb-8 text-center"
            >
              {section.heading}
            </Reveal>
          )}
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {items.map((member, i) => (
              <StaggerItem key={i} className="h-full">
                <Card className="p-6 text-center h-full">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.name?.[0] || "?"
                    )}
                  </div>
                  <h3 className="font-bold text-dark-navy">{member.name}</h3>
                  <p className="text-sm text-brand-orange font-medium mt-0.5">
                    {member.role}
                  </p>
                  {member.bio && (
                    <p className="text-xs text-text-gray mt-2 line-clamp-3">
                      {member.bio}
                    </p>
                  )}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    }
    case "contact_info":
      return (
        <Reveal className="max-w-lg mx-auto">
          {section.heading && (
            <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">
              {section.heading}
            </h2>
          )}
          <div className="space-y-4">
            {section.address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <FiMapPin className="w-5 h-5 text-brand-orange" />
                </div>
                <div className="text-text-gray text-base whitespace-pre-line">
                  {section.address}
                </div>
              </div>
            )}
            {section.phone && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <FiPhone className="w-5 h-5 text-brand-orange" />
                </div>
                <a
                  href={`tel:${section.phone}`}
                  className="text-text-gray text-base hover:text-brand-orange transition-colors"
                >
                  {section.phone}
                </a>
              </div>
            )}
            {section.email && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <FiMail className="w-5 h-5 text-brand-orange" />
                </div>
                <a
                  href={`mailto:${section.email}`}
                  className="text-text-gray text-base hover:text-brand-orange transition-colors"
                >
                  {section.email}
                </a>
              </div>
            )}
          </div>
        </Reveal>
      );
    case "map_embed": {
      const raw = section.content || "";
      const match = raw.match(/src=["']([^"']+)["']/);
      const mapSrc = (match ? match[1] : raw).trim();
      if (!mapSrc) return null;
      return (
        <section
          className="relative overflow-hidden"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
        >
          {section.heading && (
            <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center max-w-7xl mx-auto px-4">
              {section.heading}
            </h2>
          )}
          <iframe
            src={mapSrc}
            className="w-full aspect-[16/9] max-h-[450px]"
            style={{ border: 0, display: "block" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map"
          />
        </section>
      );
    }
    case "faq_list":
      return <FaqListSection section={section} />;
    case "positions":
      return (
        <div>
          {section.heading && (
            <Reveal
              as="h2"
              className="text-xl sm:text-2xl font-bold text-dark-navy mb-8 text-center"
            >
              {section.heading}
            </Reveal>
          )}
          <Stagger className="max-w-4xl mx-auto space-y-4">
            {(section.items || []).map((pos, i) => (
              <StaggerItem key={i}>
                <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-dark-navy text-lg">
                      {pos.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-text-gray">
                      {pos.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5" />
                          {pos.location}
                        </span>
                      )}
                      {pos.type && (
                        <span className="flex items-center gap-1">
                          <FiBriefcase className="w-3.5 h-3.5" />
                          {pos.type}
                        </span>
                      )}
                    </div>
                    {pos.description && (
                      <p className="text-sm text-text-gray mt-3">
                        {pos.description}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    Apply Now
                  </Button>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    case "cta":
      return (
        <section
          className="relative overflow-hidden"
          style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
        >
          <div className="absolute inset-0 bg-[#0B2D6B]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #0B2D6B 0%, #1642a0 25%, #1a8a7d 65%, #2ec4b6 100%)",
              }}
            />
            <div className="absolute top-[-60px] right-[10%] w-48 h-48 rounded-full border-[3px] border-white/10" />
            <div className="absolute top-[20px] right-[5%] w-28 h-28 rounded-full border-[2px] border-white/8" />
            <div className="absolute bottom-[-40px] left-[15%] w-36 h-36 rounded-full border-[3px] border-white/10" />
            <div className="absolute bottom-[30px] left-[8%] w-20 h-20 rounded-full border-[2px] border-white/8" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div
              className="absolute top-0 left-[30%] w-[350px] h-[350px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(23,92,221,0.3) 0%, transparent 60%)",
              }}
            />
            <div
              className="absolute bottom-0 right-[20%] w-[300px] h-[300px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(46,196,182,0.25) 0%, transparent 60%)",
              }}
            />
          </div>
          <Reveal variant="scale">
            <div className="relative max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 py-16 sm:py-20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
                <div className="flex-1 text-center lg:text-left">
                  {section.heading && (
                    <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white">
                      {section.heading}
                    </h2>
                  )}
                  {section.content && (
                    <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                      {section.content}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <Button
                    to={section.cta_link || "/contact"}
                    variant="outline"
                    size="lg"
                    className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                  >
                    {section.heading || "Get in Touch"}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      );
    case "feature_grid": {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      const ha = section.headingAlign || "center";
      const sa = section.subheadingAlign || "center";
      const accentStyles = [
        {
          accent: "text-blue-600",
          underline: "bg-blue-600",
          iconBg: "bg-blue-50",
          blob: "bg-blue-100/50",
          dots: "bg-blue-200/60",
        },
        {
          accent: "text-orange-500",
          underline: "bg-orange-500",
          iconBg: "bg-orange-50",
          blob: "bg-orange-100/50",
          dots: "bg-orange-200/60",
        },
        {
          accent: "text-emerald-600",
          underline: "bg-emerald-600",
          iconBg: "bg-emerald-50",
          blob: "bg-emerald-100/50",
          dots: "bg-emerald-200/60",
        },
        {
          accent: "text-purple-600",
          underline: "bg-purple-600",
          iconBg: "bg-purple-50",
          blob: "bg-purple-100/50",
          dots: "bg-purple-200/60",
        },
        {
          accent: "text-pink-600",
          underline: "bg-pink-600",
          iconBg: "bg-pink-50",
          blob: "bg-pink-100/50",
          dots: "bg-pink-200/60",
        },
        {
          accent: "text-cyan-600",
          underline: "bg-cyan-600",
          iconBg: "bg-cyan-50",
          blob: "bg-cyan-100/50",
          dots: "bg-cyan-200/60",
        },
        {
          accent: "text-indigo-600",
          underline: "bg-indigo-600",
          iconBg: "bg-indigo-50",
          blob: "bg-indigo-100/50",
          dots: "bg-indigo-200/60",
        },
        {
          accent: "text-teal-600",
          underline: "bg-teal-600",
          iconBg: "bg-teal-50",
          blob: "bg-teal-100/50",
          dots: "bg-teal-200/60",
        },
      ];

      const splitHeading = (h) => {
        const idx = h.indexOf("Marvel Slice");
        if (idx === -1) return { before: h, highlight: null, after: "" };
        return {
          before: h.slice(0, idx),
          highlight: "Marvel Slice",
          after: h.slice(idx + "Marvel Slice".length),
        };
      };
      const headingParts = section.heading
        ? splitHeading(section.heading)
        : null;

      return (
        <div className={className || "py-16 sm:py-20"}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {section.heading && (
              <Reveal as="div" className={`mb-4 text-${ha}`}>
                <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-700 leading-tight">
                  {headingParts?.before}
                  {headingParts?.highlight && (
                    <span className="relative inline-block mx-1 text-blue-700">
                      {headingParts.highlight}
                    </span>
                  )}
                  {headingParts?.after}
                </h2>
                <div
                  className={`mt-3 h-[4px] w-14 rounded-full bg-brand-orange ${ha === "center" ? "mx-auto" : ""}`}
                />
              </Reveal>
            )}
            {section.subheading && (
              <Reveal
                as="p"
                className={`text-gray-500 text-[15px] sm:text-base max-w-2xl leading-relaxed text-${sa} ${sa === "center" ? "mx-auto" : ""}`}
              >
                {section.subheading}
              </Reveal>
            )}
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mt-12 sm:mt-14">
              {items.map((item, i) => {
                const s = accentStyles[i % accentStyles.length];
                return (
                  <StaggerItem key={i} className="h-full">
                    <div className="group relative h-full overflow-hidden rounded-[20px] border border-gray-100 bg-white px-6 sm:px-7 py-6 sm:py-7 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_10px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.11)]">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-full mx-auto bg-white transition-transform duration-300 group-hover:scale-105"
                        style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}
                      >
                        {item.icon ? (
                          <DynamicIcon
                            name={item.icon}
                            className={`h-7 w-7 ${s.accent}`}
                          />
                        ) : (
                          <FiBriefcase className={`h-7 w-7 ${s.accent}`} />
                        )}
                      </div>
                      <h3 className="mt-5 text-[18px] font-bold leading-snug text-gray-900 text-center">
                        {item.title}
                      </h3>
                      <div
                        className={`mt-2.5 h-[3px] w-8 rounded-full mx-auto ${s.underline} transition-all duration-300 group-hover:w-11`}
                      />
                      <p className="mt-3.5 text-[14px] leading-relaxed text-gray-500 text-center">
                        {item.description}
                      </p>
                      <div
                        className={`absolute -bottom-10 -right-10 h-28 w-28 rounded-full ${s.blob} opacity-60 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none`}
                      />
                      <div className="absolute bottom-4 right-5 grid grid-cols-3 gap-1 opacity-50 pointer-events-none">
                        {Array.from({ length: 9 }).map((_, d) => (
                          <span
                            key={d}
                            className={`h-1 w-1 rounded-full ${s.dots}`}
                          />
                        ))}
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </div>
      );
    }
    case "content_media_list": {
      const listItems = safeParse(section.list_items);
      return (
        <Reveal>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center md:text-left">
              {section.heading && (
                <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-4 text-center md:text-left">
                  {section.heading}
                </h2>
              )}
              {section.content && (
                <p className="text-text-gray text-base leading-relaxed mb-4 text-center md:text-left">
                  {section.content}
                </p>
              )}
              {listItems.length > 0 && (
                <ul className="space-y-2 text-left">
                  {listItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FiCheckCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                      <span className="text-text-gray">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {section.image_url && (
              <div className="flex justify-center">
                <img
                  src={section.image_url}
                  alt={section.heading || ""}
                  className="w-full max-w-md rounded-xl shadow-sm border border-gray-100"
                />
              </div>
            )}
          </div>
        </Reveal>
      );
    }
    case "contact_form":
      return <ContactSection section={section} />;
    default:
      return null;
  }
}
