import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import BankingHeader from './components/layout/BankingHeader';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chat/ChatWidget';
import FloatingContactButton from './components/FloatingContactButton';
import { trackPageView, initAnalytics } from './lib/analytics';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Blog from './pages/Blog';
import NavPage from './pages/NavPage';
import Career from './pages/Career';
import JobDetail from './pages/JobDetail';
import AllUpcomingClasses from './pages/AllUpcomingClasses';
import About from './pages/About';
import Contact from './pages/Contact';
import ServicesPage from './pages/ServicesPage';
import LegalPage from './pages/LegalPage';
import Banking from './pages/Banking';
import BankingV2 from './pages/BankingV2';
import Aptitude from './pages/Aptitude';
import Reasoning from './pages/Reasoning';
import English from './pages/English';
import BankingAwareness from './pages/BankingAwareness';
import CurrentAffairs from './pages/CurrentAffairs';
import CurrentAffairsDetail from './pages/CurrentAffairsDetail';
import MockExam from './pages/MockExam';
import { pageTransition } from './lib/motion';

const Admin = lazy(() => import('./admin/Admin'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const gaId = import.meta.env?.VITE_GA_MEASUREMENT_ID;
    if (gaId) {
      initAnalytics(gaId);
    }
  }, []);

  useEffect(() => {
    trackPageView(pathname, document.title);
  }, [pathname]);

  return null;
}

// Forces a clean mount when search params change, avoiding stale state.
function CoursesWithKey() {
  const { search } = useLocation();
  return <Courses key={search} />;
}

// Redirects category nav paths (e.g. /courses/software-learning/:subSlug or /courses/sl/:subSlug)
// to the search-param format so the listing page filters correctly.
function CourseNavRedirect() {
  const { subSlug } = useParams();
  const loc = useLocation();
  const isCE = loc.pathname.includes("competitive-exam") || loc.pathname.startsWith("/courses/ce/");
  if (isCE) {
    if (subSlug === 'aptitude') return <Navigate to="/aptitude" replace />;
    if (subSlug === 'reasoning') return <Navigate to="/reasoning" replace />;
    if (subSlug === 'english') return <Navigate to="/english" replace />;
    if (subSlug === 'banking-awareness') return <Navigate to="/banking-awareness" replace />;
    if (subSlug === 'current-affairs') return <Navigate to="/current-affairs" replace />;
    if (subSlug === 'todays-affairs') return <Navigate to="/todays-affairs" replace />;
    if (subSlug === 'banking') return <Navigate to="/banking" replace />;
    return <Navigate to="/banking" replace />;
  }
  const parent = "software-learning";
  const categoryParam = subSlug ? `&category=${subSlug}` : '';
  return <Navigate to={`/courses?parent=${parent}${categoryParam}&view=list`} replace />;
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
      <Route path="/courses/software-learning/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/software-learning" element={<Navigate to="/courses?parent=software-learning" replace />} />
      <Route path="/courses/competitive-exam/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/competitive-exam" element={<Navigate to="/banking" replace />} />
      <Route path="/courses/sl/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/ce/:subSlug" element={<CourseNavRedirect />} />
      <Route path="/courses/:slug" element={<CourseDetail />} />
      <Route path="/courses/:category/:slug" element={<CourseDetail />} />
      <Route path="/career" element={<Career />} />
      <Route path="/career/job/:type/:id" element={<JobDetail />} />
      <Route path="/career/job/:id" element={<JobDetail />} />
      <Route path="/career/jobs" element={<Navigate to="/career" replace />} />
      <Route path="/upcoming-classes" element={<AllUpcomingClasses />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/banking" element={<BankingV2 />} />
      <Route path="/bankingv2" element={<BankingV2 />} />
      <Route path="/aptitude" element={<Aptitude />} />
      <Route path="/reasoning" element={<Reasoning />} />
      <Route path="/english" element={<English />} />
      <Route path="/banking-awareness" element={<BankingAwareness />} />
      <Route path="/current-affairs" element={<CurrentAffairs />} />
      <Route path="/todays-affairs" element={<Navigate to="/current-affairs?filter=today" replace />} />
      <Route path="/current-affairs/:id" element={<CurrentAffairsDetail />} />
      <Route path="/mock-exam" element={<MockExam />} />
      <Route path="/software-learning" element={<Navigate to="/courses?parent=software-learning" replace />} />
      <Route path="/competitive-exam" element={<Navigate to="/banking" replace />} />
      <Route path="/terms" element={<LegalPage pageKey="terms" />} />
      <Route path="/terms-and-conditions" element={<LegalPage pageKey="terms" />} />
      <Route path="/terms-of-service" element={<LegalPage pageKey="terms" />} />
      <Route path="/privacy" element={<LegalPage pageKey="privacy" />} />
      <Route path="/privacy-policy" element={<LegalPage pageKey="privacy" />} />
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
  const { pathname } = useLocation();
  const isBankingPage = [
    '/banking',
    '/bankingv2',
    '/aptitude',
    '/reasoning',
    '/english',
    '/banking-awareness',
    '/current-affairs',
    '/todays-affairs',
    '/mock-exam'
  ].some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full relative">
      <ScrollToTop />
      <PageTracker />
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        {isBankingPage ? (
          <BankingHeader />
        ) : (
          <>
            <TopBar />
            <Header />
          </>
        )}
      </div>
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${isBankingPage ? 'pt-[124px] sm:pt-[130px] lg:pt-[136px]' : 'pt-[60px] lg:pt-[104px]'}`}>
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
