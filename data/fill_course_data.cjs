/**
 * fill_course_data.cjs
 *
 * Fills all missing fields for 200 seeded courses:
 *   - Media: hero_image_url, video_thumbnail_url, video_url, cta_background_image
 *   - show_pricing → true
 *   - course_tags (via tag_id from the tags table)
 *   - course_fees (pricing plans)
 *   - related_courses (within each category)
 *
 * Run: node data/fill_course_data.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL      = 'https://nxlsxywqvvuiljsulito.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Seed-based image URLs (deterministic per slug) ───────────────────────
function imageUrl(slug, w, h) {
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/${w}/${h}`;
}

// ─── Theme → tag name mappings (names as they appear in DB) ──────────────
const THEME_TAGS = {
  web_frontend:    ['html-css','javascript','react','web development'],
  web_backend:     ['backend','nodejs','python','databases'],
  ml:              ['machine learning','ai','python','data science'],
  dl:              ['deep-learning','ai','computer-vision','pytorch'],
  data_analysis:    ['data-analysis','sql','excel','statistics'],
  data_viz:         ['visualization','data science','power-bi','tableau'],
  cloud:            ['cloud computing','aws','azure','gcp'],
  devops:           ['docker','kubernetes','linux','git'],
  ethical_hacking:  ['cybersecurity','ethical-hacking','penetration-testing','network-security'],
  network_security: ['network-security','cybersecurity','linux','cloud-security'],
  upsc_prelims:     ['upsc','competitive-exams','general-studies','history'],
  upsc_mains:       ['upsc','competitive-exams','general-studies','polity'],
  ssc_cgl:          ['ssc','competitive-exams','quantitative-aptitude','reasoning'],
  ssc_chsl:         ['ssc','competitive-exams','english','reasoning'],
  ibps:             ['banking-exams','ibps','quantitative-aptitude','financial-awareness'],
  sbi:              ['banking-exams','sbi','reasoning','financial-awareness'],
  rrb_ntpc:         ['rrb','railway-exams','competitive-exams','general-science'],
  rrb_gd:           ['rrb','railway-exams','competitive-exams','general-science'],
  nda:              ['nda','defence-exams','general-studies','general-science'],
  cds:              ['cds','defence-exams','english','general-studies'],
};

// ─── Theme → fee plans ────────────────────────────────────────────────────
function feePlans(theme) {
  const isSw = ['web_frontend','web_backend','ml','dl','data_analysis','data_viz','cloud','devops','ethical_hacking','network_security'].includes(theme);
  if (isSw) {
    return [
      { plan_name: 'Basic', duration_months: 3, price: 4999 },
      { plan_name: 'Standard', duration_months: 6, price: 8999 },
      { plan_name: 'Premium', duration_months: 12, price: 14999 },
    ];
  }
  return [
    { plan_name: 'Basic', duration_months: 3, price: 2999 },
    { plan_name: 'Standard', duration_months: 6, price: 5499 },
    { plan_name: 'Premium', duration_months: 12, price: 9999 },
  ];
}

// ─── Build course_fees payload ────────────────────────────────────────────
function buildCourseFees(courseId, theme) {
  return feePlans(theme).map(p => ({
    course_id: courseId,
    plan_name: p.plan_name,
    price: p.price,
  }));
}

// ─── Build related_courses payload (link every course to others in same theme) ──
function buildRelatedCourses(allCoursesByTheme) {
  const rels = [];
  for (const [theme, courses] of Object.entries(allCoursesByTheme)) {
    for (let i = 0; i < courses.length; i++) {
      for (let j = 0; j < courses.length; j++) {
        if (i === j) continue;
        rels.push({
          course_id: courses[i].id,
          related_course_id: courses[j].id,
        });
        // Only add forward direction to avoid dupes — actually add both directions
        // but Supabase might have a constraint. Let's just add forward.
        // Actually let's add one per course (link to next course, circular)
        break; // Just one related course per course to keep it simple
      }
      // Take next course (circular)
      const next = courses[(i + 1) % courses.length];
      if (next) {
        rels.push({
          course_id: courses[i].id,
          related_course_id: next.id,
        });
      }
    }
  }
  return rels;
}

// ─── Build course_tags payload ────────────────────────────────────────────
function buildCourseTags(courseId, theme, tagMap) {
  const tagNames = THEME_TAGS[theme] || [];
  return tagNames
    .map(name => tagMap[name])
    .filter(Boolean)
    .map(tagId => ({ course_id: courseId, tag_id: tagId }));
}

// ─── Get or create course_tags entries ────────────────────────────────────
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   FILL MISSING COURSE DATA                       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // 1. Fetch all courses
  const { data: courses, error: ce } = await sb.from('courses').select('id, slug, title, nav_item_id');
  if (ce) { console.error('Failed to fetch courses:', ce.message); process.exit(1); }
  console.log(`✓ Fetched ${courses.length} courses`);

  // 2. Fetch all tags
  const { data: allTags, error: te } = await sb.from('tags').select('id, name');
  if (te) { console.error('Failed to fetch tags:', te.message); process.exit(1); }
  const tagMap = {};
  for (const t of allTags) tagMap[t.name.toLowerCase()] = t.id;
  console.log(`✓ Fetched ${allTags.length} tags`);

  // 3. Build nav_item_id → theme map (actual IDs from nav_items table)
  const NAV_THEME_MAP = {
    '1c20c76e-745b-4e87-9386-ef247c9c0e61': 'web_frontend',
    'd4f0a428-8f8c-4ae5-ba53-e27413b35647': 'web_backend',
    'd4035ea8-9af9-4cf2-902e-7777753c9e20': 'ml',
    'bb3a8a9c-2f7d-47f0-bd4e-aab2b48f94fb': 'dl',
    'd60db086-c07b-49bf-9821-821b6f0d8a77': 'data_analysis',
    '3912b494-8d84-439c-ab45-f64c763a70ee': 'data_viz',
    '4d7dfda2-4a74-4657-8445-04d1a037bdcb': 'cloud',
    '25b2f078-3d16-4eac-8b13-3e378c50a006': 'devops',
    '9e56aa2b-238c-45ed-b3b6-59404ae29ad0': 'ethical_hacking',
    '983cb9d7-c1ae-4d86-b69d-76a8fbf4b04a': 'network_security',
    'a8a63659-aeb1-434e-83aa-3eee0cb6bfa8': 'upsc_prelims',
    '63d726e5-f2af-4aff-9129-869e065015a6': 'upsc_mains',
    '11a48c49-1bb3-4feb-94bc-10455a20f627': 'ssc_cgl',
    '8a446706-f65d-4b70-af18-c03c0f9dbc6d': 'ssc_chsl',
    'f877419b-c9f0-4e63-b5b1-c46a34b47d10': 'ibps',
    'd448c95f-0321-43bc-b2f6-9e089695c9b4': 'sbi',
    '42137743-8afd-427f-9a1c-38133083e28a': 'rrb_ntpc',
    '106c75d5-d6d0-47cf-8976-d9fedacff9ed': 'rrb_gd',
    '377c600f-9758-446a-a8fd-e71dd69d02cc': 'nda',
    '578436be-0c63-48ca-a4e7-4def81ed0203': 'cds',
  };

  // Group courses by theme
  const coursesByTheme = {};
  for (const c of courses) {
    const theme = NAV_THEME_MAP[c.nav_item_id];
    if (!theme) continue;
    if (!coursesByTheme[theme]) coursesByTheme[theme] = [];
    coursesByTheme[theme].push(c);
  }

  // ── STEP 1: Update courses with media fields ───────────────────────────
  console.log('\n── STEP 1: Updating media & CTA fields ─────────');
  let updated = 0;
  for (const c of courses) {
    const theme = NAV_THEME_MAP[c.nav_item_id];
    const slug = c.slug;
    const hero = imageUrl(slug + '-hero', 1200, 600);
    const thumb = imageUrl(slug + '-thumb', 640, 360);
    const bg = imageUrl(slug + '-bg', 1920, 400);
    const video = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // placeholder

    const { error: ue } = await sb.from('courses').update({
      hero_image_url: hero,
      video_thumbnail_url: thumb,
      video_url: video,
      cta_background_image: bg,
      show_pricing: true,
    }).eq('id', c.id);

    if (ue) console.log(`  ✗ ${c.title}: ${ue.message}`);
    else updated++;
    if (updated % 50 === 0) process.stdout.write(`  ...${updated} updated\n`);
  }
  console.log(`  ✓ Updated ${updated}/${courses.length} courses`);

  // ── STEP 2: Insert course_tags ─────────────────────────────────────────
  console.log('\n── STEP 2: Inserting course_tags ───────────────');
  // Clear existing course_tags first
  await sb.from('course_tags').delete().neq('course_id', '00000000-0000-0000-0000-000000000000');
  let tagsInserted = 0;
  let tagsSkipped = 0;
  for (const c of courses) {
    const theme = NAV_THEME_MAP[c.nav_item_id];
    if (!theme) { tagsSkipped++; continue; }
    const payload = buildCourseTags(c.id, theme, tagMap);
    if (payload.length === 0) { tagsSkipped++; continue; }
    const { error: ie } = await sb.from('course_tags').insert(payload);
    if (ie) { console.log(`  ✗ ${c.title}: ${ie.message}`); tagsSkipped++; }
    else tagsInserted += payload.length;
  }
  console.log(`  ✓ Inserted ${tagsInserted} course_tags (${tagsSkipped} skipped)`);

  // ── STEP 3: Insert course_fees ─────────────────────────────────────────
  console.log('\n── STEP 3: Inserting course_fees ───────────────');
  await sb.from('course_fees').delete().neq('course_id', '00000000-0000-0000-0000-000000000000');
  let feesInserted = 0;
  let feesSkipped = 0;
  for (const c of courses) {
    const theme = NAV_THEME_MAP[c.nav_item_id];
    if (!theme) { feesSkipped++; continue; }
    const payload = buildCourseFees(c.id, theme);
    const { error: fe } = await sb.from('course_fees').insert(payload).select();
    if (fe) { console.log(`  ✗ ${c.title}: ${fe.message}`); feesSkipped++; }
    else feesInserted += payload.length;
  }
  console.log(`  ✓ Inserted ${feesInserted} course_fees (${feesSkipped} skipped)`);

  // ── STEP 4: Insert related_courses ─────────────────────────────────────
  console.log('\n── STEP 4: Inserting related_courses ────────────');
  await sb.from('related_courses').delete().neq('course_id', '00000000-0000-0000-0000-000000000000');
  let relInserted = 0;
  for (const [theme, cList] of Object.entries(coursesByTheme)) {
    for (let i = 0; i < cList.length; i++) {
      const next = cList[(i + 1) % cList.length];
      if (!next || cList[i].id === next.id) continue;
      const { error: re } = await sb.from('related_courses').insert({
        course_id: cList[i].id,
        related_course_id: next.id,
      });
      if (re) console.log(`  ✗ ${cList[i].title}: ${re.message}`);
      else relInserted++;
    }
  }
  console.log(`  ✓ Inserted ${relInserted} related_courses`);

  // ── Summary ────────────────────────────────────────────────────────────
  const { data: finalCourses } = await sb.from('courses').select('id, title, hero_image_url, video_url, show_pricing').limit(3);
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   FILL COMPLETE                                  ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log(`\nSample courses now have:\n${JSON.stringify(finalCourses, null, 2)}`);
}

main().catch(console.error);
