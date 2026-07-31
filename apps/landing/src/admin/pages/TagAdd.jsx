import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiTag, FiX, FiArrowLeft } from 'react-icons/fi';
import PageShell from "../components/ui/PageShell";
import AdminButton from "../components/AdminButton";

export default function TagAdd() {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('tags')
      .insert({ name: name.trim() });
      
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['popularTags'] });
      setSuccess(true);
      setName('');
    }
    setLoading(false);
  }

  function handleClose() {
    setModalOpen(false);
    navigate('/admin/tags');
  }

  function handleAddAnother() {
    setSuccess(false);
    setName('');
  }

  return (
    <PageShell backTo="/admin" 
      title="Add Tag" 
      subtitle="Create a new tag for your courses and posts"
    >
      <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
        <div className="flex items-center justify-center py-20">
          <AdminButton 
            onClick={() => { setModalOpen(true); setSuccess(false); setName(''); }} 
            size="lg" 
            variant="primary"
            className="shadow-md hover:shadow-lg"
          >
            <FiPlus className="w-5 h-5 mr-1" />
            Add a tag
          </AdminButton>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-admin-200">
            <button 
              onClick={() => !loading && setModalOpen(false)} 
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-600 rounded"
              disabled={loading}
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <FiTag className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-black">New Tag</h2>
            </div>

            {!success ? (
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Tag Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Enter tag name"
                    disabled={loading}
                    autoFocus
                    className="w-full h-10 px-3 rounded-lg border border-admin-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full h-10 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Tag'}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-sm text-neutral-600 font-medium">Tag added successfully!</p>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleAddAnother}
                    className="flex-1 h-10 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Add Another
                  </button>
                  <button 
                    onClick={handleClose}
                    className="flex-1 h-10 bg-admin-600 text-white font-medium rounded-lg hover:bg-admin-700 transition-colors"
                  >
                    Close & View
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
