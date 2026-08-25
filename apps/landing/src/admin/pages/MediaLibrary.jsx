import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminButton from "../components/AdminButton";
import {
  FiCopy,
  FiTrash2,
  FiUpload,
  FiSearch,
  FiCheck,
  FiX,
  FiGrid,
  FiList,
  FiFolder,
  FiFile,
  FiLayers,
  FiArrowLeft,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";
import useConfirm from "../hooks/useConfirm";

const BUCKETS = [
  "hero-images",
  "course-thumbnails",
  "certificates",
  "company-logos",
  "nav-icons",
  "pages",
];

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function listFilesRecursive(bucket, prefix = "") {
  const all = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, {
        limit,
        offset,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) break;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.id === null) {
        const sub = await listFilesRecursive(
          bucket,
          prefix ? `${prefix}/${item.name}` : item.name,
        );
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
  const url = supabase.storage.from(file._bucket).getPublicUrl(file._path)
    .data.publicUrl;

  return (
    <div
      className="fixed inset-0 bg-admin-900/60 flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-admin-200 max-w-2xl w-full max-h-[90vh] overflow-hidden cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-100">
          <h3 className="font-semibold text-black truncate">{file.name}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-6">
          <div className="sm:w-1/2 bg-white rounded-lg flex items-center justify-center min-h-[200px] overflow-hidden">
            <img
              src={url}
              alt={file.name}
              className="max-w-full max-h-[300px] object-contain"
            />
          </div>
          <div className="sm:w-1/2 space-y-3 text-sm">
            <div>
              <span className="text-neutral-500">Filename</span>
              <p className="font-medium text-black break-all">{file.name}</p>
            </div>
            <div>
              <span className="text-neutral-500">Bucket</span>
              <p className="font-medium text-black">
                <span className="inline-block px-2 py-0.5 bg-white text-neutral-500 rounded text-xs font-medium">
                  {file._bucket}
                </span>
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Path</span>
              <p className="font-medium text-black text-xs font-mono break-all">
                {file._path}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Size</span>
              <p className="font-medium text-black">
                {formatSize(file.metadata?.size)}
              </p>
            </div>
            {file.metadata?.mimetype && (
              <div>
                <span className="text-neutral-500">Type</span>
                <p className="font-medium text-black">
                  {file.metadata.mimetype}
                </p>
              </div>
            )}
            <div>
              <span className="text-neutral-500">Uploaded</span>
              <p className="font-medium text-black">
                {formatDate(file.created_at)}
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <AdminButton
                variant="ghost"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(url);
                }}
              >
                <FiCopy className="w-3.5 h-3.5" /> Copy URL
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const [confirm, confirmDialog] = useConfirm();
  const [bucket, setBucket] = useState("all");
  const [files, setFiles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadRef = useRef(null);
  const dropRef = useRef(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      if (bucket === "all") {
        const results = await Promise.all(
          BUCKETS.map((b) => listFilesRecursive(b)),
        );
        setFiles(results.flat());
      } else {
        setFiles(await listFilesRecursive(bucket));
      }
    } catch {}
    setLoading(false);
  }, [bucket]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (!search) {
      setFiltered(files);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(files.filter((f) => f.name.toLowerCase().includes(q)));
  }, [search, files]);

  function getUrl(file) {
    return supabase.storage.from(file._bucket).getPublicUrl(file._path).data
      .publicUrl;
  }

  async function handleUpload(e) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    if (bucket === "all") {
      alert("Select a specific bucket to upload files.");
      if (uploadRef.current) uploadRef.current.value = "";
      return;
    }
    for (const file of fileList) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      await supabase.storage.from(bucket).upload(path, file);
    }
    loadFiles();
    if (uploadRef.current) uploadRef.current.value = "";
  }

  async function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const fileList = e.dataTransfer.files;
    if (!fileList || fileList.length === 0) return;
    if (bucket === "all") {
      alert("Select a specific bucket to upload files.");
      return;
    }
    for (const file of fileList) {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      await supabase.storage.from(bucket).upload(path, file);
    }
    loadFiles();
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
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

  const isImage = (name) =>
    /\.(png|jpg|jpeg|gif|webp|svg|avif|bmp|ico)$/i.test(name);

  return (
    <PageShell
      backTo="/admin"
      title="Media Library"
      actions={
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AdminButton
            variant="primary"
            size="md"
            className="w-full sm:w-auto min-h-[44px] justify-center"
            disabled={bucket === "all"}
            onClick={() => uploadRef.current?.click()}
          >
            <FiUpload className="w-4 h-4" /> Upload
          </AdminButton>
          <input
            ref={uploadRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept="image/*,.pdf,.svg"
          />
        </div>
      }
    >
      {/* Mobile Bucket Selector Dropdown */}
      <div className="lg:hidden w-full mb-4">
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Bucket
        </label>
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
          className="w-full h-11 px-3.5 rounded-lg border border-admin-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
        >
          <option value="all">All Buckets</option>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop Bucket Sidebar */}
        <div className="hidden lg:flex w-48 shrink-0 flex-col gap-1 sticky top-6 self-start max-h-[calc(100vh-48px)] overflow-y-auto admin-scrollbar">
          <button
            onClick={() => setBucket("all")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              bucket === "all"
                ? "bg-admin-600 text-white"
                : "text-admin-600 hover:bg-admin-50"
            }`}
          >
            <FiLayers className="w-4 h-4" />
            All
          </button>
          {BUCKETS.map((b) => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bucket === b
                  ? "bg-admin-600 text-white"
                  : "text-admin-600 hover:bg-admin-50"
              }`}
            >
              <FiFolder className="w-4 h-4" />
              {b}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div
          className="flex-1 min-w-0"
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-black flex items-center gap-2 text-sm sm:text-base">
              {bucket === "all" ? "All Buckets" : bucket}
              <span className="text-xs font-normal text-neutral-400 bg-admin-100 px-2 py-0.5 rounded-full">
                {filtered.length} file{filtered.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files..."
                  className="w-full pl-9 pr-3 h-11 sm:h-9 border border-admin-200 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
                />
              </div>
              <div className="flex border border-admin-200 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 sm:p-2 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${viewMode === "grid" ? "bg-admin-600 text-white" : "bg-white text-admin-400 hover:text-admin-900"}`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 sm:p-2 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${viewMode === "list" ? "bg-admin-600 text-white" : "bg-white text-admin-400 hover:text-admin-900"}`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-admin-200 p-3 sm:p-6 bg-white">
            {isDragging && bucket !== "all" && (
              <div className="absolute inset-0 rounded-lg border-2 border-dashed border-admin-400 bg-white/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <FiUpload className="w-10 h-10 text-admin-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-neutral-700">
                    Drop files to upload
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-admin-100 rounded-lg aspect-[16/9] sm:aspect-[4/3]" />
                    <div className="mt-2 space-y-1.5">
                      <div className="h-3 bg-admin-100 rounded w-3/4" />
                      <div className="h-3 bg-admin-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-admin-100 rounded-full flex items-center justify-center mb-4">
                  <FiFile className="w-6 h-6 sm:w-7 sm:h-7 text-admin-400" />
                </div>
                <p className="text-sm text-neutral-500">
                  {search
                    ? "No files match your search."
                    : "This bucket is empty."}
                </p>
                {!search && bucket !== "all" && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="mt-4 min-h-[44px]"
                    onClick={() => uploadRef.current?.click()}
                  >
                    <FiUpload className="w-4 h-4" /> Upload your first file
                  </AdminButton>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {filtered.map((file) => (
                  <div
                    key={file._path}
                    className="group rounded-xl border border-admin-200 overflow-hidden bg-white min-w-0 w-full flex flex-col justify-between"
                  >
                    <button
                      onClick={() => setPreview(file)}
                      className="w-full block"
                    >
                      <div className="aspect-[16/9] sm:aspect-[4/3] bg-neutral-100 flex items-center justify-center overflow-hidden">
                        {isImage(file.name) ? (
                          <img
                            src={getUrl(file)}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <FiFile className="w-8 h-8 text-admin-300" />
                        )}
                      </div>
                    </button>
                    <div className="p-2.5 flex-1 flex flex-col justify-between min-w-0">
                      <div className="min-w-0">
                        <p
                          className="text-xs text-black truncate font-semibold break-all"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {formatSize(file.metadata?.size)}
                        </p>
                        {bucket === "all" && (
                          <p className="text-[10px] text-neutral-500/70 mt-0.5 truncate">
                            {file._bucket}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-admin-100">
                        <button
                          onClick={() => copyUrl(file)}
                          className="flex-1 min-h-[40px] text-xs text-admin-600 font-semibold hover:bg-neutral-100 rounded-lg px-2 py-1.5 transition-colors flex items-center justify-center gap-1 active:scale-95"
                        >
                          {copied === file._path ? (
                            <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5" />
                          )}
                          {copied === file._path ? "Copied" : "Copy"}
                        </button>
                        <button
                          onClick={() => deleteFile(file)}
                          className="min-h-[40px] min-w-[40px] text-xs text-destructive-500 hover:text-destructive-700 hover:bg-destructive-50 rounded-lg p-1.5 transition-colors flex items-center justify-center active:scale-95"
                          title="Delete file"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((file) => (
                  <div
                    key={file._path}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors min-w-0"
                  >
                    <button
                      onClick={() => setPreview(file)}
                      className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 border border-admin-100"
                    >
                      {isImage(file.name) ? (
                        <img
                          src={getUrl(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <FiFile className="w-5 h-5 text-admin-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-black truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {formatSize(file.metadata?.size)} &middot;{" "}
                        {formatDate(file.created_at)}
                        {bucket === "all" && (
                          <span>
                            {" "}
                            &middot;{" "}
                            <span className="text-neutral-500">
                              {file._bucket}
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => copyUrl(file)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="Copy URL"
                      >
                        {copied === file._path ? (
                          <FiCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FiCopy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteFile(file)}
                        className="min-h-[44px] px-3 text-xs font-semibold text-destructive-600 bg-destructive-50 hover:bg-destructive-100 rounded-lg transition-colors"
                      >
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

      {preview && (
        <PreviewModal file={preview} onClose={() => setPreview(null)} />
      )}
      {confirmDialog}
    </PageShell>
  );
}
