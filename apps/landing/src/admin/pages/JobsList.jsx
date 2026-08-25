import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import AdminButton from "../components/AdminButton";
import DataTable from "../components/ui/DataTable";
import EmptyState from "../components/EmptyState";
import {
  FiEdit3,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiArrowLeft,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";
import useConfirm from "../hooks/useConfirm";
import ExportDialog from "../components/ExportDialog";

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();
  const [exportModal, setExportModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("job_openings")
      .select("*, role_categories(name)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  }

  async function deleteJob(id) {
    if (
      await confirm(
        "Delete Job",
        "Are you sure you want to delete this job opening?",
        "Delete",
        "destructive",
      )
    ) {
      await supabase.from("job_openings").delete().eq("id", id);
      loadData();
    }
  }

  const columns = [
    {
      header: "SL NO",
      accessor: "slno",
      cell: (_, i) => (
        <span className="text-neutral-500 font-medium">{i + 1}</span>
      ),
    },
    {
      header: "Job Title",
      accessor: "title",
      cell: (row) => (
        <span className="font-semibold text-black">{row.title}</span>
      ),
    },
    {
      header: "Category",
      accessor: "role_categories",
      cell: (row) =>
        row.role_categories?.name || (
          <span className="text-neutral-400 italic">Uncategorized</span>
        ),
    },
    {
      header: "Location",
      accessor: "location",
      cell: (row) => row.location || "-",
    },
    { header: "Type", accessor: "type", cell: (row) => row.type || "-" },
    {
      header: "Status",
      accessor: "is_active",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"}`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/admin/jobs/${row.id}`)}
            className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors"
            title="Edit"
          >
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteJob(row.id)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const exportColumns = [
    { header: "SL NO", accessor: "slno", exportValue: (_, i) => i + 1 },
    { header: "Job Title", accessor: "title" },
    {
      header: "Category",
      accessor: "role_categories",
      exportValue: (row) => row.role_categories?.name || "Uncategorized",
    },
    { header: "Location", accessor: "location" },
    { header: "Type", accessor: "type" },
    { header: "Experience", accessor: "experience" },
    { header: "Salary", accessor: "salary" },
    { header: "Apply URL", accessor: "apply_url" },
    { header: "Description", accessor: "description" },
    {
      header: "Status",
      accessor: "is_active",
      exportValue: (row) => (row.is_active ? "Active" : "Inactive"),
    },
  ];

  return (
    <PageShell
      backTo="/admin"
      title="Job Openings"
      description="Manage your company's career opportunities"
      actions={
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <AdminButton
            onClick={() => setExportModal("csv")}
            variant="primary"
            size="sm"
          >
            Export CSV
          </AdminButton>
          <AdminButton
            onClick={() => setExportModal("pdf")}
            variant="primary"
            size="sm"
          >
            Export PDF
          </AdminButton>
        </div>
      }
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {jobs.length > 0 ? (
          <DataTable data={jobs} columns={columns} />
        ) : (
          <EmptyState
            icon={FiBriefcase}
            title="No jobs added"
            description="Get started by creating your first job opening."
          />
        )}
      </div>
      {confirmDialog}
      {exportModal && (
        <ExportDialog
          type={exportModal}
          data={jobs}
          columns={exportColumns}
          exportFilename="jobs"
          onClose={() => setExportModal(null)}
        />
      )}
    </PageShell>
  );
}
