import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/EmptyState';
import { FiCalendar, FiEdit3, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import useConfirm from '../hooks/useConfirm';
import { formatDateTime } from '../../lib/datetime';

export default function UpcomingCoursesManager() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from('upcoming_classes')
      .select('*')
      .order('is_active', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    setClasses(data || []);
    setSelectedIds([]);
    setLoading(false);
  }

  async function toggleActive(row) {
    if (!row?.id) return;
    await supabase.from('upcoming_classes').update({ is_active: !row.is_active }).eq('id', row.id);
    loadData();
  }

  async function deleteClass(id) {
    if (!id) return;
    if (!(await confirm('Delete this class? This cannot be undone.'))) return;
    await supabase.from('upcoming_classes').delete().eq('id', id);
    loadData();
  }

  const isAllSelected = classes.length > 0 && classes.every(c => selectedIds.includes(c.id));

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(classes.map(c => c.id));
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds([]);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (!(await confirm(`Delete ${count} selected upcoming class${count > 1 ? 'es' : ''}? This cannot be undone.`))) return;
    
    await supabase.from('upcoming_classes').delete().in('id', selectedIds);
    setClasses(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
    setSelectionMode(false);
  }

  const columns = [
    ...(selectionMode ? [{
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-admin-600 focus:ring-admin-500 cursor-pointer"
          title="Select All"
        />
      ),
      className: 'w-10 text-center',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelectOne(row.id)}
          className="w-4 h-4 rounded border-gray-300 text-admin-600 focus:ring-admin-500 cursor-pointer"
        />
      ),
    }] : []),
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span>, width: '80px' },
    { header: 'Course Name', accessor: 'course_name', cell: (row) => <span className="font-semibold text-black">{row.course_name}</span> },
    { header: 'Batch', accessor: 'batch', cell: (row) => row.batch ? (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{row.batch}</span>
    ) : <span className="text-neutral-400 italic">Not set</span> },
    { header: 'Date & Time', accessor: 'date_time', cell: (row) => row.date_time ? formatDateTime(row.date_time) : <span className="text-neutral-400 italic">Not set</span> },
    { header: 'Status', accessor: 'is_active', cell: (row) => (
      <button
        type="button"
        onClick={() => toggleActive(row)}
        title={row.is_active ? 'Click to make inactive' : 'Click to make active'}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${row.is_active ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    ) },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => navigate(`/admin/upcoming-courses/${row.id}`)} className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteClass(row.id)} className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageShell backTo="/admin"
      title="Upcoming Classes"
      description="Classes listed here appear in the home page Upcoming Classes section. They are separate from courses — use 'Make Active' to show a class on the home page."
      actions={
        classes.length > 0 ? (
          <div className="flex items-center gap-2">
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-admin-200 bg-white text-neutral-700 hover:bg-slate-50 hover:border-neutral-300 transition-all shadow-xs cursor-pointer"
              >
                <FiCheckSquare className="w-4 h-4 text-admin-600" />
                Select to Delete
              </button>
            ) : (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <FiCheckSquare className="w-3.5 h-3.5 text-admin-600" />
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null
      }
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {classes.length > 0 ? (
          <DataTable data={classes} columns={columns} isLoading={loading} />
        ) : (
          <EmptyState icon={FiCalendar} title="No upcoming classes"
            description="Add a class to list it in the home page Upcoming Classes section." />
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}
