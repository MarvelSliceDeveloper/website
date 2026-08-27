import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import Reveal from '../components/ui/Reveal';
import JobApplyModal from '../components/apply/JobApplyModal';
import {
  FiMapPin, FiClock, FiDollarSign,
  FiBriefcase,
  FiChevronLeft, FiChevronRight, FiSearch, FiArrowLeft,
} from 'react-icons/fi';

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 flex-wrap">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <FiChevronLeft className="w-5 h-5" /></button>
      {pages.map((p, i) => (
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-8 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-500 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-brand-blue text-white shadow-md' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>{p}</button>
        )
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <FiChevronRight className="w-5 h-5" /></button>
    </div>
  );
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'interns', label: 'Internships' },
];

export default function AllJobs() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [applyJob, setApplyJob] = useState(null);
  const perPage = 6;

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['job-openings-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_openings')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      return (data || []).map(j => ({ ...j, _type: 'job' }));
    },
  });

  const { data: interns = [], isLoading: internsLoading } = useQuery({
    queryKey: ['internships-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
          return [];
        }
        return [];
      }
      return (data || []).map(i => ({ ...i, _type: 'intern' }));
    },
  });

  const isLoading = jobsLoading || internsLoading;

  const filtered = tab === 'all'
    ? [...(jobs || []), ...(interns || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : tab === 'jobs' ? (jobs || []) : (interns || []);

  const totalPages = Math.ceil(filtered.length / perPage);
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  function handleTabChange(t) {
    setTab(t);
    setPage(1);
  }

  function handleApply(item) {
    if (item.apply_url?.trim()) {
      window.open(item.apply_url.trim(), '_blank', 'noopener,noreferrer');
    } else {
      setApplyJob(item);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/career"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-blue transition-colors mb-8"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Career
        </Link>

        <Reveal>
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              All Openings
            </h1>
            <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
              Explore full-time positions and internship opportunities to build your career with us.
            </p>
            <div className="w-12 h-1 bg-brand-blue mx-auto rounded-full mt-3" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {TABS.map(t => {
              const count = t.key === 'all' ? (jobs?.length || 0) + (interns?.length || 0)
                : t.key === 'jobs' ? (jobs?.length || 0)
                  : (interns?.length || 0);
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    tab === t.key
                      ? 'bg-brand-blue text-white shadow-md'
                      : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.label} <span className={tab === t.key ? 'text-white/80' : 'text-slate-400'}>({count})</span>
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-4 border-orange-200 border-t-brand-orange rounded-full animate-spin" />
            </div>
          ) : pageItems.length > 0 ? (
            <>
              <div className="max-w-4xl mx-auto space-y-4">
                {pageItems.map((item, i) => {
                  const isIntern = item._type === 'intern';
                    return (
                      <motion.div
                        key={`${item._type}-${item.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                      >
                        <div>
                          {/* TOP ROW: Title + Badge (Left) | Salary / Stipend (Right Top) */}
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <p className="font-bold text-dark-navy text-base leading-snug truncate whitespace-nowrap min-w-0" title={item.title}>
                                {item.title}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue border border-blue-200/60 text-[10px] font-bold shrink-0">
                                {isIntern ? 'Internship' : 'Job'}
                              </span>
                            </div>

                            {/* RIGHT SIDE TOP: Salary or Stipend */}
                            {(item.salary || item.stipend) && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-blue-50 text-brand-blue text-xs font-bold border border-blue-200/60">
                                  {(item.salary || item.stipend).startsWith('₹')
                                    ? (item.salary || item.stipend)
                                    : `₹${item.salary || item.stipend}`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* FULL DESCRIPTION TEXT (NOT HIDDEN) */}
                          {item.description && (
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-3">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* BOTTOM ROW: Experience/Duration + Location (Left) & Apply Button (Right) */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto gap-2 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            {(item.experience || item.duration) && (
                              <span className="text-slate-600 text-xs flex items-center gap-1 font-semibold">
                                <FiClock className="w-3.5 h-3.5 shrink-0 text-brand-blue" />
                                {item.experience || item.duration}
                              </span>
                            )}
                            {item.location && (
                              <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
                                <FiMapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />{item.location}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleApply(item)}
                            className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer"
                          >
                            Apply Now
                          </button>
                        </div>
                      </motion.div>
                    );
                })}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          ) : (
            <div className="text-center py-20">
              <FiSearch className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No {tab === 'jobs' ? 'jobs' : tab === 'interns' ? 'internships' : 'openings'} right now — check back soon!</p>
              <Link to="/career" className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-semibold rounded-full bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors">
                Back to Career
              </Link>
            </div>
          )}
        </Reveal>
      </div>

      {applyJob && <JobApplyModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  );
}
