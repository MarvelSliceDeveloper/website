import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import { FiSave, FiUpload, FiTrash2, FiCheck, FiArrowLeft, FiMail, FiPhone, FiGlobe, FiMapPin } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';

function ImageUploader({ value, onChange, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `site/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
          placeholder="Paste image URL or upload..." />
        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-admin-200 rounded-lg text-sm text-neutral-500 hover:border-neutral-500 hover:text-neutral-700 transition-colors">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiUpload className="w-4 h-4" />
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {value && (
        <div className="mt-2 relative group rounded-lg overflow-hidden border border-admin-200">
          <img src={value} alt="" className="h-32 w-full object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-destructive-500 text-white rounded-full opacity-100 shadow-lg">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteSettings() {
const queryClient = useQueryClient();
  const [form, setForm] = useState({
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    address: '',
    hours_weekday: '',
    hours_saturday: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { dirty, reset } = useDirty([form], loading);

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
          const social = data.social_links || {};
          const hours = data.working_hours || {};
          setForm({
            logo_url: data.logo_url || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            twitter: social.twitter || '',
            facebook: social.facebook || '',
            instagram: social.instagram || '',
            linkedin: social.linkedin || '',
            address: data.address || '',
            hours_weekday: hours.weekday || '',
            hours_saturday: hours.saturday || '',
          });
        }
        setLoading(false);
      });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      logo_url: form.logo_url || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      social_links: {
        twitter: form.twitter || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        linkedin: form.linkedin || null,
      },
      address: form.address || null,
      working_hours: {
        weekday: form.hours_weekday || null,
        saturday: form.hours_saturday || null,
      },
      updated_at: new Date().toISOString(),
    };
    if (settingsId) {
      await supabase.from('site_settings').update(payload).eq('id', settingsId);
    } else {
      const { data } = await supabase.from('site_settings').insert(payload).select().single();
      if (data) setSettingsId(data.id);
    }
    queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
    setSaving(false);
    setSaved(true);
    reset();
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin" title=""
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} label="Page" top />

      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
        <div className="space-y-6">
          <div>
            <ImageUploader value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} label="Site Logo" />
          </div>

          <div className="border-t border-admin-100 pt-6">
            <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
              <FiMail className="w-4 h-4 text-cyan-600" /> Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                  placeholder="sales@marvelslice.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                    placeholder="+91 6380957390" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-admin-100 pt-6">
            <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
              <FiGlobe className="w-4 h-4 text-violet-500" /> Social Links
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'twitter', label: 'Twitter URL', placeholder: 'https://twitter.com/...' },
                { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
                { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
                { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/...' },
              ].map((s) => (
                <div key={s.key}>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{s.label}</label>
                  <input type="url" value={form[s.key]} onChange={(e) => setForm({ ...form, [s.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                    placeholder={s.placeholder} />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-admin-100 pt-6">
            <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-amber-500" /> Address &amp; Working Hours
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Full Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all resize-none"
                  placeholder="123 Tech Park, Chennai, Tamil Nadu, India"
                  rows={4} />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Weekdays</label>
                  <input type="text" value={form.hours_weekday} onChange={(e) => setForm({ ...form, hours_weekday: e.target.value })}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                    placeholder="10:00 AM - 7:00 PM" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Saturday</label>
                  <input type="text" value={form.hours_saturday} onChange={(e) => setForm({ ...form, hours_saturday: e.target.value })}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                    placeholder="10:00 AM - 3:00 PM" />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </form>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
    </PageShell>
  );
}
