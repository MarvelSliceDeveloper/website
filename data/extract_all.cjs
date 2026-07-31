/**
 * extract_all.js
 * Run: node data/extract_all.js
 * Extracts ALL data from Supabase and saves into the data/ folder hierarchy.
 * Does NOT modify any data — read-only extraction.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nxlsxywqvvuiljsulito.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BASE = path.join(__dirname);

function save(filePath, data) {
  const full = path.join(BASE, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ Saved ${filePath} (${Array.isArray(data) ? data.length + ' records' : 'object'})`);
}

async function q(table, opts = {}) {
  let query = sb.from(table).select(opts.select || '*');
  if (opts.order) query = query.order(opts.order);
  if (opts.eq) query = query.eq(opts.eq[0], opts.eq[1]);
  const { data, error } = await query;
  if (error) { console.error(`  ✗ ${table}: ${error.message}`); return []; }
  return data || [];
}

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   MARVEL SLICE — DB EXTRACTION SCRIPT   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ─── SITE ───────────────────────────────────────────────────────────────
  console.log('── SITE ──────────────────────────────────');
  const siteSettings = await q('site_settings');
  save('site/site_settings.json', siteSettings[0] || {});

  // ─── NAV ────────────────────────────────────────────────────────────────
  console.log('── NAV ───────────────────────────────────');
  const navItems = await q('nav_items', { order: 'sort_order' });
  save('nav/nav_items.json', navItems);

  // Build human-readable nav tree
  const roots = navItems.filter(n => !n.parent_id);
  function buildTree(parentId) {
    return navItems
      .filter(n => n.parent_id === parentId)
      .map(n => ({ ...n, children: buildTree(n.id) }));
  }
  const navTree = roots.map(n => ({ ...n, children: buildTree(n.id) }));
  save('nav/nav_tree.json', navTree);

  // ─── HOME ────────────────────────────────────────────────────────────────
  console.log('── HOME ──────────────────────────────────');
  const homeSections = await q('home_sections', { order: 'sort_order' });
  save('home/home_sections.json', homeSections);

  // ─── ABOUT ──────────────────────────────────────────────────────────────
  console.log('── ABOUT ─────────────────────────────────');
  const aboutNavItem = navItems.find(n => n.path === '/about');
  let aboutPage = null;
  if (aboutNavItem) {
    const { data } = await sb.from('nav_pages').select('*').eq('nav_item_id', aboutNavItem.id).single();
    aboutPage = data;
  }
  save('about/about_page.json', { nav_item: aboutNavItem, page: aboutPage });

  // ─── CONTACT ────────────────────────────────────────────────────────────
  console.log('── CONTACT ───────────────────────────────');
  const contactNavItem = navItems.find(n => n.path === '/contact');
  let contactPage = null;
  if (contactNavItem) {
    const { data } = await sb.from('nav_pages').select('*').eq('nav_item_id', contactNavItem.id).single();
    contactPage = data;
  }
  save('contact/contact_page.json', { nav_item: contactNavItem, page: contactPage });

  // ─── CAREER ─────────────────────────────────────────────────────────────
  console.log('── CAREER ────────────────────────────────');
  const careerNavItem = navItems.find(n => n.path === '/career');
  let careerPage = null;
  if (careerNavItem) {
    const { data } = await sb.from('nav_pages').select('*').eq('nav_item_id', careerNavItem.id).single();
    careerPage = data;
  }
  const { data: careerJobs } = await sb.from('nav_items').select('*').eq('parent_label', 'Career');
  save('career/career_page.json', { nav_item: careerNavItem, page: careerPage });

  // ─── BLOG ───────────────────────────────────────────────────────────────
  console.log('── BLOG ──────────────────────────────────');
  const blogCategories = await q('blog_categories', { order: 'sort_order' });
  const blogPosts = await q('blog_posts', { order: 'created_at' });
  const blogTags = await q('blog_post_tags');
  save('blog/blog_categories.json', blogCategories);
  save('blog/blog_posts.json', blogPosts);
  save('blog/blog_post_tags.json', blogTags);

  // ─── COURSES ────────────────────────────────────────────────────────────
  console.log('── COURSES ───────────────────────────────');

  // All courses with related data
  const { data: courses } = await sb
    .from('courses')
    .select('*, highlights(*), overview_faqs(*), course_fees(*), projects(*), certifications(*)')
    .order('created_at');
  save('courses/courses_raw.json', courses || []);

  // Course tabs, faqs, tags
  const courseTabs = await q('course_tabs', { order: 'sort_order' });
  const courseFaqs = await q('faqs', { order: 'sort_order' });
  const courseTags = await q('course_tags');
  const tags = await q('tags', { order: 'name' });
  const alumniCompanies = await q('alumni_companies', { order: 'sort_order' });
  const relatedCourses = await q('related_courses');

  save('courses/course_tabs.json', courseTabs);
  save('courses/course_faqs.json', courseFaqs);
  save('courses/course_tags.json', courseTags);
  save('courses/tags.json', tags);
  save('courses/alumni_companies.json', alumniCompanies);
  save('courses/related_courses.json', relatedCourses);

  // ── Build per-category course index ──────────────────────────────────
  const courseNavItems = navItems.filter(n =>
    n.parent_label === 'Software Learning' || n.parent_label === 'Competitive Exam' ||
    n.parent_id && navItems.find(p => p.id === n.parent_id && (
      p.parent_label === 'Software Learning' || p.parent_label === 'Competitive Exam'
    ))
  );

  const coursesByCategory = {};
  for (const cat of courseNavItems) {
    const catCourses = (courses || []).filter(c => c.nav_item_id === cat.id);
    if (catCourses.length > 0) {
      coursesByCategory[`${cat.parent_label || 'Root'} > ${cat.label}`] = {
        nav_item: cat,
        count: catCourses.length,
        courses: catCourses.map(c => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          subtitle: c.subtitle,
          duration: c.duration,
          mode: c.mode,
          status: c.status,
          is_published: c.is_published,
          rating: c.rating,
          review_count: c.review_count,
          learner_count: c.learner_count,
        }))
      };
    }
  }
  save('courses/courses_by_category.json', coursesByCategory);

  // Summary stats
  const summary = {
    extracted_at: new Date().toISOString(),
    totals: {
      nav_items: navItems.length,
      courses: courses?.length || 0,
      tags: tags.length,
      blog_posts: blogPosts.length,
      blog_categories: blogCategories.length,
      home_sections: homeSections.length,
      course_tabs: courseTabs.length,
      course_faqs: courseFaqs.length,
      alumni_companies: alumniCompanies.length,
    },
    nav_structure: navTree.map(n => ({
      label: n.label,
      path: n.path,
      parent_label: n.parent_label,
      children_count: n.children?.length || 0,
    }))
  };
  save('SUMMARY.json', summary);

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║            EXTRACTION COMPLETE           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\nSummary:');
  console.log(JSON.stringify(summary.totals, null, 2));
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
