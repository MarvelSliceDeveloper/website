import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/ui/PageShell';
import { SubmitButton } from '../components/FormButtons';
import { FiUpload, FiTrash2, FiCheck, FiX, FiUser, FiShield, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { validateStrongPassword, getPasswordRequirementsList } from '../../lib/passwordValidation';

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
    const strongErr = validateStrongPassword(newPassword, { name: user?.name, email: user?.email });
    if (strongErr) {
      setPwMessage({ type: 'error', text: strongErr });
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
    <PageShell backTo="/admin" title="Profile Settings" subtitle="Manage your admin account, profile picture, and security credentials">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start w-full">
        
        {/* CARD 1: PROFILE INFORMATION */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue shrink-0">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Update your admin display name and avatar photo</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6 flex-1">
            {/* Avatar Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Profile Picture</label>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center shadow-xs">
                  {profilePic ? (
                    <img src={profilePic} alt={name || 'Admin'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-400">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all active:scale-95">
                    {uploading ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiUpload className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    <span>Upload New Photo</span>
                  </label>
                  
                  {profilePic && (
                    <button type="button" onClick={() => { setProfilePic(''); setMessage(null); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors w-fit">
                      <FiTrash2 className="w-3.5 h-3.5" /> Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Email Field (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input type="text" value={user?.email || ''} disabled readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed select-none" />
              <p className="text-[11px] text-slate-400 mt-1">Admin email address cannot be changed directly.</p>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                placeholder="Enter your full name" />
            </div>

            {message && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {message.type === 'error' ? <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" /> : <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <SubmitButton type="submit" saving={saving} label="Save" savingLabel="Saving..." />
          </div>
        </form>

        {/* CARD 2: PASSWORD & SECURITY */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <FiShield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Security & Password</h2>
              <p className="text-xs text-slate-500">Update your account password and security rules</p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                placeholder="Enter current password" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  placeholder="New password" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  placeholder="Confirm new password" />
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FiLock className="w-3.5 h-3.5 text-slate-500" />
                <span>Strong Password Requirements:</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {getPasswordRequirementsList(newPassword, { name: user?.name, email: user?.email }).map((req, i) => (
                  <div key={i} className={`flex items-center gap-1.5 font-medium ${req.met ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {req.met ? <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <FiX className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {pwMessage && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                pwMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {pwMessage.type === 'error' ? <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-500" /> : <FiCheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />}
                <span>{pwMessage.text}</span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <SubmitButton type="submit" saving={pwSaving} label="Update" savingLabel="Updating..." />
          </div>
        </form>

      </div>
    </PageShell>
  );
}