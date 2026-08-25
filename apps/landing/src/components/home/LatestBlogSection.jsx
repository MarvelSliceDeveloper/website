import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import Reveal, { Stagger, StaggerItem } from "../ui/Reveal";
import { useRecentPosts } from "../../hooks/useBlog";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LatestBlogSection({ section }) {
  const { data: posts, isLoading } = useRecentPosts(3);

  const content = section?.content || {};
  const heading = content.heading || section?.heading || "Latest Blog";
  const subheading = content.subheading || section?.subheading || "";
  const linkText = content.link_text || "View All Posts";

  if (isLoading) return null;
  if (!posts || posts.length === 0) return null;

  return (
    <section className="pt-8 pb-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
            <div className="text-center sm:text-left">
              <div className="inline-flex flex-col items-center sm:items-start">
                <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                  {heading}
                </h2>
                <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
              </div>
              {subheading && (
                <p className="text-text-gray text-base sm:text-lg leading-relaxed max-w-2xl mt-4">
                  {subheading}
                </p>
              )}
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shrink-0 pt-2.5"
            >
              {linkText} <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-6 mt-16">
          {posts.map((post) => (
            <StaggerItem key={post.id} className="h-full">
              <Link
                to={`/blog/${post.slug}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-brand-blue to-dark-navy flex items-center justify-center overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <FiCalendar className="w-12 h-12 text-white/20" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  {post.blog_categories && (
                    <span className="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full mb-3 w-fit">
                      {post.blog_categories.name}
                    </span>
                  )}
                  <h3 className="font-bold text-dark-navy text-lg group-hover:text-brand-orange transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-text-gray line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" />
                      {formatDate(post.published_at)}
                    </span>
                    <span className="text-sm text-brand-orange font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <FiArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
