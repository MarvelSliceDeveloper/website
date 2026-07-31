import React, { useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ExportDialog({ type, data, columns, exportFilename, onClose }) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = data.filter(row => {
    if (dateRange === 'all') return true;
    const date = new Date(row.created_at);
    if (dateRange === 'today') return date.toDateString() === new Date().toDateString();
    if (dateRange === 'custom' && startDate && endDate) return date >= new Date(startDate) && date <= new Date(endDate);
    return true;
  });

  async function handleExport() {
    setLoading(true);
    try {
      if (type === 'csv') {
        const headers = columns.map(c => c.header).join(',');
        const csvRows = filtered.map((row, i) => {
          return columns.map(c => {
            const val = c.exportValue ? c.exportValue(row, i) : row[c.accessor];
            return '"' + String(val || '').replace(/"/g, '""') + '"';
          }).join(',');
        });
        const csv = [headers, ...csvRows].join('\\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${exportFilename || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const pdf = new jsPDF();
        const head = [columns.map(c => c.header)];
        const body = filtered.map((row, i) => {
          return columns.map(c => {
            const val = c.exportValue ? c.exportValue(row, i) : row[c.accessor];
            return String(val || '');
          });
        });
        pdf.setFontSize(16);
        pdf.text(exportFilename || 'Export', 14, 14);
        pdf.autoTable({ head, body, startY: 20 });
        pdf.save(`${exportFilename || 'export'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-admin-200">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-600 rounded">
          <FiX className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <FiDownload className="w-5 h-5 text-indigo-600" />
          </div>
          <div><h2 className="text-base font-semibold text-black">Export {type.toUpperCase()}</h2><p className="text-xs text-neutral-400 mt-0.5">Choose date range for the report</p></div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-1">Date Range</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-admin-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-neutral-500 mb-1">From</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-admin-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 mb-1">To</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-admin-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            </div>
          )}
          <button onClick={handleExport} disabled={loading || filtered.length === 0}
            className="w-full h-10 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? 'Exporting...' : `Export ${type.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
