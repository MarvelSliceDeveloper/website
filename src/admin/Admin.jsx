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

import ServicesManager from './pages/ServicesManager';
import ServiceEditor from './pages/ServiceEditor';
import ServiceWizard from './pages/ServiceWizard';
import ServiceCategoriesManager from './pages/ServiceCategoriesManager';
import TrainingManager from './pages/TrainingManager';
import TrainingEditor from './pages/TrainingEditor';
import TrainingCategoriesManager from './pages/TrainingCategoriesManager';
import TrainingWizard from './pages/TrainingWizard';
import ServicesPageEditor from './pages/ServicesPageEditor';
import TrainingPageEditor from './pages/TrainingPageEditor';
import CareerSubmissions from './pages/CareerSubmissions';
import BrochureDownloads from './pages/BrochureDownloads';
import FormSubmissions from "./pages/FormSubmissions";
import NewsletterSubscribers from "./pages/NewsletterSubscribers";
import ContactSubmissions from './pages/ContactSubmissions';
import ChatSubmissions from './pages/ChatSubmissions';
import ChatPanel from './pages/ChatPanel';
import BlogManager from './pages/BlogManager';
import BlogPostEditor from './pages/BlogPostEditor';
import BlogCategoriesManager from './pages/BlogCategoriesManager';
import BlogPageEditor from './pages/BlogPageEditor';
import ProfileSettings from './pages/ProfileSettings';

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
          
          <Route path="services" element={<ServicesManager />} />
          <Route path="services/new" element={<ServiceWizard />} />
          <Route path="services/:id" element={<ServiceEditor />} />
          <Route path="service-categories" element={<ServiceCategoriesManager />} />
          <Route path="training" element={<TrainingManager />} />
          <Route path="training/new" element={<TrainingWizard />} />
          <Route path="training/:id" element={<TrainingEditor />} />
          <Route path="training-categories" element={<TrainingCategoriesManager />} />
          <Route path="services-page" element={<ServicesPageEditor />} />
          <Route path="training-page" element={<TrainingPageEditor />} />
          <Route path="career-submissions" element={<CareerSubmissions />} />
          <Route path="brochure-downloads" element={<BrochureDownloads />} />
          <Route path="form-submissions" element={<FormSubmissions />} />
          <Route path="newsletter-subscribers" element={<NewsletterSubscribers />} />
          <Route path="contact-submissions" element={<ContactSubmissions />} />
          <Route path="chat-submissions" element={<ChatSubmissions />} />
          <Route path="pages/:slug" element={<PageEditorRedirect />} />
          <Route path="chats" element={<ChatPanel />} />
          <Route path="blog-page" element={<BlogPageEditor />} />
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
