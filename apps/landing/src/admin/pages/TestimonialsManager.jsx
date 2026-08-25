import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import DataTable from "../components/ui/DataTable";
import EmptyState from "../components/EmptyState";
import { FiStar, FiEdit3, FiTrash2 } from "react-icons/fi";
import PageShell from "../components/ui/PageShell";
import useConfirm from "../hooks/useConfirm";

function Stars({ rating }) {
  const count = Math.min(5, Math.max(0, parseInt(rating, 10) || 0));
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "fill-brand-orange text-brand-orange" : "text-gray-300"}`}
        />
      ))}
    </span>
  );
}

export default function TestimonialsManager() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("is_active", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data || []);
    setLoading(false);
  }

  async function toggleActive(row) {
    if (!row?.id) return;
    await supabase
      .from("testimonials")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    loadData();
  }

  async function deleteItem(id) {
    if (!id) return;
    if (!(await confirm("Delete this testimonial? This cannot be undone.")))
      return;
    await supabase.from("testimonials").delete().eq("id", id);
    loadData();
  }

  const columns = [
    {
      header: "SL NO",
      accessor: "slno",
      cell: (_, i) => (
        <span className="text-neutral-500 font-medium">{i + 1}</span>
      ),
      width: "80px",
    },
    {
      header: "Name",
      accessor: "name",
      cell: (row) => (
        <span className="font-semibold text-black">{row.name}</span>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      cell: (row) =>
        row.role || <span className="text-neutral-400 italic">—</span>,
    },
    {
      header: "Rating",
      accessor: "rating",
      cell: (row) => <Stars rating={row.rating} />,
    },
    {
      header: "Quote",
      accessor: "quote",
      cell: (row) => (
        <span className="text-neutral-600 line-clamp-1 max-w-[320px]">
          {row.quote}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      cell: (row) => (
        <button
          type="button"
          onClick={() => toggleActive(row)}
          title={
            row.is_active ? "Click to make inactive" : "Click to make active"
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${row.is_active ? "bg-blue-500" : "bg-gray-300"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row.is_active ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/admin/testimonials/${row.id}`)}
            className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors"
            title="Edit"
          >
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteItem(row.id)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      backTo="/admin"
      title="Testimonials"
      description="Testimonials shown here appear in the home page Testimonials section (up to 3 active testimonials are displayed on the home page). Use 'Status' toggle to control which ones are active."
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {items.length > 0 ? (
          <DataTable data={items} columns={columns} isLoading={loading} />
        ) : (
          <EmptyState
            icon={FiStar}
            title="No testimonials"
            description="Add a testimonial to list it in the home page Testimonials section."
          />
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}
