import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FiUpload, FiX, FiCopy, FiLink } from 'react-icons/fi';

export default function ImageUploader({
  bucket = 'course-thumbnails',
  value = '',
  onChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    const filePath = `${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      setUploadError(`Upload failed. Use URL option below instead.`);
      setShowUrlInput(true);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const url = publicUrlData.publicUrl;
    setPreview(url);
    onChange(url);
    setUploading(false);
  }

  function handleUrlChange(url) {
    setPreview(url);
    onChange(url);
  }

  function copyUrl() {
    navigator.clipboard.writeText(value);
  }

  function remove() {
    setPreview('');
    onChange('');
    setShowUrlInput(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="cursor-pointer flex items-center gap-2 bg-admin-100 hover:bg-admin-200 text-sm px-4 py-2 rounded-md transition-colors">
          <FiUpload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`flex items-center gap-1 text-sm px-3 py-2 rounded-md transition-colors ${
            showUrlInput ? 'bg-admin-500/10 text-admin-500' : 'text-admin-500 hover:text-admin-500'
          }`}
          title="Paste image URL"
        >
          <FiLink className="w-3.5 h-3.5" />
          URL
        </button>
        {value && (
          <>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 text-sm text-admin-500 hover:text-admin-500"
              title="Copy URL"
            >
              <FiCopy className="w-3.5 h-3.5" />
              Copy
            </button>
            <button
              onClick={remove}
              className="flex items-center gap-1 text-sm text-destructive-500 hover:text-destructive-700"
              title="Remove"
            >
              <FiX className="w-3.5 h-3.5" />
              Remove
            </button>
          </>
        )}
      </div>

      {showUrlInput && (
        <div className="space-y-2">
          {uploadError && (
            <p className="text-xs text-warning-500 bg-warning-50 border border-warning-500 rounded-md px-3 py-2">
              {uploadError}
            </p>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste image URL here..."
            className="w-full px-3 py-2 border border-admin-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
          />
        </div>
      )}

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-40 h-28 object-cover rounded-md border border-admin-200"
        />
      )}
      {value && !preview && (
        <p className="text-xs text-text-gray truncate max-w-xs">{value}</p>
      )}
    </div>
  );
}
