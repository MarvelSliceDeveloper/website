import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import DateTimePicker from '../components/ui/DateTimePicker';

export default function UpcomingClassAdd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [courseName, setCourseName] = useState('');
  const [batch, setBatch] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadData() {
      if (isNew) return;
      const { data } = await supabase.from('upcoming_classes').select('*').eq('id', id).single();
      if (data) {
        setCourseName(data.course_name || '');
        setBatch(data.batch || '');
        setDateTime(data.date_time || '');
        setIsActive(data.is_active !== false);
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  async function handleSave() {
    const errs = {};
    if (!courseName.trim()) errs.courseName = 'Please enter the course name';
    if (!dateTime) errs.dateTime = 'Please set the date and time';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        course_name: courseName.trim(),
        batch: batch || null,
        date_time: dateTime,
        is_active: isActive,
      };
      let result;
      if (isNew) {
        result = await supabase.from('upcoming_classes').insert(payload);
      } else {
        result = await supabase.from('upcoming_classes').update(payload).eq('id', id);
      }
      if (result?.error) throw result.error;
      setSaved(true);
      setTimeout(() => navigate('/admin/upcoming-courses', { replace: true }), 500);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading upcoming class...</div>;

  return (
    <PageShell backTo="/admin/upcoming-courses" title={isNew ? 'Add Upcoming Class' : 'Edit Upcoming Class'}
      description="Classes listed here appear in the home page Upcoming Classes section. They are separate from courses."
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Upcoming Class" top />
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-black mb-1">Course Name <span className="text-destructive-500">*</span></label>
            <input value={courseName} onChange={(e) => { setCourseName(e.target.value); if (errors.courseName) setErrors((p) => ({ ...p, courseName: undefined })); }}
              placeholder="e.g. Full-Stack Web Development"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white ${errors.courseName ? 'border-destructive-500 ring-2 ring-destructive-100' : 'border-admin-200'}`} />
            {errors.courseName && <p className="text-xs text-destructive-500 mt-1.5">{errors.courseName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1">Batch</label>
            <select value={batch} onChange={(e) => setBatch(e.target.value)}
              className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white">
              <option value="">Select batch</option>
              <option value="Batch 1">Batch 1</option>
              <option value="Batch 2">Batch 2</option>
              <option value="Batch 3">Batch 3</option>
              <option value="Batch 4">Batch 4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-1">Date & Time <span className="text-destructive-500">*</span></label>
            <DateTimePicker
              value={dateTime}
              onChange={(v) => { setDateTime(v); if (errors.dateTime) setErrors((p) => ({ ...p, dateTime: undefined })); }}
              error={!!errors.dateTime}
            />
            {errors.dateTime && <p className="text-xs text-destructive-500 mt-1.5">{errors.dateTime}</p>}
          </div>
        </div>
        <div className="pt-4 mt-6 border-t border-admin-200">
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Status</label>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="ml-3 text-sm font-medium text-black align-middle">
            {isActive ? 'Active — visible on home page' : 'Inactive — hidden from home page'}
          </span>
        </div>
      </div>
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => navigate('/admin/upcoming-courses')} submitLabel="Save" />
    </PageShell>
  );
}
