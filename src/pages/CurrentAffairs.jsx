import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowRight,
  FiX,
  FiLoader,
  FiSearch,
  FiCalendar,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilter,
  FiTag,
  FiTrendingUp,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import { supabase } from '../lib/supabaseClient';
import { deduplicateCurrentAffairs } from '../data/defaultCurrentAffairs';

const ITEMS_PER_PAGE = 9;

const CATEGORIES = [
  'All Topics',
  'Banking & RBI',
  'Economy & Business',
  'Government Schemes',
  'National Affairs',
  'International Affairs',
  'Science & Defense',
  'Sports & Awards',
];

// Helper to assign uniform card styles for clean compact grid alignment
function getCardStyle(index) {
  const isLatest = index === 0;
  return {
    cardClass: isLatest
      ? 'bg-gradient-to-br from-amber-50/60 via-white to-orange-50/20 border-2 border-amber-300/80 shadow-xs hover:shadow-md hover:border-brand-orange'
      : 'bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-brand-blue/40',
    isLatest,
    badgeStyle: 'bg-blue-50 text-brand-blue border border-blue-200/80 font-bold',
  };
}

function UnevenArticleCard({ article, index }) {
  if (!article) return null;
  const style = getCardStyle(index);
  const articleLink = `/current-affairs/${article.id || encodeURIComponent(article.source_url)}`;
  const dateStr = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recent Update';

  return (
    <div className="col-span-1 h-full">
      <Link
        to={articleLink}
        className={`block rounded-2xl border p-5 transition-all duration-300 group flex flex-col justify-between h-full ${style.cardClass}`}
      >
        <div className="space-y-2.5">
          {/* Top Metadata Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {style.isLatest && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-brand-orange text-white flex items-center gap-1 shadow-xs">
                  <FiTrendingUp className="w-3 h-3 text-white" />
                  <span>Latest</span>
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${style.badgeStyle}`}>
                {article.category || 'General'}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <FiCalendar className="w-3 h-3 text-slate-400" />
              {dateStr}
            </span>
          </div>

          {/* Headline Title */}
          <h3 className="text-sm sm:text-base font-bold text-dark-navy group-hover:text-brand-orange transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>

          {/* Excerpt / Summary */}
          {article.summary && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              {article.summary}
            </p>
          )}
        </div>

        {/* Footer Row */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-slate-400 truncate max-w-[160px] text-[11px]">
            Source: {article.source || 'Official News'}
          </span>
          <span className="font-bold flex items-center gap-1 group-hover:gap-2 transition-all shrink-0 text-brand-orange">
            <span>Read Article</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function CurrentAffairs({ isTodayOnly = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramFilter = searchParams.get('filter');
  const paramDate = searchParams.get('date');

  const [filterMode, setFilterMode] = useState(() => {
    if (isTodayOnly || paramFilter === 'today') return 'today';
    if (paramDate) return 'date';
    return 'all';
  });

  const [selectedDate, setSelectedDate] = useState(() => paramDate || new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (paramFilter === 'today') {
      setFilterMode('today');
    } else if (paramDate) {
      setFilterMode('date');
      setSelectedDate(paramDate);
    } else if (!isTodayOnly && !paramFilter && !paramDate) {
      setFilterMode('all');
    }
  }, [paramFilter, paramDate, isTodayOnly]);

  const { data: dbArticles, isLoading: isDbLoading } = useQuery({
    queryKey: ['current_affairs_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('current_affairs')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('Supabase current_affairs query note:', error.message);
        return [];
      }
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const articles = useMemo(() => {
    return deduplicateCurrentAffairs(dbArticles || []);
  }, [dbArticles]);

  const top5Latest = useMemo(() => {
    return articles.slice(0, 5);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return articles.filter((art) => {
      let matchesTime = true;
      const artDateStr = art.published_at ? new Date(art.published_at).toISOString().split('T')[0] : '';

      if (filterMode === 'today') {
        matchesTime = artDateStr === todayStr;
      } else if (filterMode === 'date' && selectedDate) {
        matchesTime = artDateStr === selectedDate;
      }

      const matchesCategory =
        activeCategory === 'All Topics' ||
        art.category?.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTime && matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery, filterMode, selectedDate]);

  const displayedArticles = useMemo(() => {
    if (filterMode === 'today' && filteredArticles.length === 0 && !searchQuery) {
      return articles;
    }
    return filteredArticles;
  }, [filteredArticles, filterMode, articles, searchQuery]);

  const totalPages = Math.ceil(displayedArticles.length / ITEMS_PER_PAGE) || 1;

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayedArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedArticles, currentPage]);

  function handleFilterAll() {
    setFilterMode('all');
    setSearchParams({}, { replace: true });
    setCurrentPage(1);
  }

  function handleFilterToday() {
    setFilterMode('today');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSearchParams({ filter: 'today' }, { replace: true });
    setCurrentPage(1);
  }

  function handleDateChange(dateVal) {
    setSelectedDate(dateVal);
    setFilterMode('date');
    setSearchParams({ date: dateVal }, { replace: true });
    setCurrentPage(1);
  }

  function handleCategorySelect(cat) {
    setActiveCategory(cat);
    setCurrentPage(1);
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <div className="current-affairs-content">
        <section className="py-8 sm:py-12 bg-slate-50/70 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-navy tracking-tight">
                Current Affairs & Exam Notes
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Curated National & International news updates structured for competitive exam revision.
              </p>
            </div>

            {/* TOP FILTER & SEARCH CONTROL BAR */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Filter Mode Toggle Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
                    <FiFilter className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Filter:</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleFilterAll}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      filterMode === 'all'
                        ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-blue/40 hover:bg-blue-50/50'
                    }`}
                  >
                    All Current Affairs
                  </button>

                  <button
                    type="button"
                    onClick={handleFilterToday}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      filterMode === 'today'
                        ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                        : 'bg-amber-50 text-brand-orange border-amber-200 hover:bg-amber-100/80'
                    }`}
                  >
                    <FiClock className="w-4 h-4" />
                    <span>Today's Affairs</span>
                  </button>

                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <FiCalendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Search Box */}
                <div className="relative w-full md:w-72">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search articles, RBI, schemes..."
                    className="w-full pl-10 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:border-brand-blue/40 hover:text-brand-blue'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN CONTENT AREA: 2-COLUMN LAYOUT WITH RIGHT SIDEBAR FOR LATEST NEWS TODAY */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* LEFT COLUMN: MAIN BENTO FEED & PAGINATION (Spans 3 cols on lg screens) */}
              <div className="lg:col-span-3 space-y-8">
                {isDbLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <FiLoader className="w-8 h-8 animate-spin text-brand-blue mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">Loading current affairs updates...</p>
                  </div>
                ) : displayedArticles.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3 max-w-md mx-auto">
                    <FiGlobe className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-base font-bold text-dark-navy">No articles match your search or filter</h3>
                    <p className="text-xs text-slate-500">
                      Try clearing your search or switching filter modes.
                    </p>
                    <button
                      type="button"
                      onClick={handleFilterAll}
                      className="px-5 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Show All Current Affairs</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 items-stretch">
                      {paginatedArticles.map((art, idx) => (
                        <StaggerItem key={art.id || art.source_url || idx} className="h-full">
                          <UnevenArticleCard article={art} index={idx} />
                        </StaggerItem>
                      ))}
                    </Stagger>

                    {/* PAGINATION CONTROLS */}
                    {displayedArticles.length > ITEMS_PER_PAGE && (
                      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
                        <span className="text-xs text-slate-500 font-medium">
                          Showing <span className="font-bold text-dark-navy">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                          <span className="font-bold text-dark-navy">{Math.min(currentPage * ITEMS_PER_PAGE, displayedArticles.length)}</span> of{' '}
                          <span className="font-bold text-dark-navy">{displayedArticles.length}</span> articles
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-blue/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <FiChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          {getPageNumbers(currentPage, totalPages).map((p, i) =>
                            p === '...' ? (
                              <span key={`ellipsis-${i}`} className="px-2 text-xs font-bold text-slate-400">
                                ...
                              </span>
                            ) : (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  currentPage === p
                                    ? 'bg-brand-blue text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-blue/40'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}

                          <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-brand-blue/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <span>Next</span>
                            <FiChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: SIDEBAR - LATEST NEWS TODAY (ONLY HEADINGS) */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-sm sm:text-base font-extrabold text-dark-navy flex items-center gap-2">
                      <FiTrendingUp className="w-4 h-4 text-brand-orange" />
                      <span>Latest News Today</span>
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-brand-orange uppercase shrink-0">
                      Top 5
                    </span>
                  </div>

                  {/* TOP 5 HEADLINES LIST (ONLY HEADING) */}
                  <div className="divide-y divide-slate-100">
                    {top5Latest.map((news, idx) => {
                      const newsLink = `/current-affairs/${news.id || encodeURIComponent(news.source_url)}`;
                      return (
                        <Link
                          key={news.id || news.source_url || idx}
                          to={newsLink}
                          className="py-3 first:pt-1 last:pb-1 block group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-all"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-brand-blue font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-dark-navy group-hover:text-brand-orange transition-colors leading-snug line-clamp-2">
                                {news.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {news.published_at
                                  ? new Date(news.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : 'Today'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
