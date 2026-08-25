import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/ui/PageShell';
import { SubmitButton } from '../components/FormButtons';
import { FiUpload, FiTrash2 } from 'react-icons/fi';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwMessage, setPwMessage] = useState(null);
  const inputRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `admin/profiles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (error) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    } else {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      setProfilePic(data.publicUrl);
      setMessage(null);
    }
    setUploading(false);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('update_own_profile', {
      p_admin_id: user.id,
      p_full_name: name.trim() || null,
      p_profile_pic: profilePic || null,
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      updateUser({ name: data.full_name, profile_pic: data.profile_pic });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    }
    setSaving(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    const { data, error } = await supabase.rpc('change_own_password', {
      p_admin_id: user.id,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });
    if (error) {
      setPwMessage({ type: 'error', text: error.message });
    } else if (data?.error) {
      setPwMessage({ type: 'error', text: data.error });
    } else {
      setPwMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
  }

  return (
    <PageShell backTo="/admin" title="Profile Settings" subtitle="Manage your profile picture and password">
      <div className="max-w-2xl space-y-8">
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-admin-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-black">Profile Picture</h3>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-admin-200 bg-gray-50 shrink-0 flex items-center justify-center">
              {profilePic ? (
                <img src={profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-neutral-400">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-admin-200 rounded-lg text-sm text-neutral-600 hover:bg-gray-50 transition-colors">
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiUpload className="w-4 h-4" />
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                Upload Image
              </label>
              {profilePic && (
                <button type="button" onClick={() => { setProfilePic(''); setMessage(null); }}
                  className="inline-flex items-center gap-1.5 text-sm text-destructive-500 hover:text-destructive-600 transition-colors">
                  <FiTrash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all" />
          </div>

          {message && (
            <p className="text-sm" style={{ color: message.type === 'error' ? '#dc3545' : '#059669' }}>{message.text}</p>
          )}

          <SubmitButton type="submit" saving={saving} label="Save Profile" savingLabel="Saving..." />
        </form>

        <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-admin-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-black">Change Password</h3>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-transparent transition-all" />
            </div>
          </div>

          {pwMessage && (
            <p className="text-sm" style={{ color: pwMessage.type === 'error' ? '#dc3545' : '#059669' }}>{pwMessage.text}</p>
          )}

          <SubmitButton type="submit" saving={pwSaving} label="Change Password" savingLabel="Changing..." />
        </form>
      </div>
    </PageShell>
  );
}