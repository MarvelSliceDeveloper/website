import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import useDirty from '../hooks/useDirty';
import PageShell from '../components/ui/PageShell';
import ImageUploader from '../components/ImageUploader';
import SaveCancelBar from '../components/SaveCancelBar';
import SaveBar from '../components/SaveBar';

export default function BlogPageEditor() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const [heroImage, setHeroImage] = useState('');
  const [heading, setHeading] = useState('Latest Articles & News');
  const [subheading, setSubheading] = useState('Insights, tutorials, and stories from the Marvel Slice team');

  const { dirty, reset } = useDirty([heroImage, heading, subheading], loading);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!data && error?.code === 'PGRST116') {
          return supabase.from('site_settings').select('*').limit(1).then(({ data: rows }) => {
            data = rows?.[0] || null;
          });
        }
        return data;
      })
      .then((data) => {
        if (data) {
          setSettingsId(data.id);
          if (data.blog_hero_image) setHeroImage(data.blog_hero_image);
          if (data.blog_heading) setHeading(data.blog_heading);
          if (data.blog_subheading) setSubheading(data.blog_subheading);
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    const payload = {
      blog_hero_image: heroImage || null,
      blog_heading: heading,
      blog_subheading: subheading,
    };
    let res;
    if (settingsId) {
      res = await supabase.from('site_settings').update(payload).eq('id', settingsId);
    } else {
      res = await supabase.from('site_settings').insert(payload).select().single();
      if (res.data) setSettingsId(res.data.id);
    }
    if (res.error) {
      setSaveError(res.error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all';

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <PageShell backTo="/admin" title="">
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <div className="flex flex-col">
        <form onSubmit={handleSave} className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 space-y-6">
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                <input type="text" value={heading} onChange={(e) => setHeading(e.target.value)} className={inputClass}
                  placeholder="Latest Articles & News" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
                <input type="text" value={subheading} onChange={(e) => setSubheading(e.target.value)} className={inputClass}
                  placeholder="Insights, tutorials, and stories from the Marvel Slice team" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Hero Image</label>
              <ImageUploader value={heroImage} onChange={(url) => setHeroImage(url)} />
            </div>
          </div>
        </form>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
      </div>
    </PageShell>
  );
}