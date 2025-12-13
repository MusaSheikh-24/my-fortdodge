"use client";

import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { resolveStorageImageUrl } from "@/lib/storage.service";
import { toast } from "@/app/components/Toaster";

type SectionField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "image" | "rich-text" | "url" | "time" | "array" | "table";
  value: string | any[];
  placeholder?: string;
  arrayItemSchema?: { id: string; label: string; type: string }[];
  tableColumns?: { id: string; label: string }[];
};

type SectionEditorProps = {
  sectionId: string;
  sectionTitle: string;
  fields: SectionField[];
  onUpdate: (sectionId: string, fields: SectionField[]) => void;
  onSave?: () => void;
  saving?: boolean;
  alwaysExpanded?: boolean;
  bucket?: string;
  folder?: string;
};

const isDescriptionField = (id: string, label: string) => {
  const target = `${id} ${label}`.toLowerCase();
  return target.includes("description");
};

export default function SectionEditor({
  sectionId,
  sectionTitle,
  fields,
  onUpdate,
  onSave,
  saving = false,
  alwaysExpanded = false,
  bucket = "Public",
  folder = "Home",
}: SectionEditorProps) {
  const [localFields, setLocalFields] = useState<SectionField[]>(fields);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync localFields when props.fields change (e.g., after page reload)
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  const handleFieldChange = (fieldId: string, value: string | any[]) => {
    const updatedFields = localFields.map((field) =>
      field.id === fieldId ? { ...field, value } : field
    );
    setLocalFields(updatedFields);
    onUpdate(sectionId, updatedFields);
  };

  const deleteImageFromStorage = async (fieldId: string, value: string) => {
    if (!value || typeof value !== "string") return;

    // Don't try to delete legacy /public or /images assets or blob URLs
    if (
      value.startsWith("blob:") ||
      value.startsWith("/images/") ||
      value.startsWith("images/") ||
      value.startsWith("/public/") ||
      value.startsWith("public/")
    ) {
      console.log(
        "[SectionEditor] Skipping storage delete for non-storage image value:",
        { fieldId, value }
      );
      return;
    }

    try {
      console.log("[SectionEditor] Deleting image from storage:", {
        fieldId,
        value,
      });

      const response = await fetch(
        `/api/delete-image?bucket=${encodeURIComponent(
          bucket
        )}&folder=${encodeURIComponent(folder)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pathOrName: value }),
        }
      );

      const result = await response.json();

      if (!result.ok) {
        console.error("[SectionEditor] Storage delete failed:", result);
      } else {
        console.log("[SectionEditor] Storage delete successful:", result);
      }
    } catch (error: any) {
      console.error("[SectionEditor] Error deleting image from storage:", {
        fieldId,
        value,
        error,
      });
    }
  };

  const handleImageUpload = async (
    fieldId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(`Image size is too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, etc.)");
      return;
    }

    try {
      // Delete old image from storage if it exists
      const currentField = localFields.find((f) => f.id === fieldId);
      const oldImageValue = currentField?.value;
      if (oldImageValue && typeof oldImageValue === "string" && oldImageValue.trim()) {
        console.log("[SectionEditor] Deleting old image before uploading new one:", oldImageValue);
        await deleteImageFromStorage(fieldId, oldImageValue);
      }

      console.log("[SectionEditor] Uploading image via API:", {
        name: file.name,
        size: file.size,
        type: file.type,
        fieldId,
      });

      // Use server-side API route for upload (better permissions)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldId", fieldId);

      const response = await fetch(
        `/api/upload-image?bucket=${encodeURIComponent(
          bucket
        )}&folder=${encodeURIComponent(folder)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.ok) {
        console.error("[SectionEditor] Image upload failed:", result);
        
        let errorMessage = `${result.message || "Failed to upload image"}\n\n`;
        
        if (result.error) {
          errorMessage += `Error: ${result.error}\n`;
        }
        if (result.details) {
          errorMessage += `${result.details}\n`;
        }
        if (result.help) {
          errorMessage += result.help;
        } else {
          errorMessage += "\nPlease check:\n";
          errorMessage += "1. Supabase Storage bucket 'Public' exists\n";
          errorMessage += "2. Server has proper credentials (SUPABASE_SERVICE_ROLE_KEY in .env.local)\n";
          errorMessage += "3. File size is under 5MB\n";
          errorMessage += "4. Check browser console and server logs for details";
        }
        
        if (result.usingServiceRole === false) {
          errorMessage += "\n\n⚠️ WARNING: Using ANON_KEY instead of SERVICE_ROLE_KEY. Add SUPABASE_SERVICE_ROLE_KEY to .env.local";
        }
        
        toast.error(errorMessage);
        return;
      }

      console.log("[SectionEditor] Image uploaded successfully:", result);
      
      // Prefer storing the storage path (e.g. "Home/abc.jpg"); fall back to filename
      const storedValue: string = result.path || result.fileName;
      console.log("[SectionEditor] Storing storage path/filename in field:", storedValue);

      // Make sure we're storing a real storage path / filename, not a blob URL
      if (storedValue && !storedValue.startsWith("blob:")) {
        // Update the field value immediately - this will trigger a re-render
        handleFieldChange(fieldId, storedValue);
        console.log("[SectionEditor] Field updated with storage value:", storedValue);
        
        // Small delay to ensure the image is accessible in storage (helps with first-time uploads)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reset the file input so the same file can be uploaded again if needed
        event.target.value = "";
      } else {
        console.error("[SectionEditor] Invalid image value from API:", storedValue);
        toast.error("Error: Invalid image filename received from server. Please try uploading again.");
        // Reset the file input on error too
        event.target.value = "";
      }
    } catch (err: any) {
      console.error("[SectionEditor] Unexpected upload error:", err);
      toast.error(`Unexpected error while uploading image: ${err?.message || String(err)}. Check browser console for details.`);
      // Reset the file input on error
      event.target.value = "";
    }
  };

  const handleArrayItemChange = (fieldId: string, index: number, itemId: string, value: string) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !Array.isArray(field.value)) return;

    const updatedArray = [...field.value];
    updatedArray[index] = { ...updatedArray[index], [itemId]: value };
    handleFieldChange(fieldId, updatedArray);
  };

  const handleArrayItemImageUpload = async (
    fieldId: string,
    index: number,
    itemId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error(`Image size is too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP, etc.)");
      return;
    }

    try {
      // Delete old image from storage if it exists
      const field = localFields.find((f) => f.id === fieldId);
      if (field && Array.isArray(field.value) && field.value[index]) {
        const oldImageValue = field.value[index][itemId];
        if (oldImageValue && typeof oldImageValue === "string" && oldImageValue.trim()) {
          console.log("[SectionEditor] Deleting old array item image before uploading new one:", oldImageValue);
          await deleteImageFromStorage(`${fieldId}[${index}].${itemId}`, oldImageValue);
        }
      }

      console.log("[SectionEditor] Uploading array item image via API:", {
        name: file.name,
        size: file.size,
        type: file.type,
        fieldId,
        index,
        itemId,
      });

      // Use server-side API route for upload (better permissions)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fieldId", `${fieldId}[${index}].${itemId}`);

      const response = await fetch(
        `/api/upload-image?bucket=${encodeURIComponent(
          bucket
        )}&folder=${encodeURIComponent(folder)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.ok) {
        console.error("[SectionEditor] Array item image upload failed:", result);
        
        let errorMessage = `${result.message || "Failed to upload image"}\n\n`;
        
        if (result.error) {
          errorMessage += `Error: ${result.error}\n`;
        }
        if (result.details) {
          errorMessage += `${result.details}\n`;
        }
        if (result.help) {
          errorMessage += result.help;
        } else {
          errorMessage += "\nPlease check:\n";
          errorMessage += "1. Supabase Storage bucket 'Public' exists\n";
          errorMessage += "2. Server has proper credentials (SUPABASE_SERVICE_ROLE_KEY in .env.local)\n";
          errorMessage += "3. File size is under 5MB\n";
          errorMessage += "4. Check browser console and server logs for details";
        }
        
        if (result.usingServiceRole === false) {
          errorMessage += "\n\n⚠️ WARNING: Using ANON_KEY instead of SERVICE_ROLE_KEY. Add SUPABASE_SERVICE_ROLE_KEY to .env.local";
        }
        
        toast.error(errorMessage);
        return;
      }

      console.log("[SectionEditor] Array item image uploaded successfully:", result);
      
      // Prefer storing the storage path (e.g. "Home/abc.jpg"); fall back to filename
      const storedValue: string = result.path || result.fileName;
      console.log("[SectionEditor] Storing storage path/filename in array item:", storedValue);

      // Make sure we're storing a real storage path / filename, not a blob URL
      if (storedValue && !storedValue.startsWith("blob:")) {
        handleArrayItemChange(fieldId, index, itemId, storedValue);
        console.log("[SectionEditor] Array item updated with storage value:", storedValue);
        
        // Small delay to ensure the image is accessible in storage (helps with first-time uploads)
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reset the file input so the same file can be uploaded again if needed
        event.target.value = "";
      } else {
        console.error("[SectionEditor] Invalid image value from API:", storedValue);
        toast.error("Error: Invalid image filename received from server. Please try uploading again.");
        // Reset the file input on error too
        event.target.value = "";
      }
    } catch (err: any) {
      console.error("[SectionEditor] Unexpected array item upload error:", err);
      toast.error(`Unexpected error while uploading image: ${err?.message || String(err)}. Check browser console for details.`);
      // Reset the file input on error
      event.target.value = "";
    }
  };

  const handleAddArrayItem = (fieldId: string) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !field.arrayItemSchema) return;

    const newItem: any = {};
    field.arrayItemSchema.forEach((schema) => {
      newItem[schema.id] = "";
    });
    const updatedArray = [...(Array.isArray(field.value) ? field.value : []), newItem];
    handleFieldChange(fieldId, updatedArray);
  };

  const handleRemoveArrayItem = (fieldId: string, index: number) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !Array.isArray(field.value)) return;

    const updatedArray = field.value.filter((_, i) => i !== index);
    handleFieldChange(fieldId, updatedArray);
  };

  const handleTableRowChange = (fieldId: string, index: number, columnId: string, value: string) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !Array.isArray(field.value) || !field.tableColumns) return;

    const updatedArray = [...field.value];
    updatedArray[index] = { ...updatedArray[index], [columnId]: value };
    handleFieldChange(fieldId, updatedArray);
  };

  const handleAddTableRow = (fieldId: string) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !field.tableColumns) return;

    const newRow: any = {};
    field.tableColumns.forEach((col) => {
      newRow[col.id] = "";
    });
    const updatedArray = [...(Array.isArray(field.value) ? field.value : []), newRow];
    handleFieldChange(fieldId, updatedArray);
  };

  const handleRemoveTableRow = (fieldId: string, index: number) => {
    const field = localFields.find((f) => f.id === fieldId);
    if (!field || !Array.isArray(field.value)) return;

    const updatedArray = field.value.filter((_, i) => i !== index);
    handleFieldChange(fieldId, updatedArray);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      {!alwaysExpanded && (
        <div
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="text-lg font-bold text-sky-900">{sectionTitle}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      )}
      {alwaysExpanded && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-sky-900">{sectionTitle}</h3>
        </div>
      )}

      {(isExpanded || alwaysExpanded) && (
        <div className="p-6 space-y-6">
          {localFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {field.label}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                />
              )}

              {field.type === "textarea" && (
                isDescriptionField(field.id, field.label) ? (
                  <RichTextEditor
                    value={typeof field.value === "string" ? field.value : ""}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <textarea
                    value={typeof field.value === "string" ? field.value : ""}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900 resize-y"
                  />
                )
              )}

              {field.type === "url" && (
                <input
                  type="url"
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "https://example.com"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                />
              )}

              {field.type === "time" && (
                <input
                  type="text"
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || "12:00 PM"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-900"
                />
              )}

              {field.type === "rich-text" && (
                <RichTextEditor
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={(value) => handleFieldChange(field.id, value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                />
              )}

              {field.type === "image" && (
                <div className="space-y-3">
                  {field.value && typeof field.value === "string" && field.value.trim() && (
                    <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {/* Use resolved public URL from Supabase Storage for preview */}
                      {(() => {
                        console.log("[SectionEditor] Image field value:", field.value);
                        const previewSrc = resolveStorageImageUrl(field.value, {
                          bucket,
                          folder,
                        });
                        console.log("[SectionEditor] Resolved preview URL:", previewSrc);
                        
                        if (!previewSrc) {
                          // Don't try to show blob URLs - they're temporary and invalid
                          if (field.value.startsWith("blob:")) {
                            return (
                              <div className="p-4 text-center">
                                <p className="text-sm text-red-600 font-semibold">⚠️ Invalid Image</p>
                                <p className="text-xs text-gray-500 mt-1">Blob URL detected. Please upload the image again.</p>
                                <p className="text-xs text-gray-400 mt-1">Value: {field.value.substring(0, 50)}...</p>
                              </div>
                            );
                          }
                          
                          // Fallback: try to show the value as-is if it's already a valid URL
                          if (field.value.startsWith("http://") || field.value.startsWith("https://")) {
                            return (
                              <img
                                key={field.value}
                                src={field.value}
                                alt={field.label}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  console.error("[SectionEditor] Failed to load fallback image:", field.value);
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            );
                          }
                          
                          // If it's a filename but couldn't resolve, show error
                          return (
                            <div className="p-4 text-center">
                              <p className="text-sm text-gray-500">Image filename: {field.value}</p>
                              <p className="text-xs text-gray-400 mt-1">Could not resolve URL. Make sure file exists in Supabase Storage.</p>
                            </div>
                          );
                        }
                        // Add cache-busting parameter to ensure fresh image loads, especially for newly uploaded images
                        // Use a timestamp based on the field value to avoid constant re-renders
                        const timestamp = field.value.length; // Simple hash-like value that changes when value changes
                        const cacheBustUrl = previewSrc.includes('?') 
                          ? `${previewSrc}&v=${timestamp}` 
                          : `${previewSrc}?v=${timestamp}`;
                        
                        return (
                          <img
                            key={`${field.id}-${field.value}`}
                            src={cacheBustUrl}
                            alt={field.label}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              console.error("[SectionEditor] Failed to load image:", cacheBustUrl);
                              // Retry without cache-busting parameter as fallback
                              if (cacheBustUrl !== previewSrc) {
                                e.currentTarget.src = previewSrc;
                              } else {
                                e.currentTarget.style.display = "none";
                              }
                            }}
                            onLoad={() => {
                              console.log("[SectionEditor] Image loaded successfully:", cacheBustUrl);
                            }}
                          />
                        );
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-sky-800 text-white rounded-md hover:bg-sky-900 transition-colors font-semibold text-sm">
                      {field.value ? "Change Image" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(field.id, e)}
                        className="hidden"
                      />
                    </label>
                    {field.value && (
                      <button
                        type="button"
                        onClick={async () => {
                          const currentValue =
                            typeof field.value === "string" ? field.value : "";
                          if (currentValue) {
                            await deleteImageFromStorage(field.id, currentValue);
                          }
                          handleFieldChange(field.id, "");
                        }}
                        className="cursor-pointer px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold text-sm"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Recommended: JPG, PNG, or WebP format. Max size: 5MB
                  </p>
                </div>
              )}

              {field.type === "array" && field.arrayItemSchema && (
                <div className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
                  {Array.isArray(field.value) && field.value.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-md border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem(field.id, index)}
                          className="cursor-pointer text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {field.arrayItemSchema?.map((schema) => (
                          <div 
                            key={schema.id} 
                            className={
                              schema.type === "image" 
                                ? "md:col-span-2" 
                                : schema.type === "textarea" 
                                  ? "md:col-span-2" 
                                  : schema.type === "rich-text"
                                    ? "md:col-span-2"
                                    : ""
                            }
                          >
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {schema.label}
                            </label>
                            {schema.type === "image" ? (
                              <div className="space-y-2">
                                {item[schema.id] && typeof item[schema.id] === "string" && (
                                  <div className="relative w-full h-32 border border-gray-300 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {(() => {
                                      const previewSrc = resolveStorageImageUrl(item[schema.id], {
                                        bucket,
                                        folder,
                                      });
                                      
                                      if (!previewSrc) {
                                        if (item[schema.id].startsWith("blob:")) {
                                          return (
                                            <div className="p-2 text-center">
                                              <p className="text-xs text-red-600 font-semibold">⚠️ Invalid Image</p>
                                              <p className="text-xs text-gray-500 mt-1">Please upload again.</p>
                                            </div>
                                          );
                                        }
                                        
                                        if (item[schema.id].startsWith("http://") || item[schema.id].startsWith("https://")) {
                                          return (
                                            <img
                                              src={item[schema.id]}
                                              alt={schema.label}
                                              className="max-h-full max-w-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                          );
                                        }
                                        
                                        return (
                                          <div className="p-2 text-center">
                                            <p className="text-xs text-gray-500">Image: {item[schema.id]}</p>
                                          </div>
                                        );
                                      }
                                      // Add cache-busting parameter to ensure fresh image loads
                                      const timestamp = item[schema.id]?.length || 0;
                                      const cacheBustUrl = previewSrc.includes('?') 
                                        ? `${previewSrc}&v=${timestamp}` 
                                        : `${previewSrc}?v=${timestamp}`;
                                      
                                      return (
                                        <img
                                          key={`${field.id}-${index}-${schema.id}-${item[schema.id]}`}
                                          src={cacheBustUrl}
                                          alt={schema.label}
                                          className="max-h-full max-w-full object-contain"
                                          onError={(e) => {
                                            console.error("[SectionEditor] Failed to load array item image:", cacheBustUrl);
                                            // Retry without cache-busting parameter as fallback
                                            if (cacheBustUrl !== previewSrc) {
                                              e.currentTarget.src = previewSrc;
                                            } else {
                                              e.currentTarget.style.display = "none";
                                            }
                                          }}
                                          onLoad={() => {
                                            console.log("[SectionEditor] Array item image loaded successfully:", cacheBustUrl);
                                          }}
                                        />
                                      );
                                    })()}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <label className="cursor-pointer px-3 py-1.5 bg-sky-800 text-white rounded-md hover:bg-sky-900 transition-colors font-semibold text-xs">
                                    {item[schema.id] ? "Change Image" : "Upload Image"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleArrayItemImageUpload(field.id, index, schema.id, e)}
                                      className="hidden"
                                    />
                                  </label>
                                  {item[schema.id] && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const currentValue = item[schema.id];
                                        if (currentValue && typeof currentValue === "string") {
                                          await deleteImageFromStorage(`${field.id}[${index}].${schema.id}`, currentValue);
                                        }
                                        handleArrayItemChange(field.id, index, schema.id, "");
                                      }}
                                      className="cursor-pointer px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-semibold text-xs"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  JPG, PNG, or WebP. Max 5MB
                                </p>
                              </div>
                            ) : schema.type === "rich-text" ? (
                              <RichTextEditor
                                value={item[schema.id] || ""}
                                onChange={(value) =>
                                  handleArrayItemChange(field.id, index, schema.id, value)
                                }
                                placeholder={schema.label}
                              />
                            ) : schema.type === "textarea" ? (
                              isDescriptionField(schema.id, schema.label) ? (
                                <RichTextEditor
                                  value={item[schema.id] || ""}
                                  onChange={(value) =>
                                    handleArrayItemChange(field.id, index, schema.id, value)
                                  }
                                  placeholder={schema.label}
                                />
                              ) : (
                                <textarea
                                  value={item[schema.id] || ""}
                                  onChange={(e) =>
                                    handleArrayItemChange(field.id, index, schema.id, e.target.value)
                                  }
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              )
                            ) : (
                              <input
                                type={schema.type === "url" ? "url" : "text"}
                                value={item[schema.id] || ""}
                                onChange={(e) => handleArrayItemChange(field.id, index, schema.id, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder={schema.label}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddArrayItem(field.id)}
                    className="cursor-pointer w-full px-4 py-2 text-sm border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-sky-500 hover:text-sky-600 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
              )}

              {field.type === "table" && field.tableColumns && (
                <div className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-200">
                          {field.tableColumns.map((col) => (
                            <th key={col.id} className="px-3 py-2 text-left font-semibold text-gray-700">
                              {col.label}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(field.value) && field.value.map((row, index) => (
                          <tr key={index} className="bg-white border-b border-gray-200">
                            {field.tableColumns!.map((col) => (
                              <td key={col.id} className="px-3 py-2">
                                <input
                                  type="text"
                                  value={row[col.id] || ""}
                                  onChange={(e) => handleTableRowChange(field.id, index, col.id, e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveTableRow(field.id, index)}
                                className="cursor-pointer text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTableRow(field.id)}
                    className="cursor-pointer w-full px-4 py-2 text-sm border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-sky-500 hover:text-sky-600 transition-colors"
                  >
                    + Add Row
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={`px-6 py-2 bg-sky-800 text-white rounded-md hover:bg-sky-900 transition-colors font-semibold ${
                saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

