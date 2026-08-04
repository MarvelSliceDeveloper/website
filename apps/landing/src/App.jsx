import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chat/ChatWidget';
import { trackPageView } from './lib/analytics';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Blog from './pages/Blog';
import NavPage from './pages/NavPage';
import Career from './pages/Career';
import ServicesPage from './pages/ServicesPage';
import ServiceDetail from './pages/ServiceDetail';
import TrainingPage from './pages/TrainingPage';
import TrainingDetail from './pages/TrainingDetail';
import { pageTransition } from './lib/motion';

const Admin = lazy(() => import('./admin/Admin'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageTracker() {
  const { pathname } = useLocation();
  useEffect(() => { trackPageView(pathname); }, [pathname]);
  return null;
}

function DataPrefetcher() {

  useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => supabase.from('site_settings').select('*').maybeSingle(),
  });

  useQuery({
    queryKey: ['topNavItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []).filter((item) => !item.parent_id && !item.parent_label);
    },
  });

  useQuery({
    queryKey: ['homeSections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  useQuery({
    queryKey: ['alumniCompanies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alumni_companies')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  useQuery({
    queryKey: ['footer'],
    queryFn: async () => {
      const { data: columns, error } = await supabase
        .from('footer_columns')
        .select('*, footer_links(*)')
        .order('sort_order');
      if (error) throw error;
      return columns;
    },
  });

  return null;
}

// Forces a clean mount when search params change, avoiding stale state.
function CoursesWithKey() {
  const { search } = useLocation();
  return <Courses key={search} />;
}

// Redirects /courses/sl/:slug and /courses/ce/:slug to the search-param
// format so the listing page can filter without AnimatePresence re-mounts.
function CourseNavRedirect() {
  const { subSlug } = useParams();
  const loc = useLocation();
  const parent = loc.pathname.startsWith("/courses/sl/")
    ? "software-learning"
    : "competitive-exam";
  return <Navigate to={`/courses?parent=${parent}&category=${subSlug}&view=list`} replace />;
}

// Fades/slides each page in and out on route changes.
function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  const routes = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Blog />} />
      <Route path="/courses" element={<CoursesWithKey />} />
      <Route path="/courses/category/:categorySlug" element={<CoursesWithKey />} />
      <Route path="/courses/sl/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/ce/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/:slug" element={<CourseDetail />} />
      <Route path="/career" element={<Career />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<ServiceDetail />} />
      <Route path="/training" element={<TrainingPage />} />
      <Route path="/training/:slug" element={<TrainingDetail />} />
      <Route path="/software-learning" element={<Navigate to="/courses?parent=software-learning" replace />} />
      <Route path="/competitive-exam" element={<Navigate to="/courses?parent=competitive-exam" replace />} />
      <Route path="/:slug/*" element={<NavPage />} />
    </Routes>
  );

  if (reduce) return routes;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
      >
        {routes}
      </motion.div>
    </AnimatePresence>
  );
}

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <PageTracker />
      <TopBar />
      <Header />
      <main className="flex-1">
        <AnimatedRoutes />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PublicLayout />} />
        <Route path="/admin/*" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">Loading admin…</div>}><Admin /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
