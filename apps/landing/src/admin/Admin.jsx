import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SiteSettings from './pages/SiteSettings';
import NavMenuManager from './pages/NavMenuManager';
import CoursesList from './pages/CoursesList';
import CourseEditor from './pages/CourseEditor';
import CourseWizard from './pages/CourseWizard';
import CourseReports from './pages/CourseReports';
import CourseBrochure from './pages/CourseBrochure';
import AlumniCompaniesManager from './pages/AlumniCompaniesManager';
import TagsList from './pages/TagsList';
import TagAdd from './pages/TagAdd';
import FooterManager from './pages/FooterManager';
import MediaLibrary from './pages/MediaLibrary';
import AdminUsersManager from './pages/AdminUsersManager';
import NavPageEditor from './pages/NavPageEditor';
import HomePageEditor from './pages/HomePageEditor';
import AboutPageEditor from './pages/AboutPageEditor';
import ContactPageEditor from './pages/ContactPageEditor';
import CareerPageEditor from './pages/CareerPageEditor';
import JobsList from './pages/JobsList';
import JobEditor from './pages/JobEditor';

import TrainingManager from './pages/TrainingManager';
import TrainingEditor from './pages/TrainingEditor';
import TrainingCategoriesManager from './pages/TrainingCategoriesManager';
import TrainingWizard from './pages/TrainingWizard';
import ServicesPageEditor from './pages/ServicesPageEditor';
import TrainingPageEditor from './pages/TrainingPageEditor';
import CareerSubmissions from './pages/CareerSubmissions';
import CareerContactSubmissions from './pages/CareerContactSubmissions';
import InternshipsManager from './pages/InternshipsManager';
import InternEditor from './pages/InternEditor';
import BrochureDownloads from './pages/BrochureDownloads';
import FormSubmissions from "./pages/FormSubmissions";
import UpcomingCoursesManager from './pages/UpcomingCoursesManager';
import UpcomingClassAdd from './pages/UpcomingClassAdd';
import UpcomingClassSubmissions from './pages/UpcomingClassSubmissions';
import CourseInterests from './pages/CourseInterests';
import BankingEnquiries from './pages/BankingEnquiries';
import UpcomingCourseInterests from './pages/UpcomingCourseInterests';
import TestimonialsManager from './pages/TestimonialsManager';
import TestimonialEditor from './pages/TestimonialEditor';
import BankingTestimonialsManager from './pages/BankingTestimonialsManager';
import BankingTestimonialEditor from './pages/BankingTestimonialEditor';
import NewsletterSubscribers from "./pages/NewsletterSubscribers";
import ContactSubmissions from './pages/ContactSubmissions';
import AboutSubmissions from './pages/AboutSubmissions';
import ChatSubmissions from './pages/ChatSubmissions';
import ChatPanel from './pages/ChatPanel';
import BlogManager from './pages/BlogManager';
import BlogPostEditor from './pages/BlogPostEditor';
import BlogCategoriesManager from './pages/BlogCategoriesManager';
import BlogPageEditor from './pages/BlogPageEditor';
import ProfileSettings from './pages/ProfileSettings';
import LegalPageEditor from './pages/LegalPageEditor';

const pageSlugToEditor = { about: 'about', contact: 'contact', career: 'career', services: 'services', training: 'training' };

function PageEditorRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    if (slug === 'home') { navigate('/admin/home-page', { replace: true }); return; }
    if (pageSlugToEditor[slug]) {
      navigate(`/admin/${slug}-page`, { replace: true });
      return;
    }

    async function resolve() {
      const { data: existingItems } = await supabase
        .from('nav_items')
        .select('id')
        .eq('path', `/${slug}`)
        .eq('is_active', true)
        .order('id')
        .limit(1);
      const existing = existingItems?.[0] || null;

      if (existing?.id) {
        await supabase.from('nav_items').update({ is_active: false }).eq('path', `/${slug}`).neq('id', existing.id);
        navigate(`/admin/nav-pages/${existing.id}`, { replace: true });
        return;
      }

      const label = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const { data: created } = await supabase
        .from('nav_items')
        .insert({ label, path: `/${slug}`, is_active: true, sort_order: 99 })
        .select('id')
        .single();

      if (created?.id) {
        navigate(`/admin/nav-pages/${created.id}`, { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    }

    resolve();
  }, [slug, navigate]);

  return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" /></div>;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function Admin() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="site-settings" element={<SiteSettings />} />
          <Route path="nav-menu" element={<NavMenuManager />} />
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/wizard" element={<CourseWizard />} />
          <Route path="courses/reports" element={<CourseReports />} />
          <Route path="courses/brochure" element={<CourseBrochure />} />
          <Route path="courses/:id" element={<CourseEditor />} />
          <Route path="alumni" element={<AlumniCompaniesManager />} />
          <Route path="tags" element={<TagsList />} />
          <Route path="tags/add" element={<TagAdd />} />
          <Route path="footer" element={<FooterManager />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="admin-users" element={<AdminUsersManager />} />
          <Route path="nav-pages/:id" element={<NavPageEditor />} />
          <Route path="home-page" element={<Navigate to="/admin/home/hero" replace />} />
          <Route path="home" element={<HomePageEditor />} />
          <Route path="home/:section" element={<HomePageEditor />} />
          <Route path="about-page" element={<AboutPageEditor />} />
          <Route path="contact-page" element={<ContactPageEditor />} />
          <Route path="career-page" element={<CareerPageEditor />} />
          <Route path="jobs" element={<JobsList />} />
          <Route path="jobs/new" element={<JobEditor />} />
          <Route path="jobs/:id" element={<JobEditor />} />
          <Route path="internships" element={<InternshipsManager />} />
          <Route path="internships/:id" element={<InternEditor />} />
          
          <Route path="training" element={<TrainingManager />} />
          <Route path="training/new" element={<TrainingWizard />} />
          <Route path="training/:id" element={<TrainingEditor />} />
          <Route path="training-categories" element={<TrainingCategoriesManager />} />
          <Route path="services-page" element={<ServicesPageEditor />} />
          <Route path="training-page" element={<TrainingPageEditor />} />
          <Route path="career-submissions" element={<CareerSubmissions />} />
          <Route path="career-contact-submissions" element={<CareerContactSubmissions />} />
          <Route path="brochure-downloads" element={<BrochureDownloads />} />
          <Route path="form-submissions" element={<FormSubmissions />} />
          <Route path="upcoming-courses" element={<UpcomingCoursesManager />} />
          <Route path="upcoming-courses/new" element={<UpcomingClassAdd key="new" />} />
          <Route path="upcoming-courses/:id" element={<UpcomingClassAdd key="edit" />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
          <Route path="testimonials/new" element={<TestimonialEditor key="new" />} />
          <Route path="testimonials/:id" element={<TestimonialEditor key="edit" />} />
          <Route path="banking-testimonials" element={<BankingTestimonialsManager />} />
          <Route path="banking-testimonials/new" element={<BankingTestimonialEditor key="new" />} />
          <Route path="banking-testimonials/:id" element={<BankingTestimonialEditor key="edit" />} />
          <Route path="upcoming-class-submissions" element={<UpcomingClassSubmissions />} />
          <Route path="course-interests" element={<CourseInterests />} />
          <Route path="banking-enquiries" element={<BankingEnquiries />} />
          <Route path="upcoming-course-interests" element={<UpcomingCourseInterests />} />
          <Route path="newsletter-subscribers" element={<NewsletterSubscribers />} />
          <Route path="contact-submissions" element={<ContactSubmissions />} />
          <Route path="about-submissions" element={<AboutSubmissions />} />
          <Route path="chat-submissions" element={<ChatSubmissions />} />
          <Route path="pages/:slug" element={<PageEditorRedirect />} />
          <Route path="chats" element={<ChatPanel />} />
          <Route path="blog-page" element={<BlogPageEditor />} />
          <Route path="terms-policy" element={<LegalPageEditor key="terms" pageKey="terms" />} />
          <Route path="privacy-policy" element={<LegalPageEditor key="privacy" pageKey="privacy" />} />
          <Route path="blog" element={<BlogManager />} />
          <Route path="blog/new" element={<BlogPostEditor key="new" />} />
          <Route path="blog/:id" element={<BlogPostEditor key="edit" />} />
          <Route path="blog/categories" element={<BlogCategoriesManager />} />
          <Route path="profile" element={<ProfileSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
