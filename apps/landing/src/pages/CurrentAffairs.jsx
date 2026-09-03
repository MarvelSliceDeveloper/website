import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowLeft,
  FiArrowRight,
  FiX,
  FiLoader,
  FiSearch,
  FiCalendar,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
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

export default function CurrentAffairs({ isTodayOnly = false }) {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isExactDateMode, setIsExactDateMode] = useState(true);

  // Fetch articles from Supabase current_affairs
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

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      let matchesDate = true;
      if (isTodayOnly && isExactDateMode && selectedDate) {
        const artDateStr = art.published_at ? new Date(art.published_at).toISOString().split('T')[0] : '';
        matchesDate = artDateStr === selectedDate;
      }
      const matchesCategory =
        activeCategory === 'All Topics' ||
        art.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery, isTodayOnly, isExactDateMode, selectedDate]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

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

  function formatDate(isoStr) {
    if (!isoStr) return 'Recent';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  }

  function handleBackNavigation(e) {
    if (e) e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <div className="current-affairs-content">
        {/* LIVE CURRENT AFFAIRS FEED SECTION */}
        <section className="py-8 sm:py-12 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors cursor-pointer group mb-2"
            >
              <FiArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-orange transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-navy">
                  {isTodayOnly ? "Today's Current Affairs & Exam Notes" : "Daily Current Affairs & Exam Notes"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isTodayOnly ? "Live today's national & international news updates structured for competitive exam revision." : "Curated National & International news updates structured for competitive exam revision."}
                </p>
              </div>

              {!isTodayOnly && (
                <div className="relative w-full md:w-72">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search articles, RBI, schemes..."
                    className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all shadow-xs text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Date-wise Filter Bar for Today's Affairs */}
            {isTodayOnly && (
              <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-2">
                  <FiCalendar className="w-4 h-4 text-brand-orange" />
                  <span>Filter Date:</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                    setIsExactDateMode(true);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isExactDateMode && selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-orange/40 hover:text-brand-orange'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const y = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    setSelectedDate(y);
                    setIsExactDateMode(true);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isExactDateMode && selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                      ? 'bg-brand-orange text-white border-brand-orange shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-orange/40 hover:text-brand-orange'
                  }`}
                >
                  Yesterday
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-semibold">Pick Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setIsExactDateMode(true);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange cursor-pointer"
                  />
                </div>

                {/* Search Bar Placed in this Position */}
                <div className="relative w-full sm:w-64 sm:ml-auto">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all shadow-xs text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-blue/40 hover:text-brand-blue'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Articles Grid */}
            {isDbLoading ? (
              <div className="py-16 text-center space-y-3">
                <FiLoader className="w-8 h-8 animate-spin text-brand-blue mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Loading latest current affairs updates...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3 max-w-md mx-auto">
                <FiGlobe className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-dark-navy">No articles match your search</h3>
                <p className="text-xs text-slate-500">
                  Try switching categories or clearing your search.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                    className="px-5 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Clear Search</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedArticles.map((art, idx) => {
                    const articleLink = `/current-affairs/${art.id || encodeURIComponent(art.source_url)}`;
                    return (
                      <motion.div
                        key={art.id || art.source_url || idx}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white border border-[#E5ECF5] hover:border-brand-orange/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                      >
                        <Link to={articleLink} className="p-5 space-y-3 block">
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-200/80">
                              {art.category || 'General'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <FiCalendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(art.published_at)}</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-dark-navy leading-snug group-hover:text-brand-blue transition-colors line-clamp-2">
                            {art.title}
                          </h3>

                          {/* Summary */}
                          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                            {art.summary}
                          </p>
                        </Link>

                        {/* Footer / Action */}
                        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold text-slate-600 leading-tight">
                            Source: {art.source || 'Official News'}
                          </span>

                          <Link
                            to={articleLink}
                            className="text-xs font-bold text-brand-orange hover:text-orange-600 inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          >
                            <span>Read Article</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* PAGINATION CONTROLS */}
                {filteredArticles.length > ITEMS_PER_PAGE && (
                  <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-bold text-dark-navy">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold text-dark-navy">{Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)}</span> of{' '}
                      <span className="font-bold text-dark-navy">{filteredArticles.length}</span> articles
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
        </section>
      </div>
    </div>
  );
}
