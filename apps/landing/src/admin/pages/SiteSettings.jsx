import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import {
  FiSave, FiUpload, FiTrash2, FiCheck, FiArrowLeft, FiMail, FiPhone, FiGlobe,
  FiMapPin
} from 'react-icons/fi';
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
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('pages').getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wider">{label}</label>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt={label} className="h-14 object-contain rounded-lg border border-admin-200 p-1 bg-white" />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-neutral-500 hover:text-black font-medium transition-colors"
            >
              {uploading ? 'Uploading…' : 'Change Image'}
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-admin-300 rounded-lg text-sm text-neutral-500 hover:text-black hover:border-black transition-colors"
        >
          <FiUpload className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload Logo'}
        </button>
      )}
    </div>
  );
}

import { formatPhoneNumber, extractPhoneNumbers } from '../../lib/phoneUtils';

export default function SiteSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    logo_url: '',
    contact_email: '',
    contact_phone_1: '',
    contact_phone_2: '',
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
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
    async function loadData() {
      try {
        const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();
        let settingsData = data;
        if (!settingsData && error?.code === 'PGRST116') {
          const { data: rows } = await supabase.from('site_settings').select('*').limit(1);
          settingsData = rows?.[0] || null;
        }

        if (settingsData) {
          setSettingsId(settingsData.id);
          const social = settingsData.social_links || {};
          const hours = settingsData.working_hours || {};
          const rawPhones = extractPhoneNumbers(settingsData.contact_phone || '');
          setForm({
            logo_url: settingsData.logo_url || '',
            contact_email: settingsData.contact_email || '',
            contact_phone_1: rawPhones[0] || (settingsData.contact_phone ? formatPhoneNumber(settingsData.contact_phone) : ''),
            contact_phone_2: rawPhones[1] || '',
            twitter: social.twitter || '',
            facebook: social.facebook || '',
            instagram: social.instagram || '',
            linkedin: social.linkedin || '',
            youtube: social.youtube || '',
            address: settingsData.address || '',
            hours_weekday: hours.weekday || '',
            hours_saturday: hours.saturday || '',
          });
        }
      } catch (err) {
        console.warn('Error loading site settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const formattedP1 = formatPhoneNumber(form.contact_phone_1);
    const formattedP2 = formatPhoneNumber(form.contact_phone_2);
    const combinedPhone = [formattedP1, formattedP2].filter(Boolean).join(', ');

    const payload = {
      logo_url: form.logo_url || null,
      contact_email: form.contact_email || null,
      contact_phone: combinedPhone || null,
      social_links: {
        twitter: form.twitter || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        linkedin: form.linkedin || null,
        youtube: form.youtube || null,
      },
      address: form.address || null,
      working_hours: {
        weekday: form.hours_weekday || null,
        saturday: form.hours_saturday || null,
      },
      updated_at: new Date().toISOString(),
    };

    try {
      let res;
      if (settingsId) {
        res = await supabase.from('site_settings').update(payload).eq('id', settingsId);
      } else {
        res = await supabase.from('site_settings').insert(payload).select().single();
        if (res.data?.id) setSettingsId(res.data.id);
      }
      if (res?.error) throw res.error;

      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving site settings:', err);
      setSaveError(err.message || 'Failed to save site settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin" title="Site Settings" subtitle="General brand assets, contact numbers, address and hours">
      <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} label="Page" top />

      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
          <div className="space-y-6">
            {/* Site Logo */}
            <div>
              <ImageUploader value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} label="Site Logo" />
            </div>

            {/* Contact Information */}
            <div className="border-t border-admin-100 pt-6">
              <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
                <FiMail className="w-4 h-4 text-cyan-600" /> Contact Information
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                    placeholder="sales@marvelslice.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Primary Phone (Phone 1)</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={form.contact_phone_1}
                      onChange={(e) => setForm({ ...form, contact_phone_1: e.target.value })}
                      onBlur={() => setForm(f => ({ ...f, contact_phone_1: formatPhoneNumber(f.contact_phone_1) }))}
                      className="w-full pl-9 pr-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                      placeholder="+91 63809 57390"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">E.g., +91 63809 57390</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Secondary Phone (Phone 2)</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={form.contact_phone_2}
                      onChange={(e) => setForm({ ...form, contact_phone_2: e.target.value })}
                      onBlur={() => setForm(f => ({ ...f, contact_phone_2: formatPhoneNumber(f.contact_phone_2) }))}
                      className="w-full pl-9 pr-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                      placeholder="+91 80882 18609"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">E.g., +91 80882 18609</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
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
                  { key: 'youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' },
                ].map((s) => (
                  <div key={s.key}>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{s.label}</label>
                    <input
                      type="url"
                      value={form[s.key]}
                      onChange={(e) => setForm({ ...form, [s.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                      placeholder={s.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Working Hours */}
            <div className="border-t border-admin-100 pt-6">
              <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-amber-500" /> Address &amp; Working Hours
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Full Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all resize-none"
                    placeholder="123 Tech Park, Chennai, Tamil Nadu, India"
                    rows={4}
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Weekdays</label>
                    <input
                      type="text"
                      value={form.hours_weekday}
                      onChange={(e) => setForm({ ...form, hours_weekday: e.target.value })}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                      placeholder="10:00 AM - 7:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Saturday</label>
                    <input
                      type="text"
                      value={form.hours_saturday}
                      onChange={(e) => setForm({ ...form, hours_saturday: e.target.value })}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all"
                      placeholder="10:00 AM - 3:00 PM"
                    />
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
