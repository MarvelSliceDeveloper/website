"use client";

import { useEffect, useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { toast, getErrorMessage } from "@/lib/toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { usePageTitle } from "@/lib/use-page-title";
import {
  IconLanguage,
  IconSearch,
  IconPlus,
  IconDeviceFloppy,
  IconArrowLeft,
} from "@tabler/icons-react";

type LocaleInfo = { locale: string; keyCount: number; completion: number };
type TranslationData = Record<string, unknown>;

export default function I18nPage() {
  usePageTitle("Localization");
  const [activeLocale, setActiveLocale] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationData>({});
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newLocale, setNewLocale] = useState("");

  const localesQuery = useApiQuery<{ data: LocaleInfo[]; enKeys: number }>(
    ["admin", "i18n", "locales"],
    "/api/admin/i18n/locales",
  );
  const locales = localesQuery.data?.data ?? [];
  const loading = localesQuery.isPending;

  const translationsQuery = useApiQuery<{ data: TranslationData }>(
    ["admin", "i18n", "translations", activeLocale ?? ""],
    activeLocale ? `/api/admin/i18n/${activeLocale}` : "",
    undefined,
    { enabled: Boolean(activeLocale) },
  );
  const loadingLocale = translationsQuery.isPending;

  useEffect(() => {
    if (translationsQuery.data) {
      setTranslations(translationsQuery.data.data);
    }
  }, [translationsQuery.data]);

  const openLocale = (locale: string) => {
    setActiveLocale(locale);
    setSearch("");
  };

  const saveMutation = useMutation({
    mutationFn: (translations: TranslationData) =>
      api.put(`/api/admin/i18n/${activeLocale}`, translations),
    onSuccess: () => {
      toast.success(`"${activeLocale}" translations saved`);
      void localesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleSave = () => {
    if (!activeLocale) return;
    saveMutation.mutate(translations);
  };

  const createMutation = useMutation({
    mutationFn: (locale: string) =>
      api.post("/api/admin/i18n/create", { locale }),
    onSuccess: () => {
      toast.success(`Locale "${newLocale.trim()}" created`);
      setNewLocale("");
      setShowCreate(false);
      void localesQuery.refetch();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const handleCreate = () => {
    if (!newLocale.trim()) return;
    createMutation.mutate(newLocale.trim());
  };

  const flatEntries = useMemo(() => {
    const entries: { key: string; value: string }[] = [];

    function flatten(obj: Record<string, unknown>, prefix = "") {
      for (const k of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        const val = obj[k];
        if (val && typeof val === "object" && !Array.isArray(val)) {
          flatten(val as Record<string, unknown>, fullKey);
        } else {
          entries.push({ key: fullKey, value: String(val ?? "") });
        }
      }
    }

    flatten(translations);
    return entries;
  }, [translations]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return flatEntries;
    const q = search.toLowerCase();
    return flatEntries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q),
    );
  }, [flatEntries, search]);

  const updateValue = (key: string, value: string) => {
    const parts = key.split(".");
    setTranslations((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as TranslationData;
      let current: Record<string, unknown> = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return updated;
    });
  };

  // Locale editor view
  if (activeLocale) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title={`${activeLocale.toUpperCase()} Translations`}
          description={`${flatEntries.length} keys`}
          breadcrumbs={[
            { label: "i18n", href: "/admin/i18n" },
            { label: activeLocale.toUpperCase(), href: "#" },
          ]}
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setActiveLocale(null)}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <IconArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {saveMutation.isPending ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                ) : (
                  <IconDeviceFloppy size={14} />
                )}
                Save
              </button>
            </div>
          }
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter keys..."
            className="field field-search w-full"
          />
        </div>

        {loadingLocale ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted animate-pulse">Loading translations...</p>
          </div>
        ) : (
          <div className="glass-card border border-border/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-4 w-[40%]">Key</th>
                    <th className="py-2.5 px-4">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry.key}
                      className="hover:bg-card-hover transition-colors"
                    >
                      <td className="py-2 px-4 font-mono text-muted-foreground">
                        {entry.key}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={entry.value}
                          onChange={(e) =>
                            updateValue(entry.key, e.target.value)
                          }
                          className="field text-xs py-1.5 w-full"
                        />
                      </td>
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No matching keys
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Locale list view
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="i18n Management"
        description="Manage translation locales and keys"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            <IconPlus size={14} />
            Add Locale
          </button>
        }
      />

      {/* Create locale form */}
      {showCreate && (
        <div className="glass-card border border-border/80 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">
            Create New Locale
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={newLocale}
              onChange={(e) => setNewLocale(e.target.value)}
              placeholder="e.g. hi, fr-FR, es"
              className="field text-sm w-48"
            />
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newLocale.trim()}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
              ) : (
                <IconPlus size={14} />
              )}
              Create
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewLocale("");
              }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Creates a copy of en.json as a starting template. Format: 2-letter
            code (e.g. &quot;hi&quot;) or language-region (e.g.
            &quot;fr-FR&quot;).
          </p>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading locales...</p>
        </div>
      ) : (
        <div className="glass-card border border-border/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-4">Locale</th>
                  <th className="py-2.5 px-4">Keys</th>
                  <th className="py-2.5 px-4">Completion</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {locales.map((loc) => (
                  <tr
                    key={loc.locale}
                    className="hover:bg-card-hover transition-colors cursor-pointer"
                    onClick={() => openLocale(loc.locale)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <IconLanguage size={16} className="text-primary" />
                        <span className="font-medium text-foreground">
                          {loc.locale}
                        </span>
                        {loc.locale === "en" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                            Base
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {loc.keyCount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(loc.completion, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground">
                          {loc.completion}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-primary text-xs font-medium">
                        Edit →
                      </span>
                    </td>
                  </tr>
                ))}
                {locales.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No locales found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
