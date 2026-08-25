import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiSearch } from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import Reveal from "../components/ui/Reveal";
import { formatDateTime } from "../lib/datetime";

export default function AllUpcomingClasses() {
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["upcomingClasses", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upcoming_classes")
        .select("*")
        .eq("is_active", true)
        .order("date_time", { ascending: true });
      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }
      return (data || []).sort(
        (a, b) => new Date(a.date_time) - new Date(b.date_time),
      );
    },
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-12 sm:pt-6 sm:pb-16">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm mb-3 sm:mb-4 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
              All Upcoming Classes
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Reserve your seat for our upcoming training batches.
            </p>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-full mt-3" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-5 flex flex-col"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center shrink-0">
                      <FiBookOpen className="w-4 h-4 text-brand-blue" />
                    </div>
                    <h3 className="flex-1 font-bold text-slate-800 text-lg leading-tight">
                      {cls.course_name}
                    </h3>
                  </div>
                  {cls.date_time && (
                    <p className="text-slate-500 text-sm mt-4 flex-1">
                      {formatDateTime(cls.date_time)}
                    </p>
                  )}
                  {cls.seats_left != null && Number(cls.seats_left) <= 5 && (
                    <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-orange text-white text-xs font-medium w-fit">
                      🔥 Only 5 Seats Left
                    </span>
                  )}
                  <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={cls.registration_link || "/contact"}
                      className="inline-flex items-center justify-center bg-brand-orange text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#e0951f] hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Register
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FiSearch className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                No upcoming classes right now — check back soon!
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-semibold rounded-full bg-brand-orange text-white hover:bg-[#e0951f] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
