import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiX,
  FiCheck,
  FiSearch,
} from "react-icons/fi";

const pad = (n) => String(n).padStart(2, "0");

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const PERIODS = ["AM", "PM"];

const YEAR_LIST = Array.from({ length: 2050 - 2000 + 1 }, (_, i) => 2000 + i);

const POPUP_ANIM = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.15, ease: "easeOut" },
};

const SUBPANEL_ANIM = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.12 },
};

function toDatePart(value) {
  return value ? value.slice(0, 10) : "";
}

function toTimePart(value) {
  return value && value.length >= 16 ? value.slice(11, 16) : "";
}

function toISODate(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function nextSlot() {
  const now = new Date();
  const total = now.getHours() * 60 + Math.ceil(now.getMinutes() / 30) * 30;
  const t = total >= 1440 ? 0 : total;
  return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
}

function todayLocalISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatTime(hhmm, fmt) {
  if (!hhmm) return "";
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Number(m[1]);
  const min = m[2];
  if (fmt === "24h") return `${pad(h)}:${min}`;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${min} ${ampm}`;
}

function h12to24(h12, period) {
  return period === "AM" ? h12 % 12 : h12 === 12 ? 12 : h12 + 12;
}

/* Three independent scrollable columns: Hour, Minute, Format. */
function TimeColumn({
  label,
  values,
  activeIdx,
  onSelect,
  input,
  onInput,
  onCommit,
  noInput,
  focusOnMount,
}) {
  const btnRefs = useRef({});
  const didFocus = useRef(false);

  useEffect(() => {
    if (focusOnMount && !didFocus.current && btnRefs.current[activeIdx]) {
      btnRefs.current[activeIdx].focus({ preventScroll: true });
      didFocus.current = true;
    }
  }, [focusOnMount, activeIdx]);

  useEffect(() => {
    if (btnRefs.current[activeIdx]) {
      btnRefs.current[activeIdx].scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx, values.length]);

  function onListKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = Math.min(activeIdx + 1, values.length - 1);
      onSelect(values[n]);
      btnRefs.current[n]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.max(activeIdx - 1, 0);
      onSelect(values[n]);
      btnRefs.current[n]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      onSelect(values[0]);
      btnRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      onSelect(values[values.length - 1]);
      btnRefs.current[values.length - 1]?.focus();
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-400 mb-1">
        {label}
      </div>
      {!noInput && (
        <input
          type="text"
          inputMode="numeric"
          value={input}
          onChange={onInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit();
            }
          }}
          onBlur={onCommit}
          aria-label={label}
          className="w-full h-8 text-center rounded-lg border border-admin-200 bg-neutral-50 text-sm tabular-nums text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
        />
      )}
      <div
        role="listbox"
        aria-label={label}
        onKeyDown={onListKeyDown}
        className="mt-1 h-40 overflow-y-auto admin-scrollbar py-0.5"
      >
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={i === activeIdx}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(v)}
            tabIndex={-1}
            className={`w-full h-8 rounded-lg text-sm tabular-nums transition-colors cursor-pointer ${
              i === activeIdx
                ? "bg-admin-600 text-white font-semibold shadow-sm shadow-admin-600/30"
                : "text-neutral-700 hover:bg-admin-50"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DateTimePicker({
  value = "",
  onChange,
  error,
  disabled,
  disablePast = false,
}) {
  const [openPanel, setOpenPanel] = useState(null);
  const [subPanel, setSubPanel] = useState(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [focusDay, setFocusDay] = useState(null);
  const [focusMonth, setFocusMonth] = useState(() => new Date().getMonth());
  const [yearQuery, setYearQuery] = useState("");
  const [focusYearIdx, setFocusYearIdx] = useState(0);
  const [format, setFormat] = useState("12h");
  const [draftH, setDraftH] = useState(12);
  const [draftM, setDraftM] = useState(0);
  const [hourEdit, setHourEdit] = useState("12");
  const [minEdit, setMinEdit] = useState("00");

  const rootRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const monthBtnRef = useRef(null);
  const yearBtnRef = useRef(null);
  const yearSearchRef = useRef(null);
  const dayRefs = useRef({});
  const monthRefs = useRef({});
  const yearRefs = useRef({});

  const datePart = toDatePart(value);
  const timePart = toTimePart(value);

  const selected = useMemo(
    () => (datePart ? new Date(`${datePart}T00:00:00`) : null),
    [datePart],
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayDate = useMemo(
    () =>
      selected
        ? selected.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
    [selected],
  );
  const displayTime = formatTime(timePart, format);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();

  const HOURS =
    format === "12h"
      ? Array.from({ length: 12 }, (_, i) => pad(i + 1))
      : Array.from({ length: 24 }, (_, i) => pad(i));
  const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));

  const h12 = draftH % 12 || 12;
  const period = draftH >= 12 ? "PM" : "AM";
  const hourActiveIdx = format === "12h" ? h12 - 1 : draftH;
  const minActiveIdx = draftM;
  const periodActiveIdx = period === "AM" ? 0 : 1;
  const previewTime =
    format === "12h"
      ? `${pad(h12)}:${pad(draftM)} ${period}`
      : `${pad(draftH)}:${pad(draftM)}`;

  /* ── Date ── */

  function openDate() {
    if (disabled) return;
    const base = selected || today;
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setFocusDay(base);
    setSubPanel(null);
    setYearQuery("");
    setOpenPanel("date");
  }

  function selectDate(day) {
    const time = timePart || nextSlot();
    onChange(`${toISODate(viewYear, viewMonth, day)}T${time}`);
    setOpenPanel(null);
    dateInputRef.current?.focus();
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setFocusDay(today);
  }

  function clearAll() {
    onChange("");
    setOpenPanel(null);
  }

  function moveMonth(dir) {
    const next = new Date(viewYear, viewMonth + dir, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setFocusDay(next);
    setSubPanel(null);
  }

  function moveFocus(dx, dy) {
    const base = focusDay || selected || today;
    const next = new Date(base);
    next.setDate(next.getDate() + dx + dy * 7);
    if (next.getMonth() !== viewMonth || next.getFullYear() !== viewYear) {
      setViewYear(next.getFullYear());
      setViewMonth(next.getMonth());
    }
    setFocusDay(next);
  }

  function onCalendarKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpenPanel(null);
      dateInputRef.current?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(-1, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(1, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveFocus(0, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveFocus(0, 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusDay(new Date(viewYear, viewMonth, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusDay(new Date(viewYear, viewMonth, daysInMonth));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const d = focusDay || selected || today;
      selectDate(d.getDate());
    }
  }

  const focusedKey = focusDay
    ? toISODate(focusDay.getFullYear(), focusDay.getMonth(), focusDay.getDate())
    : "";

  /* ── Month / Year sub-panels ── */

  function openSubPanel(kind) {
    setYearQuery("");
    if (kind === "month") {
      setFocusMonth(viewMonth);
    } else {
      setFocusYearIdx(Math.max(0, YEAR_LIST.indexOf(viewYear)));
    }
    setSubPanel(kind);
  }

  function toggleSubPanel(kind) {
    if (subPanel === kind) setSubPanel(null);
    else openSubPanel(kind);
  }

  function selectMonth(i) {
    setViewMonth(i);
    setFocusDay(new Date(viewYear, i, 1));
    setSubPanel(null);
    monthBtnRef.current?.focus();
  }

  function onMonthKeyDown(e) {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      setSubPanel(null);
      monthBtnRef.current?.focus();
      return;
    }
    let idx = focusMonth;
    let handled = true;
    if (e.key === "ArrowRight") idx = (idx + 1) % 12;
    else if (e.key === "ArrowLeft") idx = (idx + 11) % 12;
    else if (e.key === "ArrowDown") idx = Math.min(11, idx + 3);
    else if (e.key === "ArrowUp") idx = Math.max(0, idx - 3);
    else if (e.key === "Enter" || e.key === " ") {
      selectMonth(focusMonth);
      handled = false;
    } else handled = false;
    if (handled) {
      e.preventDefault();
      setFocusMonth(idx);
    }
  }

  const filteredYears = useMemo(() => {
    const q = yearQuery.trim();
    if (!q) return YEAR_LIST;
    return YEAR_LIST.filter((y) => String(y).startsWith(q));
  }, [yearQuery]);

  function selectYear(y) {
    setViewYear(y);
    setFocusDay(new Date(y, viewMonth, 1));
    setSubPanel(null);
    yearBtnRef.current?.focus();
  }

  function onYearKeyDown(e) {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      setSubPanel(null);
      yearBtnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusYearIdx((p) => Math.min(p + 1, filteredYears.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusYearIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusYearIdx(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusYearIdx(filteredYears.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const y = filteredYears[focusYearIdx];
      if (y != null) selectYear(y);
    }
  }

  useEffect(() => {
    if (openPanel === "date" && focusedKey && dayRefs.current[focusedKey]) {
      dayRefs.current[focusedKey].focus({ preventScroll: true });
    }
  }, [openPanel, focusedKey, viewYear, viewMonth]);

  useEffect(() => {
    if (
      openPanel === "date" &&
      subPanel === "month" &&
      monthRefs.current[focusMonth]
    ) {
      monthRefs.current[focusMonth].focus({ preventScroll: true });
    }
  }, [openPanel, subPanel, focusMonth]);

  useEffect(() => {
    if (openPanel === "date" && subPanel === "year") {
      yearSearchRef.current?.focus();
    }
  }, [openPanel, subPanel]);

  useEffect(() => {
    if (
      openPanel === "date" &&
      subPanel === "year" &&
      yearRefs.current[focusYearIdx]
    ) {
      yearRefs.current[focusYearIdx].scrollIntoView({ block: "nearest" });
    }
  }, [openPanel, subPanel, focusYearIdx, filteredYears.length]);

  useEffect(() => {
    setFocusYearIdx((p) => Math.min(p, Math.max(0, filteredYears.length - 1)));
  }, [filteredYears.length]);

  /* ── Time ── */

  function openTime() {
    if (disabled) return;
    const [h, m] = (timePart || nextSlot()).split(":").map(Number);
    setDraftH(h);
    setDraftM(m);
    setHourEdit(format === "12h" ? pad(h % 12 || 12) : pad(h));
    setMinEdit(pad(m));
    setOpenPanel("time");
  }

  function applyTime() {
    onChange(`${datePart || todayLocalISO()}T${pad(draftH)}:${pad(draftM)}`);
    setOpenPanel(null);
    timeInputRef.current?.focus();
  }

  function cancelTime() {
    setOpenPanel(null);
    timeInputRef.current?.focus();
  }

  function selectHour(v) {
    const n = parseInt(v, 10);
    setDraftH(format === "12h" ? h12to24(n, period) : n);
    setHourEdit(v);
  }

  function selectMinute(v) {
    setDraftM(parseInt(v, 10));
    setMinEdit(v);
  }

  function selectPeriod(p) {
    setDraftH(h12to24(h12, p));
  }

  function onHourInput(e) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHourEdit(v);
    const n = parseInt(v, 10);
    if (!v || Number.isNaN(n)) return;
    if (format === "12h" && n >= 1 && n <= 12) setDraftH(h12to24(n, period));
    else if (format === "24h" && n <= 23) setDraftH(n);
  }

  function commitHourEdit() {
    const n = parseInt(hourEdit, 10);
    if (hourEdit && !Number.isNaN(n)) {
      if (format === "12h" && n >= 1 && n <= 12) {
        setDraftH(h12to24(n, period));
        setHourEdit(pad(n));
        return;
      }
      if (format === "24h" && n <= 23) {
        setDraftH(n);
        setHourEdit(pad(n));
        return;
      }
    }
    setHourEdit(format === "12h" ? pad(h12) : pad(draftH));
  }

  function onMinInput(e) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMinEdit(v);
    const n = parseInt(v, 10);
    if (v && !Number.isNaN(n) && n <= 59) setDraftM(n);
  }

  function commitMinEdit() {
    const n = parseInt(minEdit, 10);
    if (minEdit && !Number.isNaN(n) && n <= 59) {
      setDraftM(n);
      setMinEdit(pad(n));
    } else {
      setMinEdit(pad(draftM));
    }
  }

  function toggleFormat() {
    const next = format === "12h" ? "24h" : "12h";
    setFormat(next);
    setHourEdit(next === "12h" ? pad(h12) : pad(draftH));
  }

  function clearTime() {
    onChange(datePart || "");
    setOpenPanel(null);
    timeInputRef.current?.focus();
  }

  function onTimePanelKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelTime();
    }
  }

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const chevronColor = (isOpen) =>
    isOpen ? "text-admin-500" : "text-neutral-300";

  return (
    <div ref={rootRef} className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ── Date ── */}
        <div className="relative">
          <button
            type="button"
            ref={dateInputRef}
            disabled={disabled}
            onClick={() =>
              openPanel === "date" ? setOpenPanel(null) : openDate()
            }
            onKeyDown={(e) => {
              if (
                ["ArrowDown", "Enter", " "].includes(e.key) &&
                openPanel !== "date"
              ) {
                e.preventDefault();
                openDate();
              }
            }}
            aria-haspopup="dialog"
            aria-expanded={openPanel === "date"}
            className={`w-full h-10 lg:h-9 pl-9 pr-14 rounded-lg border text-sm text-left transition-all cursor-pointer focus:outline-none focus:ring-2 flex items-center gap-2 ${
              error
                ? "border-destructive-500 ring-2 ring-destructive-100 text-neutral-900"
                : openPanel === "date"
                  ? "border-admin-500 ring-2 ring-admin-500/20 text-neutral-900"
                  : "border-admin-300 bg-neutral-50 hover:border-admin-400 text-neutral-900"
            } ${!value ? "text-neutral-400" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FiCalendar className="w-4 h-4 text-admin-400 shrink-0" />
            <span className="flex-1 truncate">
              {displayDate || "Select date"}
            </span>
          </button>
          {value && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear date"
              disabled={disabled}
              onClick={clearAll}
              className="absolute right-7 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
          <FiChevronDown
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${chevronColor(openPanel === "date")}`}
          />

          <AnimatePresence>
            {openPanel === "date" && (
              <motion.div
                key="date"
                role="dialog"
                aria-label="Select date"
                onKeyDown={onCalendarKeyDown}
                {...POPUP_ANIM}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-admin-200 shadow-[0_12px_32px_rgba(15,23,42,0.14)] p-4"
              >
                <div className="flex items-center gap-1 mb-3">
                  <button
                    type="button"
                    onClick={() => moveMonth(-1)}
                    aria-label="Previous month"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-admin-600 hover:bg-admin-100 transition-colors cursor-pointer"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    ref={monthBtnRef}
                    onClick={() => toggleSubPanel("month")}
                    aria-haspopup="listbox"
                    aria-expanded={subPanel === "month"}
                    className={`flex items-center gap-1 px-2 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      subPanel === "month"
                        ? "bg-admin-100 text-admin-700"
                        : "text-neutral-800 hover:bg-admin-50 hover:text-admin-700"
                    }`}
                  >
                    {MONTHS_SHORT[viewMonth]}
                    <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                  <button
                    type="button"
                    ref={yearBtnRef}
                    onClick={() => toggleSubPanel("year")}
                    aria-haspopup="listbox"
                    aria-expanded={subPanel === "year"}
                    className={`flex items-center gap-1 px-2 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      subPanel === "year"
                        ? "bg-admin-100 text-admin-700"
                        : "text-neutral-800 hover:bg-admin-50 hover:text-admin-700"
                    }`}
                  >
                    {viewYear}
                    <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => moveMonth(1)}
                    aria-label="Next month"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-admin-600 hover:bg-admin-100 transition-colors cursor-pointer"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="min-h-[230px]">
                  <AnimatePresence mode="wait" initial={false}>
                    {subPanel === "month" ? (
                      <motion.div
                        key="month"
                        {...SUBPANEL_ANIM}
                        onKeyDown={onMonthKeyDown}
                        className="grid grid-cols-3 gap-1"
                      >
                        {MONTHS_SHORT.map((m, i) => (
                          <button
                            key={m}
                            type="button"
                            ref={(el) => {
                              monthRefs.current[i] = el;
                            }}
                            onClick={() => selectMonth(i)}
                            className={`h-10 rounded-lg text-sm tabular-nums transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${
                              i === viewMonth
                                ? "bg-admin-600 text-white font-semibold shadow-sm shadow-admin-600/30"
                                : "text-neutral-700 hover:bg-admin-50 hover:text-admin-700"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </motion.div>
                    ) : subPanel === "year" ? (
                      <motion.div
                        key="year"
                        {...SUBPANEL_ANIM}
                        onKeyDown={onYearKeyDown}
                        className="flex flex-col"
                      >
                        <div className="relative mb-2">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                          <input
                            ref={yearSearchRef}
                            type="text"
                            inputMode="numeric"
                            value={yearQuery}
                            onChange={(e) => setYearQuery(e.target.value)}
                            placeholder="Search year…"
                            aria-label="Search year"
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-admin-300 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all"
                          />
                        </div>
                        <div className="max-h-44 overflow-y-auto admin-scrollbar p-0.5">
                          {filteredYears.length === 0 ? (
                            <p className="px-3 py-4 text-center text-xs text-neutral-400">
                              No years match “{yearQuery}”
                            </p>
                          ) : (
                            filteredYears.map((y, idx) => {
                              const isActive = idx === focusYearIdx;
                              const isSelected = y === viewYear;
                              return (
                                <button
                                  key={y}
                                  type="button"
                                  ref={(el) => {
                                    yearRefs.current[idx] = el;
                                  }}
                                  onClick={() => selectYear(y)}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm tabular-nums transition-colors cursor-pointer ${
                                    isActive
                                      ? "bg-admin-500/10 text-admin-700"
                                      : "text-neutral-700 hover:bg-admin-50"
                                  }`}
                                >
                                  <span>{y}</span>
                                  {isSelected && (
                                    <FiCheck className="w-4 h-4 text-admin-600" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="grid" {...SUBPANEL_ANIM}>
                        <div className="grid grid-cols-7 gap-1 mb-1">
                          {WEEKDAYS.map((w) => (
                            <div
                              key={w}
                              className="text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-400 py-1"
                            >
                              {w}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {cells.map((d, i) => {
                            if (d === null) return <div key={`b-${i}`} />;
                            const iso = toISODate(viewYear, viewMonth, d);
                            const dayDate = new Date(viewYear, viewMonth, d);
                            const isToday =
                              dayDate.getTime() === today.getTime();
                            const isSelected =
                              selected &&
                              selected.getTime() === dayDate.getTime();
                            const isFocused = focusedKey === iso;
                            const isPast =
                              disablePast &&
                              !isSelected &&
                              dayDate.getTime() < today.getTime();
                            return (
                              <button
                                key={iso}
                                type="button"
                                ref={(el) => {
                                  dayRefs.current[iso] = el;
                                }}
                                disabled={isPast}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectDate(d)}
                                className={`h-9 w-9 mx-auto rounded-lg text-sm tabular-nums transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${
                                  isSelected
                                    ? "bg-admin-600 text-white font-semibold shadow-sm shadow-admin-600/30"
                                    : isToday
                                      ? "text-admin-600 font-semibold ring-1 ring-inset ring-admin-500/40 hover:bg-admin-50"
                                      : isPast
                                        ? "text-neutral-300 cursor-not-allowed"
                                        : "text-neutral-700 hover:bg-admin-50 hover:text-admin-700"
                                } ${isFocused && !isSelected ? "ring-2 ring-admin-500/40" : ""}`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {subPanel === null && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-admin-100">
                    <button
                      type="button"
                      onClick={goToToday}
                      className="text-xs font-medium text-admin-600 hover:text-admin-700 hover:underline transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    {value && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-destructive-500 transition-colors cursor-pointer"
                      >
                        <FiX className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Time ── */}
        <div className="relative">
          <button
            type="button"
            ref={timeInputRef}
            disabled={disabled}
            onClick={() =>
              openPanel === "time" ? setOpenPanel(null) : openTime()
            }
            onKeyDown={(e) => {
              if (
                ["ArrowDown", "Enter", " "].includes(e.key) &&
                openPanel !== "time"
              ) {
                e.preventDefault();
                openTime();
              }
            }}
            aria-haspopup="dialog"
            aria-expanded={openPanel === "time"}
            className={`w-full h-10 lg:h-9 pl-9 pr-14 rounded-lg border text-sm text-left transition-all cursor-pointer focus:outline-none focus:ring-2 flex items-center gap-2 ${
              error
                ? "border-destructive-500 ring-2 ring-destructive-100 text-neutral-900"
                : openPanel === "time"
                  ? "border-admin-500 ring-2 ring-admin-500/20 text-neutral-900"
                  : "border-admin-300 bg-neutral-50 hover:border-admin-400 text-neutral-900"
            } ${!timePart ? "text-neutral-400" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FiClock className="w-4 h-4 text-admin-400 shrink-0" />
            <span className="flex-1 truncate">
              {displayTime || "Select time"}
            </span>
          </button>
          {timePart && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear time"
              disabled={disabled}
              onClick={clearTime}
              className="absolute right-7 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
          <FiChevronDown
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors ${chevronColor(openPanel === "time")}`}
          />

          <AnimatePresence>
            {openPanel === "time" && (
              <motion.div
                key="time"
                role="dialog"
                aria-label="Select time"
                onKeyDown={onTimePanelKeyDown}
                {...POPUP_ANIM}
                className="absolute left-0 top-[calc(100%+6px)] z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white border border-admin-200 shadow-[0_12px_32px_rgba(15,23,42,0.14)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-admin-100">
                  <span className="text-sm font-semibold text-neutral-800">
                    Select Time
                  </span>
                  <button
                    type="button"
                    onClick={toggleFormat}
                    aria-label={`Switch to ${format === "12h" ? "24-hour" : "12-hour"} format`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-admin-600 hover:text-admin-700 hover:bg-admin-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <FiClock className="w-3 h-3" />{" "}
                    {format === "12h" ? "12h" : "24h"}
                  </button>
                </div>

                <div className="px-4 pt-2 pb-1 text-center">
                  <span className="text-xl font-bold text-admin-600 tabular-nums tracking-tight">
                    {previewTime}
                  </span>
                </div>

                <div className="flex gap-3 px-4 py-3">
                  <TimeColumn
                    label="Hour"
                    values={HOURS}
                    activeIdx={hourActiveIdx}
                    onSelect={selectHour}
                    input={hourEdit}
                    onInput={onHourInput}
                    onCommit={commitHourEdit}
                    focusOnMount
                  />
                  <TimeColumn
                    label="Minute"
                    values={MINUTES}
                    activeIdx={minActiveIdx}
                    onSelect={selectMinute}
                    input={minEdit}
                    onInput={onMinInput}
                    onCommit={commitMinEdit}
                  />
                  {format === "12h" && (
                    <TimeColumn
                      label="Format"
                      values={PERIODS}
                      activeIdx={periodActiveIdx}
                      onSelect={selectPeriod}
                      noInput
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-admin-100 bg-neutral-50/60">
                  <button
                    type="button"
                    onClick={cancelTime}
                    className="px-3 h-8 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyTime}
                    className="px-4 h-8 rounded-lg text-sm font-semibold bg-admin-600 text-white hover:bg-admin-700 shadow-sm shadow-admin-600/30 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
