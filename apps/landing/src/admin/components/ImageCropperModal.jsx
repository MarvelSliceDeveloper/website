import React, { useState, useRef } from 'react';
import { FiX, FiCheck, FiZoomIn, FiMove } from 'react-icons/fi';

export default function ImageCropperModal({
  imageUrl,
  onClose,
  onCropSave,
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [presetPos, setPresetPos] = useState('top'); // 'top', 'center', 'bottom'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Quick Focal Position Presets
  function applyPreset(preset) {
    setPresetPos(preset);
    if (preset === 'top') {
      setPosition({ x: 0, y: 25 });
    } else if (preset === 'center') {
      setPosition({ x: 0, y: 0 });
    } else if (preset === 'bottom') {
      setPosition({ x: 0, y: -25 });
    }
  }

  function handleMouseDown(e) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  async function handleSave() {
    if (!imageUrl || processing) return;
    setProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const canvas = document.createElement('canvas');
      const targetSize = 400; // Output high-res square avatar
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      // Fill clean background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetSize, targetSize);

      // Compute scale and crop canvas coordinates based on zoom & offset
      const baseScale = Math.max(targetSize / img.width, targetSize / img.height);
      const drawWidth = img.width * baseScale * zoom;
      const drawHeight = img.height * baseScale * zoom;

      // Position math
      const offsetX = (targetSize - drawWidth) / 2 + position.x;
      const offsetY = (targetSize - drawHeight) / 2 + position.y;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      canvas.toBlob((blob) => {
        if (!blob) {
          setProcessing(false);
          return;
        }
        const croppedFile = new File([blob], `avatar_cropped_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCropSave(croppedFile, canvas.toDataURL('image/jpeg'));
        setProcessing(false);
        onClose();
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Failed to crop image:', err);
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Image Alignment & Crop Editor</h3>
            <p className="text-xs text-slate-500">Drag photo to adjust head position & alignment</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Interactive Canvas Viewport */}
        <div className="p-6 flex flex-col items-center select-none bg-slate-900/5">
          
          {/* Avatar Preview Ring */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-brand-blue/30 cursor-move bg-slate-200 flex items-center justify-center group"
          >
            {imageUrl ? (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            ) : (
              <span className="text-xs text-slate-400">No Image</span>
            )}

            {/* Drag Overlay Hint */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
              <span className="text-white text-xs font-semibold flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-xs">
                <FiMove className="w-3.5 h-3.5" /> Drag to align
              </span>
            </div>
          </div>

          {/* Quick Focal Presets */}
          <div className="mt-5 w-full">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
              Quick Head Alignment Presets
            </label>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => applyPreset('top')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  presetPos === 'top'
                    ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                👤 Top (Full Head)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('center')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  presetPos === 'center'
                    ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎯 Center
              </button>
              <button
                type="button"
                onClick={() => applyPreset('bottom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  presetPos === 'bottom'
                    ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔻 Bottom
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="mt-4 w-full max-w-xs space-y-1">
            <div className="flex justify-between items-center text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1"><FiZoomIn className="w-3.5 h-3.5 text-slate-500" /> Zoom level</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setPosition({ x: 0, y: 0 }); setZoom(1); setPresetPos('center'); }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
          >
            Reset Position
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={processing}
              className="px-5 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {processing ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              <span>Apply & Save Crop</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
