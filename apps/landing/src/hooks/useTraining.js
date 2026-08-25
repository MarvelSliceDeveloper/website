import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useTrainingPrograms(filters = {}) {
  return useQuery({
    queryKey: ['trainingPrograms', filters],
    queryFn: async () => {
      let query = supabase
        .from('training_programs')
        .select('*, training_categories(name, slug, icon)')
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

export function usePublishedTraining(filters = {}) {
  return useQuery({
    queryKey: ['publishedTraining', filters],
    queryFn: async () => {
      let query = supabase
        .from('training_programs')
        .select('*, training_categories(name, slug, icon)')
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

export function useTrainingProgram(slug) {
  return useQuery({
    queryKey: ['trainingProgram', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*, training_categories(*), training_modules(*), training_skills(*), training_benefits(*), training_gallery(*), training_testimonials(*), training_faqs(*), training_statistics(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!slug,
    staleTime: 0,
  });
}

export function useTrainingById(id) {
  return useQuery({
    queryKey: ['trainingProgram', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_programs')
        .select('*, training_categories(*), training_modules(*), training_skills(*), training_benefits(*), training_gallery(*), training_testimonials(*), training_faqs(*), training_statistics(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
    enabled: !!id,
  });
}

export function useTrainingCategories() {
  return useQuery({
    queryKey: ['trainingCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}
