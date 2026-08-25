import { useState, useEffect } from "react";
import { trackSearch } from "../lib/analytics";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiUser,
  FiArrowUp,
  FiArrowLeft,
  FiTag,
} from "react-icons/fi";
import Button from "../components/ui/Button";
import Reveal, { Stagger, StaggerItem } from "../components/ui/Reveal";
import {
  useBlogPosts,
  useBlogCategories,
  useRecentPosts,
  usePopularTags,
  useBlogPost,
} from "../hooks/useBlog";
import { useSiteSettings } from "../hooks/useSupabase";

function Hero({
  search,
  onSearchChange,
  onSearch,
  heroImage,
  heading,
  subheading,
}) {
  const searchBar = (
    <div className="max-w-xl mx-auto flex flex-row items-center gap-0 shadow-sm rounded-xl w-full">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles..."
          onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
          className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 rounded-l-xl bg-white text-dark-navy text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-orange border border-gray-300 border-r-0"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="bg-brand-orange text-white px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-r-xl font-semibold hover:bg-brand-orange/90 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer text-sm sm:text-base"
      >
        <span>Search</span>
        <FiArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-[1900px] mx-auto">
      {/* MOBILE VIEW ONLY (< 640px) */}
      <div className="block sm:hidden">
        <Reveal
          variant="fadeIn"
          className="relative w-full h-[220px] overflow-hidden"
        >
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-dark-navy" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 z-10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 z-20">
            <h1 className="text-xl font-extrabold text-white leading-snug mb-1">
              {heading || "Latest Articles & News"}
            </h1>
            <p className="text-xs !text-white max-w-xs leading-relaxed mb-3">
              {subheading ||
                "Insights, tutorials, and stories from the Marvel Slice team"}
            </p>
            <div className="w-full px-2">{searchBar}</div>
          </div>
        </Reveal>
      </div>

      {/* DESKTOP VIEW ONLY (>= 640px) */}
      <section className="hidden sm:flex relative text-white overflow-hidden w-full max-w-[1900px] mx-auto sm:h-[360px] lg:h-[400px] items-center justify-center">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-dark-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30 z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-center text-center relative z-20 w-full py-0">
          <Reveal>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
              {heading || "Latest Articles & News"}
            </h1>
            <p className="mt-3 text-base sm:text-lg !text-white max-w-2xl mx-auto leading-relaxed">
              {subheading ||
                "Insights, tutorials, and stories from the Marvel Slice team"}
            </p>
          </Reveal>
          <div className="mt-8 w-full max-w-xl mx-auto">{searchBar}</div>
        </div>
      </section>
    </div>
  );
}

function CategoryPills({ categories, active, onChange }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
        <Button
          onClick={() => onChange(null)}
          variant={!active ? "pill-orange" : "pill"}
          size="sm"
          shape="pill"
          className="whitespace-nowrap shrink-0"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            onClick={() => onChange(cat.slug)}
            variant={active === cat.slug ? "pill-orange" : "pill"}
            size="sm"
            shape="pill"
            className="whitespace-nowrap shrink-0"
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function FeaturedPost({ post }) {
  return (
    <Reveal>
      <Link
        to={`/blog/${post.slug}`}
        className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
      >
        <div className="grid md:grid-cols-2">
          <div className="h-64 md:h-full bg-gradient-to-br from-brand-blue to-dark-navy flex items-center justify-center">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white/20 text-6xl font-bold">B</span>
            )}
          </div>
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            {post.blog_categories && (
              <span className="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full mb-4 w-fit">
                {post.blog_categories.name}
              </span>
            )}
            <h2 className="text-2xl lg:text-3xl font-bold text-dark-navy group-hover:text-brand-orange transition-colors">
              {post.title}
            </h2>
            <p className="mt-3 text-text-gray leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <FiUser className="w-4 h-4" />
                {post.author || "Admin"}
              </span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4" />
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>
            <span className="mt-6 text-brand-orange font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
              Read More <FiArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function PostCard({ post }) {
  return (
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
        <p className="mt-2 text-sm text-text-gray line-clamp-4 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <FiCalendar className="w-3.5 h-3.5" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          <span className="text-sm text-brand-orange font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read More <FiArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  // Windowed page list so it never overflows on mobile: first, last, current +/- 1, with ellipses.
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 text-text-gray hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="w-8 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-text-gray text-sm"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-brand-orange text-white shadow-md"
                : "border border-gray-200 text-text-gray hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-gray-200 text-text-gray hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function RecentPostsWidget({ posts }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
        <h3 className="font-bold text-dark-navy text-base sm:text-lg flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-brand-orange" />
          Recent Posts
        </h3>
        <span className="text-xs font-semibold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-full">
          Latest
        </span>
      </div>

      <div className="divide-y divide-gray-200">
        {posts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="group flex items-center gap-3 py-3.5 first:pt-2 last:pb-0 hover:bg-slate-50/80 rounded-xl px-1 sm:px-2 transition-colors duration-200"
          >
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-gray-200 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-100">
                <FiCalendar className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {post.blog_categories?.name && (
                <span className="text-[11px] font-semibold text-brand-orange block mb-0.5">
                  {post.blog_categories.name}
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h4>
              {post.published_at && (
                <p className="text-[11px] sm:text-xs !text-slate-400 mt-1 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3 text-slate-400" />
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
            <FiChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-orange group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">
            No recent posts available.
          </p>
        )}
      </div>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setError("");
    const { supabase } = await import("../lib/supabaseClient");
    const { error: err } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });
    if (err) {
      if (err.code === "23505") {
        setError("This email is already subscribed.");
      } else {
        setError("Failed to subscribe. Please try again.");
      }
      return;
    }
    setSubscribed(true);
    setEmail("");
  }
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg mb-2 text-gray-900">Newsletter</h3>
      {subscribed ? (
        <p className="text-green-400 text-sm font-medium">
          Thanks for subscribing!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white text-dark-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 border border-gray-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            shape="md"
            className="w-full"
          >
            Subscribe <FiArrowRight className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

function PopularTags({ tags, activeTag, onTagClick }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-dark-navy text-lg mb-4">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onTagClick?.(tag.name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${
              activeTag === tag.name
                ? "bg-brand-orange text-white border-gray-300"
                : "bg-white text-text-gray border-gray-300 hover:bg-brand-orange/10 hover:text-brand-orange"
            }`}
          >
            {tag.name}
          </button>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-gray-400">No tags yet.</p>
        )}
      </div>
    </div>
  );
}

function SinglePost({ slug }) {
  const { data: post, isLoading } = useBlogPost(slug);

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-dark-navy mb-4">
          Post not found
        </h1>
        <Link to="/blog" className="text-brand-orange hover:underline">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-12 sm:pt-6 sm:pb-12">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-text-gray hover:text-brand-orange mb-3 sm:mb-4 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Blog
      </Link>
      <Reveal>
        {post.blog_categories && (
          <span className="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange text-xs font-semibold rounded-full mb-4">
            {post.blog_categories.name}
          </span>
        )}
        <h1 className="text-3xl lg:text-4xl font-extrabold text-dark-navy leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <FiUser className="w-4 h-4" />
            {post.author || "Admin"}
          </span>
          <span className="flex items-center gap-1.5">
            <FiCalendar className="w-4 h-4" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : ""}
          </span>
        </div>
      </Reveal>
      <Reveal>
        {post.image_url && (
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-[500px] object-cover rounded-2xl mt-8 shadow-sm border border-gray-100"
          />
        )}
        {post.excerpt && (
          <p className="text-lg text-text-gray mt-8 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="mt-8 text-text-gray text-base leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </Reveal>

      {post.tags && post.tags.length > 0 && (
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/blog?tag=${tag.name}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-text-gray rounded-full text-sm hover:bg-brand-orange/10 hover:text-brand-orange transition-colors"
              >
                <FiTag className="w-3 h-3" />
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Blog() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tag = searchParams.get("tag") || null;
  const category = searchParams.get("category") || null;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (search && page !== 1) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  }, [search]);

  const { data: settings } = useSiteSettings();
  const perPage = page === 1 ? 5 : 6;
  const { data: postsData, isLoading } = useBlogPosts({
    category,
    tag,
    search,
    page,
    perPage,
  });
  const { data: categories } = useBlogCategories();
  const { data: recentPosts } = useRecentPosts(3);
  const { data: popularTags } = usePopularTags();

  if (slug) {
    return <SinglePost slug={slug} />;
  }

  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;

  const isAllPage = !category && !tag && page === 1 && !search.trim();
  const featured = isAllPage
    ? posts.find((p) => p.is_featured) || posts[0]
    : null;
  const gridPosts = featured
    ? posts.filter((p) => p.id !== featured.id)
    : posts;

  function handleSearch() {
    if (search.trim()) trackSearch(search.trim());
    setSearchParams({});
  }

  function handlePageChange(p) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  }

  return (
    <div>
      <Hero
        key={
          [
            settings?.blog_hero_image,
            settings?.blog_heading,
            settings?.blog_subheading,
          ]
            .filter(Boolean)
            .join("|") || "default"
        }
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        heroImage={settings?.blog_hero_image}
        heading={settings?.blog_heading}
        subheading={settings?.blog_subheading}
      />
      <CategoryPills
        categories={categories || []}
        active={category}
        onChange={(slug) => {
          const next = new URLSearchParams();
          if (slug) next.set("category", slug);
          setSearchParams(next);
        }}
      />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-text-gray">
            <p className="text-lg">No articles found.</p>
          </div>
        ) : (
          <div>
            {/* MOBILE VIEW ONLY: Recent Posts at Top (Shown only when 'All' category is active) */}
            {!category && (
              <div className="block lg:hidden mb-6">
                <RecentPostsWidget posts={recentPosts || []} />
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
              <div className="lg:w-[70%] space-y-6 sm:space-y-8">
                {isAllPage && featured && <FeaturedPost post={featured} />}
                <Stagger
                  key={`${category || "all"}-${tag || "all"}-${search}-${page}`}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {gridPosts.map((post) => (
                    <StaggerItem key={post.id} className="h-full">
                      <PostCard post={post} />
                    </StaggerItem>
                  ))}
                </Stagger>
                <Pagination
                  page={page}
                  total={total}
                  perPage={perPage}
                  onChange={handlePageChange}
                />
              </div>
              <Reveal
                variant="left"
                as="aside"
                className="lg:w-[30%] space-y-6"
              >
                <div className="hidden lg:block">
                  <RecentPostsWidget posts={recentPosts || []} />
                </div>
                <NewsletterForm />
                <PopularTags
                  tags={popularTags || []}
                  activeTag={tag}
                  onTagClick={(t) => {
                    const next = new URLSearchParams(searchParams);
                    if (t === tag) next.delete("tag");
                    else next.set("tag", t);
                    next.delete("category");
                    next.delete("page");
                    setSearchParams(next);
                  }}
                />
              </Reveal>
            </div>
          </div>
        )}
      </section>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-6 w-10 h-10 sm:w-10 sm:h-10 bg-brand-blue text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50 cursor-pointer"
      >
        <FiArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
