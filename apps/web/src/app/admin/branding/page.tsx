"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { toast, getErrorMessage } from "@/lib/toast";
import { usePageTitle } from "@/lib/use-page-title";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconPalette, IconUpload, IconCheck } from "@tabler/icons-react";

type BrandingConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
  companyName: string;
};

const defaultConfig: BrandingConfig = {
  primaryColor: "#3b82f6",
  secondaryColor: "#1e40af",
  accentColor: "#10b981",
  logoUrl: "",
  faviconUrl: "",
  customCss: "",
  companyName: "",
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-foreground w-36 shrink-0">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-border p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field font-mono text-sm w-28"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export default function BrandingPage() {
  usePageTitle("Branding");
  const [config, setConfig] = useState<BrandingConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ data: BrandingConfig }>("/api/admin/branding")
      .then((res) => {
        setConfig({ ...defaultConfig, ...res.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/admin/branding", config);
      toast.success("Branding settings saved");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.post<{ data: BrandingConfig }>(
        "/api/admin/branding/logo",
        formData,
      );
      setConfig(res.data);
      toast.success("Logo uploaded");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("favicon", file);
      const res = await api.post<{ data: BrandingConfig }>(
        "/api/admin/branding/favicon",
        formData,
      );
      setConfig(res.data);
      toast.success("Favicon uploaded");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingFavicon(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Branding"
          description="Customize platform branding"
        />
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">
            Loading branding settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Branding"
        description="Customize platform branding and theme"
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-sm flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <IconCheck size={14} />
                Save Changes
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="glass-card border border-border/80 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <IconPalette size={20} />
            </div>
            <div>
              <p className="font-semibold text-foreground">Colors</p>
              <p className="text-sm text-muted-foreground">
                Platform color scheme
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ColorField
              label="Primary"
              value={config.primaryColor}
              onChange={(v) => setConfig({ ...config, primaryColor: v })}
            />
            <ColorField
              label="Secondary"
              value={config.secondaryColor}
              onChange={(v) => setConfig({ ...config, secondaryColor: v })}
            />
            <ColorField
              label="Accent"
              value={config.accentColor}
              onChange={(v) => setConfig({ ...config, accentColor: v })}
            />
          </div>

          {/* Color preview */}
          <div className="flex gap-2 mt-3">
            <div
              className="h-10 flex-1 rounded-lg flex items-center justify-center text-[10px] font-medium text-white"
              style={{ backgroundColor: config.primaryColor }}
            >
              Primary
            </div>
            <div
              className="h-10 flex-1 rounded-lg flex items-center justify-center text-[10px] font-medium text-white"
              style={{ backgroundColor: config.secondaryColor }}
            >
              Secondary
            </div>
            <div
              className="h-10 flex-1 rounded-lg flex items-center justify-center text-[10px] font-medium text-white"
              style={{ backgroundColor: config.accentColor }}
            >
              Accent
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="glass-card border border-border/80 p-6 space-y-5">
          <div>
            <p className="font-semibold text-foreground">Company</p>
            <p className="text-sm text-muted-foreground">
              Branding information
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Company Name
            </label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) =>
                setConfig({ ...config, companyName: e.target.value })
              }
              placeholder="e.g. My LMS"
              className="field"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="glass-card border border-border/80 p-6 space-y-4">
          <div>
            <p className="font-semibold text-foreground">Logo</p>
            <p className="text-sm text-muted-foreground">
              Platform logo displayed in header
            </p>
          </div>

          <div className="flex items-center gap-4">
            {config.logoUrl && (
              <div className="h-16 w-32 shrink-0 overflow-hidden rounded border border-border bg-card flex items-center justify-center">
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                {uploadingLogo ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <IconUpload size={14} />
                )}
                {config.logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div className="glass-card border border-border/80 p-6 space-y-4">
          <div>
            <p className="font-semibold text-foreground">Favicon</p>
            <p className="text-sm text-muted-foreground">Browser tab icon</p>
          </div>

          <div className="flex items-center gap-4">
            {config.faviconUrl && (
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded border border-border bg-card flex items-center justify-center">
                <img
                  src={config.faviconUrl}
                  alt="Favicon"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            <div>
              <input
                ref={faviconInputRef}
                type="file"
                accept=".ico,.png,.jpg,.jpeg,.svg,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFaviconUpload(file);
                }}
              />
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploadingFavicon}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                {uploadingFavicon ? (
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                ) : (
                  <IconUpload size={14} />
                )}
                {config.faviconUrl ? "Replace Favicon" : "Upload Favicon"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="glass-card border border-border/80 p-6 space-y-4">
        <div>
          <p className="font-semibold text-foreground">Custom CSS</p>
          <p className="text-sm text-muted-foreground">
            Additional CSS overrides applied platform-wide
          </p>
        </div>
        <textarea
          value={config.customCss}
          onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
          placeholder="/* Custom CSS here */"
          rows={8}
          className="field font-mono text-sm w-full resize-y"
        />
      </div>
    </div>
  );
}
