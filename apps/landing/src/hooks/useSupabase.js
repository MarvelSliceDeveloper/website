import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

/* ---------- top-level nav items (from DB) ---------- */

export function useTopNavItems() {
  return useQuery({
    queryKey: ['topNavItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      const filtered = (data || []).filter((item) => {
        return !item.parent_id && !item.parent_label;
      });
      return filtered;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ---------- nav children by static parent label ---------- */

function buildIdSubtree(allItems, pid) {
  return allItems
    .filter((item) => item.parent_id === pid)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      ...item,
      children: buildIdSubtree(allItems, item.id),
    }));
}

export function useNavChildren(parentLabel) {
  return useQuery({
    queryKey: ['navChildren', parentLabel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      const all = data || [];
      return all
        .filter((item) => item.parent_label === parentLabel)
        .map((item) => ({
          ...item,
          children: buildIdSubtree(all, item.id),
        }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!parentLabel,
  });
}

/* ---------- full course page data (single query) ---------- */

export function useCourse(slug) {
  return useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from('courses')
        .select(
          `*,
          highlights(*),
          overview_faqs(*),
          course_fees(*),
          projects(*),
          certifications(*),
          course_tabs(*),
          faqs(*)`
        )
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return course || null;
    },
    enabled: !!slug,
    staleTime: 0,
  });
}

/* ---------- related courses ---------- */

async function fetchLatestCourses() {
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(4);
  return data || [];
}

export function useRelatedCourses(courseId) {
  return useQuery({
    queryKey: ['relatedCourses', courseId],
    queryFn: async () => {
      const [courseRes, tagsData, allNav] = await Promise.all([
        supabase.from('courses').select('nav_item_id').eq('id', courseId).single(),
        supabase.from('course_tags').select('tag_id').eq('course_id', courseId),
        supabase.from('nav_items').select('*'),
      ]);

      if (!courseRes.data || !allNav?.data) return [];

      const navItemId = courseRes.data.nav_item_id;
      const all = allNav.data;
      const byId = Object.fromEntries(all.map((n) => [n.id, n]));

      // Walk up to find the root learning section
      function getRootSection(startId) {
        const visited = new Set();
        let cur = byId[startId];
        while (cur) {
          if (visited.has(cur.id)) return null;
          visited.add(cur.id);
          if (
            cur.parent_label === 'Software Learning' ||
            cur.parent_label === 'Competitive Exam'
          ) {
            return { rootLabel: cur.parent_label, rootId: cur.id };
          }
          cur = cur.parent_id ? byId[cur.parent_id] : null;
        }
        return null;
      }

      const root = getRootSection(navItemId);
      if (!root) return [];

      // Collect all nav_item IDs under this root
      function collectDescendantIds(parentIds) {
        const ids = new Set(parentIds);
        const stack = [...parentIds];
        while (stack.length) {
          const pid = stack.pop();
          for (const n of all) {
            if (n.parent_id === pid && !ids.has(n.id)) {
              ids.add(n.id);
              stack.push(n.id);
            }
          }
        }
        return ids;
      }

      const rootChildrenIds = all
        .filter((n) => n.parent_label === root.rootLabel)
        .map((n) => n.id);
      const allAllowedIds = collectDescendantIds(rootChildrenIds);

      // Find immediate sibling level: items that share the same parent
      const current = byId[navItemId];
      let siblingNavIds = new Set();
      if (current) {
        const siblingLevelIds = current.parent_id
          ? all.filter((n) => n.parent_id === current.parent_id).map((n) => n.id)
          : all.filter((n) => n.parent_label === root.rootLabel && !n.parent_id).map((n) => n.id);
        siblingNavIds = new Set(siblingLevelIds);
      }

      // Try sibling courses first
      let { data: courses } = await supabase
        .from('courses')
        .select('*')
        .in('nav_item_id', [...siblingNavIds])
        .neq('id', courseId)
        .eq('is_published', true);

      if (courses && courses.length > 0) return courses;

      // Fallback: same parent (go up one more level)
      if (current?.parent_id) {
        const parent = byId[current.parent_id];
        if (parent) {
          const uncleNavIds = parent.parent_id
            ? all.filter((n) => n.parent_id === parent.parent_id && n.id !== parent.id).map((n) => n.id)
            : [];
          if (uncleNavIds.length > 0) {
            const { data: cousins } = await supabase
              .from('courses')
              .select('*')
              .in('nav_item_id', uncleNavIds)
              .eq('is_published', true);
            if (cousins && cousins.length > 0) return cousins;
          }
        }
      }

      // Last resort: tag-based within same root section
      if (!tagsData.data || tagsData.data.length === 0) return [];

      const tagIds = tagsData.data.map((t) => t.tag_id);
      const { data: tagged } = await supabase
        .from('course_tags')
        .select('course_id')
        .in('tag_id', tagIds)
        .neq('course_id', courseId);

      if (!tagged || tagged.length === 0) return [];

      const relatedIds = [...new Set(tagged.map((t) => t.course_id))];
      const { data: tagCourses } = await supabase
        .from('courses')
        .select('*')
        .in('id', relatedIds)
        .in('nav_item_id', [...allAllowedIds])
        .eq('is_published', true);

      return tagCourses || [];
    },
    enabled: !!courseId,
    staleTime: 0,
  });
}

/* ---------- alumni companies ---------- */

export function useAlumniCompanies() {
  return useQuery({
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
}

/* ---------- footer ---------- */

export function useFooter() {
  return useQuery({
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
}

/* ---------- site settings (top bar + social) ---------- */

export function useSiteSettings() {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchOnMount: 'always',
  });
}

/* ---------- course tabs (labels + content type) ---------- */

export function useCourseTabs(courseId) {
  return useQuery({
    queryKey: ['courseTabs', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_tabs')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

/* ---------- course FAQs ---------- */

export function useFAQs(courseId) {
  return useQuery({
    queryKey: ['faqs', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });
}

/* ---------- nav category pages ---------- */

export function useNavPage(navItemId) {
  return useQuery({
    queryKey: ['navPage', navItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nav_pages')
        .select('*')
        .eq('nav_item_id', navItemId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!navItemId,
  });
}


/* ---------- home page sections ---------- */

export function useHomeSection(sectionKey) {
  return useQuery({
    queryKey: ['homeSection', sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('section_key', sectionKey)
        .maybeSingle();
      if (error) {
        if (error.code === '42P01') return null;
        throw error;
      }
      return data;
    },
    enabled: !!sectionKey,
  });
}

export function useHomeSections() {
  return useQuery({
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
}
