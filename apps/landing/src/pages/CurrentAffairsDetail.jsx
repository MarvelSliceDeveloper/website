import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiGlobe,
  FiExternalLink,
  FiLoader,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { formatDetailedContent } from '../lib/rssService';
import { deduplicateCurrentAffairs } from '../data/defaultCurrentAffairs';
import Reveal from '../components/ui/Reveal';

export default function CurrentAffairsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Query article by ID from Supabase
  const { data: dbArticle, isLoading } = useQuery({
    queryKey: ['current_affairs_article_detail', id],
    queryFn: async () => {
      if (!id) return null;

      // Check if id is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { data, error } = await supabase
          .from('current_affairs')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      }

      // If not UUID or not found in DB table directly, try matching by source_url encode
      const { data: allData } = await supabase
        .from('current_affairs')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);

      if (allData) {
        const match = allData.find((art) => art.id === id || encodeURIComponent(art.source_url) === id);
        if (match) return match;
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Query related articles for bottom navigation
  const { data: relatedArticles } = useQuery({
    queryKey: ['related_current_affairs', dbArticle?.category],
    queryFn: async () => {
      const { data } = await supabase
        .from('current_affairs')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(20);

      const unique = deduplicateCurrentAffairs(data || []);
      return unique.filter((art) => art.id !== id && art.title !== dbArticle?.title).slice(0, 3);
    },
    enabled: !!dbArticle,
    staleTime: 5 * 60 * 1000,
  });

  const articleText = useMemo(() => {
    if (!dbArticle) return '';
    if (dbArticle.content && dbArticle.content.length > 120 && !dbArticle.content.includes('• Key Takeaway for Competitive Exams:')) {
      return dbArticle.content;
    }
    return formatDetailedContent(
      dbArticle.title,
      dbArticle.summary,
      dbArticle.category,
      dbArticle.source,
      dbArticle.published_at
    );
  }, [dbArticle]);

  function formatDate(isoStr) {
    if (!isoStr) return 'Recent';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  }

  function handleBackNavigation(e) {
    if (e) e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/current-affairs');
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen py-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <FiLoader className="w-10 h-10 animate-spin text-brand-blue mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading Current Affairs Article...</p>
        </div>
      </div>
    );
  }

  if (!dbArticle) {
    return (
      <div className="bg-white min-h-screen py-20 px-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <FiGlobe className="w-12 h-12 text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-dark-navy">Article Not Found</h1>
          <p className="text-xs text-slate-600">
            The requested article could not be located or may have been updated.
          </p>
          <Link
            to="/current-affairs"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Current Affairs</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <main className="py-8 sm:py-12 bg-white">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* TOP LEFT BACK BUTTON */}
          <button
            type="button"
            onClick={handleBackNavigation}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors cursor-pointer group mb-2"
          >
            <FiArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-orange transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          {/* HEADING TOP, DATE / CATEGORY / SOURCE BELOW */}
          <header className="space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-navy leading-tight tracking-tight">
              {dbArticle.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <FiCalendar className="w-3.5 h-3.5 text-brand-blue" />
                <span>{formatDate(dbArticle.published_at)}</span>
              </div>

              <span className="text-slate-300">•</span>

              <span className="px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-200/80">
                {dbArticle.category || 'General'}
              </span>

              <span className="text-slate-300">•</span>

              <span className="text-slate-700 font-semibold">Source: {dbArticle.source || 'Official News'}</span>
            </div>
          </header>

          {/* ARTICLE CONTENT SECTION */}
          <Reveal variant="up">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-8">
              {/* Full Article Content */}
              <div className="text-slate-900 text-base sm:text-lg leading-relaxed font-normal whitespace-pre-wrap space-y-4">
                {articleText}
              </div>

              {/* ACTION CARD & SOURCE LINK */}
              {dbArticle.source_url && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 to-slate-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-dark-navy">Read Original Article</h4>
                    <p className="text-xs text-slate-600">
                      View the complete original coverage directly on {dbArticle.source || 'publisher site'}.
                    </p>
                  </div>

                  <a
                    href={dbArticle.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                  >
                    <span>Visit {dbArticle.source || 'Original Source'}</span>
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* FORMAL MINIMAL SOURCE ATTRIBUTION */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  Source: {dbArticle.source || 'Original News Publisher'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Content aggregated via public RSS feeds for educational & competitive exam preparation. Copyright belongs to {dbArticle.source || 'original publisher'}.
                </p>
              </div>
            </div>
          </Reveal>

          {/* RELATED ARTICLES CAROUSEL/GRID */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-dark-navy">
                  More Current Affairs Updates
                </h3>
                <Link
                  to="/current-affairs"
                  className="text-xs font-bold text-brand-orange hover:text-orange-600 inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {relatedArticles.map((rel) => (
                  <motion.div
                    key={rel.id || rel.source_url}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E5ECF5] hover:border-brand-orange/40 rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 text-brand-blue border border-blue-200">
                        {rel.category || 'General'}
                      </span>
                      <h4 className="text-xs font-bold text-dark-navy leading-snug line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>

                    <Link
                      to={`/current-affairs/${rel.id || encodeURIComponent(rel.source_url)}`}
                      className="mt-4 text-xs font-bold text-brand-orange hover:text-orange-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Article</span>
                      <FiArrowRight className="w-3 h-3" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
