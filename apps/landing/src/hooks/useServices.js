import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useServices(filters = {}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*, service_categories(name, slug, icon)')
        .order('sort_order');

      if (filters.status) query = query.eq('status', filters.status);
      else query = query.in('status', ['published', 'draft']);
      if (filters.featured) query = query.eq('featured', true);
      if (filters.popular) query = query.eq('popular', true);
      if (filters.trending) query = query.eq('trending', true);
      if (filters.category_id) query = query.eq('category_id', filters.category_id);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function usePublishedServices(filters = {}) {
  return useQuery({
    queryKey: ['publishedServices', filters],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*, service_categories(name, slug, icon)')
        .eq('status', 'published')
        .order('sort_order');

      if (filters.featured) query = query.eq('featured', true);
      if (filters.popular) query = query.eq('popular', true);
      if (filters.trending) query = query.eq('trending', true);
      if (filters.category_id) query = query.eq('category_id', filters.category_id);
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.not_id) query = query.neq('id', filters.not_id);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useService(slug) {
  return useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      const { data: service, error } = await supabase
        .from('services')
        .select('*, service_categories(*), service_benefits(*), service_steps(*), service_gallery(*), service_testimonials(*), service_faqs(*), service_statistics(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return service || null;
    },
    enabled: !!slug,
    staleTime: 0,
  });
}

export function useServiceById(id) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, service_categories(*), service_benefits(*), service_steps(*), service_gallery(*), service_testimonials(*), service_faqs(*), service_statistics(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!id,
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}
