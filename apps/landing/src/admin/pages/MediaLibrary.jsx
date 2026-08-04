import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdminButton from '../components/AdminButton';
import { FiCopy, FiTrash2, FiUpload, FiSearch, FiCheck, FiX, FiGrid, FiList, FiFolder, FiFile, FiLayers, FiArrowLeft } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import useConfirm from '../hooks/useConfirm';

const BUCKETS = ['hero-images', 'course-thumbnails', 'certificates', 'company-logos', 'nav-icons', 'pages'];

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function listFilesRecursive(bucket, prefix = '') {
  const all = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit, offset, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) break;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.id === null) {
        const sub = await listFilesRecursive(bucket, prefix ? `${prefix}/${item.name}` : item.name);
        all.push(...sub);
      } else {
        const filePath = prefix ? `${prefix}/${item.name}` : item.name;
        all.push({ ...item, _path: filePath, _bucket: bucket });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

function PreviewModal({ file, onClose }) {
  if (!file) return null;
  const url = supabase.storage.from(file._bucket).getPublicUrl(file._path).data.publicUrl;

  return (
    <div className="fixed inset-0 bg-admin-900/60 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-lg border border-admin-200 max-w-2xl w-full max-h-[90vh] overflow-hidden cursor-pointer" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-100">
          <h3 className="font-semibold text-black truncate">{file.name}</h3>
          <button onClick={onClose} className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-6">
          <div className="sm:w-1/2 bg-white rounded-lg flex items-center justify-center min-h-[200px] overflow-hidden">
            <img src={url} alt={file.name} className="max-w-full max-h-[300px] object-contain" />
          </div>
          <div className="sm:w-1/2 space-y-3 text-sm">
            <div><span className="text-neutral-500">Filename</span><p className="font-medium text-black break-all">{file.name}</p></div>
            <div><span className="text-neutral-500">Bucket</span><p className="font-medium text-black"><span className="inline-block px-2 py-0.5 bg-white text-neutral-500 rounded text-xs font-medium">{file._bucket}</span></p></div>
            <div><span className="text-neutral-500">Path</span><p className="font-medium text-black text-xs font-mono break-all">{file._path}</p></div>
            <div><span className="text-neutral-500">Size</span><p className="font-medium text-black">{formatSize(file.metadata?.size)}</p></div>
            {file.metadata?.mimetype && <div><span className="text-neutral-500">Type</span><p className="font-medium text-black">{file.metadata.mimetype}</p></div>}
            <div><span className="text-neutral-500">Uploaded</span><p className="font-medium text-black">{formatDate(file.created_at)}</p></div>
            <div className="pt-2 flex gap-2">
              <AdminButton variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(url); }}><FiCopy className="w-3.5 h-3.5" /> Copy URL</AdminButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary() {
const [confirm, confirmDialog] = useConfirm();
  const [bucket, setBucket] = useState('all');
  const [files, setFiles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadRef = useRef(null);
  const dropRef = useRef(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      if (bucket === 'all') {
        const results = await Promise.all(BUCKETS.map(b => listFilesRecursive(b)));
        setFiles(results.flat());
      } else {
        setFiles(await listFilesRecursive(bucket));
      }
    } catch {}
    setLoading(false);
  }, [bucket]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  useEffect(() => {
    if (!search) { setFiltered(files); return; }
    const q = search.toLowerCase();
    setFiltered(files.filter(f => f.name.toLowerCase().includes(q)));
  }, [search, files]);

  function getUrl(file) {
    return supabase.storage.from(file._bucket).getPublicUrl(file._path).data.publicUrl;
  }

  async function handleUpload(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    if (bucket === 'all') {
      alert('Select a specific bucket to upload files.');
      if (uploadRef.current) uploadRef.current.value = '';
      return;
    }
    for (const file of fileList) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await supabase.storage.from(bucket).upload(path, file);
    }
    loadFiles();
    if (uploadRef.current) uploadRef.current.value = '';
  }

  async function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const fileList = e.dataTransfer.files;
    if (!fileList || fileList.length === 0) return;
    if (bucket === 'all') {
      alert('Select a specific bucket to upload files.');
      return;
    }
    for (const file of fileList) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await supabase.storage.from(bucket).upload(path, file);
    }
    loadFiles();
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }

  async function deleteFile(file) {
    if (!(await confirm(`Delete "${file.name}"?`))) return;
    await supabase.storage.from(file._bucket).remove([file._path]);
    loadFiles();
  }

  function copyUrl(file) {
    navigator.clipboard.writeText(getUrl(file));
    setCopied(file._path);
    setTimeout(() => setCopied(null), 2000);
  }

  const isImage = (name) => /\.(png|jpg|jpeg|gif|webp|svg|avif|bmp|ico)$/i.test(name);

  return (
    <PageShell backTo="/admin"
      title="Media Library"
      actions={
        <div className="flex items-center gap-3 self-start sm:self-auto">
<AdminButton variant="primary" size="md" disabled={bucket === 'all'} onClick={() => uploadRef.current?.click()}>
            <FiUpload className="w-4 h-4" /> Upload
          </AdminButton>
          <input ref={uploadRef} type="file" multiple onChange={handleUpload} className="hidden" accept="image/*,.pdf,.svg" />
        </div>
      }
    >
      <div className="flex gap-6">
        <div className="w-48 shrink-0 flex flex-col gap-1 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto admin-scrollbar">
          <button onClick={() => setBucket('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              bucket === 'all' ? 'bg-admin-600 text-white' : 'text-admin-600 hover:bg-admin-50'
            }`}
          >
            <FiLayers className="w-4 h-4" />All
          </button>
          {BUCKETS.map((b) => (
            <button key={b} onClick={() => setBucket(b)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bucket === b ? 'bg-admin-600 text-white' : 'text-admin-600 hover:bg-admin-50'
              }`}
            >
              <FiFolder className="w-4 h-4" />{b}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0"
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-black flex items-center gap-2">
              {bucket === 'all' ? 'All Buckets' : bucket}
              <span className="text-xs font-normal text-neutral-400 bg-admin-100 px-2 py-0.5 rounded-full">{filtered.length} file{filtered.length !== 1 ? 's' : ''}</span>
            </h2>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="w-48 pl-9 pr-3 h-9 border border-admin-200 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
                />
              </div>
              <div className="flex border border-admin-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-admin-600 text-white' : 'bg-white text-admin-400 hover:text-admin-900'}`}>
                  <FiGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-admin-600 text-white' : 'bg-white text-admin-400 hover:text-admin-900'}`}>
                  <FiList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-admin-200 p-6">
          {isDragging && bucket !== 'all' && (
            <div className="absolute inset-0 rounded-lg border-2 border-dashed border-admin-400 bg-white/80 flex items-center justify-center z-10">
              <div className="text-center">
                <FiUpload className="w-10 h-10 text-admin-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-700">Drop files to upload</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-admin-100 rounded-lg aspect-[4/3]" />
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-admin-100 rounded w-3/4" />
                    <div className="h-3 bg-admin-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-admin-100 rounded-full flex items-center justify-center mb-4">
                <FiFile className="w-7 h-7 text-admin-400" />
              </div>
              <p className="text-neutral-500">{search ? 'No files match your search.' : 'This bucket is empty.'}</p>
              {!search && bucket !== 'all' && (
                <AdminButton variant="secondary" size="sm" className="mt-4" onClick={() => uploadRef.current?.click()}>
                  <FiUpload className="w-4 h-4" /> Upload your first file
                </AdminButton>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filtered.map((file) => (
                <div key={file._path} className="group rounded-lg border border-admin-200 overflow-hidden bg-white">
                  <button onClick={() => setPreview(file)} className="w-full block">
                    <div className="aspect-[4/3] bg-white flex items-center justify-center overflow-hidden">
                      {isImage(file.name) ? (
                        <img src={getUrl(file)} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <FiFile className="w-8 h-8 text-admin-300" />
                      )}
                    </div>
                  </button>
                  <div className="p-2.5">
                    <p className="text-xs text-black truncate font-medium">{file.name}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{formatSize(file.metadata?.size)}</p>
                    {bucket === 'all' && (
                      <p className="text-[10px] text-neutral-500/70 mt-0.5 truncate">{file._bucket}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-admin-100 opacity-100">
                      <button onClick={() => copyUrl(file)}
                        className="flex-1 text-[11px] text-admin-600 hover:bg-white rounded px-1.5 py-1 transition-colors flex items-center justify-center gap-1">
                        {copied === file._path ? <FiCheck className="w-3 h-3 text-success-500" /> : <FiCopy className="w-3 h-3" />}
                        {copied === file._path ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={() => deleteFile(file)}
                        className="text-[11px] text-destructive-500 hover:text-destructive-700 hover:bg-destructive-50 rounded px-1.5 py-1 transition-colors flex items-center gap-1">
                        <FiTrash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((file) => (
                <div key={file._path} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white transition-colors group">
                  <button onClick={() => setPreview(file)} className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 border border-admin-100">
                    {isImage(file.name) ? (
                      <img src={getUrl(file)} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <FiFile className="w-5 h-5 text-admin-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black truncate">{file.name}</p>
                    <p className="text-xs text-neutral-400">
                      {formatSize(file.metadata?.size)} &middot; {formatDate(file.created_at)}
                      {bucket === 'all' && <span> &middot; <span className="text-neutral-500">{file._bucket}</span></span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 shrink-0">
                    <button onClick={() => copyUrl(file)} className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors" title="Copy URL">
                      {copied === file._path ? <FiCheck className="w-4 h-4 text-success-500" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteFile(file)} className="px-2.5 py-1.5 text-xs font-medium text-destructive-600 bg-destructive-50 hover:bg-destructive-100 rounded-md transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
      {confirmDialog}
    </PageShell>
  );
}
