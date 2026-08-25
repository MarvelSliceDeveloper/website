import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/EmptyState';
import { FiEdit3, FiTrash2, FiTag, FiArrowLeft, FiX } from 'react-icons/fi';
import PageShell from "../components/ui/PageShell";
import { SubmitButton, CancelButton } from '../components/FormButtons';
import useConfirm from '../hooks/useConfirm';

export default function TagsList() {
  const [confirm, confirmDialog] = useConfirm();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTag, setEditTag] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from('tags')
      .select('*')
      .order('name');
    if (data) setTags(data);
    setLoading(false);
  }

  async function deleteTag(id) {
    if (await confirm('Delete Tag', 'Are you sure you want to delete this tag?', 'Delete', 'destructive')) {
      await supabase.from('tags').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: ['popularTags'] });
      loadData();
    }
  }

  async function saveTag() {
    if (!editTag || !editName.trim()) return;
    await supabase.from('tags').update({ name: editName.trim() }).eq('id', editTag.id);
    queryClient.invalidateQueries({ queryKey: ['popularTags'] });
    setEditTag(null);
    setEditName('');
    loadData();
  }

  const columns = [
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span> },
    { header: 'Tag Name', accessor: 'name', cell: (row) => <span className="font-medium text-black">{row.name}</span> },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => { setEditTag(row); setEditName(row.name); }} className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTag(row.id)} className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageShell backTo="/admin" 
      title="View Tags" 
      subtitle="Manage your content tags"
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {tags.length > 0 ? (
          <DataTable 
            data={tags} 
            columns={columns} 
            searchPlaceholder="Search tags..."
          />
        ) : (
          <EmptyState 
            icon={FiTag} 
            title="No tags found" 
            description="You haven't created any tags yet." 
          />
        )}
      </div>
      {confirmDialog}

      {editTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditTag(null)}>
          <div className="bg-white rounded-xl border border-admin-200 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-100">
              <h3 className="text-base font-semibold text-black">Edit Tag</h3>
              <button onClick={() => setEditTag(null)} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Tag Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveTag()}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Enter tag name..."
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-admin-100 bg-gray-50/50">
              <CancelButton onClick={() => setEditTag(null)} />
              <SubmitButton onClick={saveTag} label="Save" />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
