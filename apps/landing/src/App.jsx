import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chat/ChatWidget';
import FloatingContactButton from './components/FloatingContactButton';
import { trackPageView } from './lib/analytics';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Blog from './pages/Blog';
import NavPage from './pages/NavPage';
import Career from './pages/Career';
import AllJobs from './pages/AllJobs';
import AllUpcomingClasses from './pages/AllUpcomingClasses';
import About from './pages/About';
import Contact from './pages/Contact';
import ServicesPage from './pages/ServicesPage';
import LegalPage from './pages/LegalPage';
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
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Blog />} />
      <Route path="/courses" element={<CoursesWithKey />} />
      <Route path="/courses/category/:categorySlug" element={<CoursesWithKey />} />
      <Route path="/courses/sl/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/ce/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/:slug" element={<CourseDetail />} />
      <Route path="/career" element={<Career />} />
      <Route path="/career/jobs" element={<AllJobs />} />
      <Route path="/upcoming-classes" element={<AllUpcomingClasses />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/software-learning" element={<Navigate to="/courses?parent=software-learning" replace />} />
      <Route path="/competitive-exam" element={<Navigate to="/courses?parent=competitive-exam" replace />} />
      <Route path="/terms" element={<LegalPage pageKey="terms" />} />
      <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
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
      <FloatingContactButton />
      <ChatWidget />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/*" element={<PublicLayout />} />
        <Route path="/admin/*" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500 text-sm">Loading admin…</div>}><Admin /></Suspense>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
