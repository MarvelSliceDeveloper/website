import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

export function useBlogPosts({
  category,
  tag,
  search,
  page = 1,
  perPage = 9,
} = {}) {
  return useQuery({
    queryKey: ["blogPosts", { category, tag, search, page, perPage }],
    queryFn: async () => {
      let catId = null;
      if (category) {
        const { data: found } = await supabase
          .from("blog_categories")
          .select("id")
          .eq("slug", category)
          .maybeSingle();
        if (found) {
          catId = found.id;
        } else {
          return { posts: [], total: 0 };
        }
      }

      let query = supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)", { count: "exact" })
        .eq("is_published", true);

      if (catId) query = query.eq("category_id", catId);

      query = query.order("published_at", { ascending: false });
      if (search) {
        query = query.ilike("title", `%${search}%`);
      }
      if (tag) {
        const { data: matchedTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tag)
          .single();
        if (matchedTag) {
          const { data: postIds } = await supabase
            .from("blog_post_tags")
            .select("post_id")
            .eq("tag_id", matchedTag.id);
          if (postIds && postIds.length > 0) {
            query = query.in(
              "id",
              postIds.map((p) => p.post_id),
            );
          } else {
            return { posts: [], total: 0 };
          }
        }
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { posts: data || [], total: count || 0 };
    },
  });
}

export function useBlogPost(slug) {
  return useQuery({
    queryKey: ["blogPost", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const { data: tags } = await supabase
          .from("blog_post_tags")
          .select("tag_id, tags(id, name)")
          .eq("post_id", data.id);
        data.tags = (tags || []).map((t) => t.tags).filter(Boolean);
      }
      return data;
    },
    enabled: !!slug,
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blogCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentPosts(limit = 5) {
  return useQuery({
    queryKey: ["recentPosts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, title, slug, excerpt, image_url, published_at, blog_categories(name, slug)",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePopularTags() {
  return useQuery({
    queryKey: ["popularTags"],
    queryFn: async () => {
      const { data: usedIds } = await supabase
        .from("blog_post_tags")
        .select("tag_id");
      const ids = [...new Set((usedIds || []).map((t) => t.tag_id))];
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .in("id", ids)
        .order("name")
        .limit(15);
      if (error) throw error;
      return data || [];
    },
  });
}
