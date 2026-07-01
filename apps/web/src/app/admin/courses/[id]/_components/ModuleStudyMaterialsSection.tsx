"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Resource {
  id: string;
  name: string;
  originalName: string;
  url: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  resources?: Resource[];
}

interface Props {
  courseId: string;
  modules: Module[];
  onResourcesUpdated: () => void;
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return "\uD83D\uDCC4";
  if (fileType.includes("word") || fileType.includes("document")) return "\uD83D\uDCDD";
  if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "\uD83D\uDCCA";
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "\uD83D\uDCCA";
  if (fileType.includes("image")) return "\uD83D\uDDBC\uFE0F";
  return "\uD83D\uDCCE";
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default function ModuleStudyMaterialsSection({
  courseId,
  modules,
  onResourcesUpdated,
}: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    modules[0]?.id || null
  );
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  useEffect(() => {
    Promise.resolve().then(() => {
      setResources(selectedModule?.resources as Resource[] || []);
    });
  }, [selectedModule]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError("File type not allowed. Please upload PDF, DOCX, PPTX, XLSX, or image files.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large. Maximum size is 50 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("resource", file);

      const resource = await api.post<Resource>(
        `/api/admin/courses/${courseId}/modules/${selectedModuleId}/resources`,
        uploadData
      );

      setResources((prev) => [...prev, resource]);
      setUploadSuccess("File uploaded successfully!");
      onResourcesUpdated();
      e.target.value = "";
      setTimeout(() => setUploadSuccess(""), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Delete this resource?")) return;
    setDeleting(resourceId);
    try {
      await api.delete(
        `/api/admin/courses/modules/${selectedModuleId}/resources/${resourceId}`
      );
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      onResourcesUpdated();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to delete resource");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Select Module</label>
        <select
          value={selectedModuleId || ""}
          onChange={(e) => setSelectedModuleId(e.target.value)}
          className="field"
        >
          <option value="">-- Choose a module --</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>

      {selectedModuleId ? (
        <div className="space-y-4">
          <div className="glass-card p-6 space-y-4 border-2 border-dashed border-border">
            <label className="flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg hover:bg-primary/5 transition-colors">
              <span className="text-3xl mb-2">{'\uD83D\uDCC1'}</span>
              <span className="text-sm font-medium text-foreground">Click to upload or drag and drop</span>
              <span className="text-xs text-muted mt-1">PDF, DOCX, PPTX, XLSX, or Images up to 50 MB</span>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              />
            </label>
            {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
            {uploadSuccess && <p className="text-xs text-success">{uploadSuccess}</p>}
            {uploading && <p className="text-xs text-muted animate-pulse">Uploading...</p>}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Uploaded Resources ({resources.length})
            </h3>

            {resources.length === 0 ? (
              <div className="glass-card p-4 text-center text-sm text-muted">No resources uploaded yet</div>
            ) : (
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div key={resource.id} className="glass-card p-4 flex items-center justify-between border border-border/80 hover:border-border transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl shrink-0">{getFileIcon(resource.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{resource.originalName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted">{formatFileSize(resource.size)}</span>
                          <span className="text-xs text-muted">\u00B7</span>
                          <span className="text-xs text-muted">{new Date(resource.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <a href={resource.url} download className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">Download</a>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        disabled={deleting === resource.id}
                        className="btn-danger text-xs"
                      >
                        {deleting === resource.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Select a module to manage its study materials.
          </p>
        </div>
      )}
    </div>
  );
}
