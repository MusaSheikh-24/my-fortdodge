"use client";

import { useState, useEffect } from "react";
import { toast } from "@/app/components/Toaster";

type VisibilityToggleProps = {
  pageName: string;
  apiEndpoint: string; // e.g., "/api/test-home", "/api/ramadan", etc.
};

export default function VisibilityToggle({ pageName, apiEndpoint }: VisibilityToggleProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch current visibility status
  useEffect(() => {
    async function fetchVisibility() {
      try {
        const response = await fetch(apiEndpoint);
        const result = await response.json();
        
        // Try to find the data in the response - check common response key patterns
        let pageData = null;
        if (result.ok) {
          // Try different possible response key formats
          // Convert kebab-case to camelCase: "new-muslim" -> "newMuslim"
          const toCamelCase = (str: string) => {
            return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          };
          
          const possibleKeys = [
            pageName, // e.g., "new-muslim"
            toCamelCase(pageName), // e.g., "newMuslim"
            // Special cases
            pageName === "elections-nominations" ? "electionNomination" : null,
            pageName === "visitors-guide" ? "visitorGuide" : null,
            pageName === "request-a-speaker" ? "requestSpeaker" : null,
            pageName === "request-a-visit" ? "requestVisit" : null,
          ].filter(Boolean) as string[];
          
          for (const key of possibleKeys) {
            if (result[key]) {
              // The page object has a data property: result[key].data
              const pageObj = result[key];
              if (pageObj.data) {
                pageData = pageObj.data;
                break;
              }
            }
          }
          
          // If still not found, check if data is directly in result
          if (!pageData && result.data) {
            pageData = result.data;
          }
        }
        
        if (pageData) {
          // Check visibility at root level of data object
          // Also check if it's nested in data.data (for some page structures)
          let visibility = pageData.visibility;
          if (visibility === undefined && pageData.data && typeof pageData.data === 'object') {
            visibility = pageData.data.visibility;
          }
          // Default to true if not set
          setIsVisible(visibility !== undefined ? visibility : true);
        } else {
          // If no data found, default to visible
          setIsVisible(true);
        }
      } catch (error) {
        console.error(`Failed to fetch visibility for ${pageName}:`, error);
      } finally {
        setLoading(false);
      }
    }

    fetchVisibility();
  }, [pageName, apiEndpoint]);

  const handleVisibilityChange = async (newVisibility: boolean) => {
    setSaving(true);

    try {
      // Update visibility using dedicated API endpoint
      const updateResponse = await fetch("/api/update-page-visibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageName,
          isVisible: newVisibility,
        }),
      });

      const updateResult = await updateResponse.json();

      if (updateResult.ok) {
        // Update state immediately for better UX
        setIsVisible(newVisibility);
        
        // Also refresh from API to confirm
        try {
          const refreshResponse = await fetch(apiEndpoint);
          const refreshResult = await refreshResponse.json();
          
          if (refreshResult.ok) {
            const toCamelCase = (str: string) => {
              return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            };
            const possibleKeys = [
              pageName,
              toCamelCase(pageName),
              pageName === "elections-nominations" ? "electionNomination" : null,
              pageName === "visitors-guide" ? "visitorGuide" : null,
              pageName === "request-a-speaker" ? "requestSpeaker" : null,
              pageName === "request-a-visit" ? "requestVisit" : null,
            ].filter(Boolean) as string[];
            
            for (const key of possibleKeys) {
              if (refreshResult[key]?.data) {
                const refreshedData = refreshResult[key].data;
                let visibility = refreshedData.visibility;
                if (visibility === undefined && refreshedData.data && typeof refreshedData.data === 'object') {
                  visibility = refreshedData.data.visibility;
                }
                if (visibility !== undefined) {
                  setIsVisible(visibility);
                }
                break;
              }
            }
          }
        } catch (refreshError) {
          console.error("Failed to refresh visibility:", refreshError);
          // Keep the state we set above
        }
        
        toast.success(`Page visibility updated successfully! The page will ${newVisibility ? 'appear' : 'not appear'} in the navbar.`);
      } else {
        throw new Error(updateResult.message || "Failed to update");
      }
    } catch (error: any) {
      console.error(`Failed to update visibility for ${pageName}:`, error);
      toast.error(`Failed to update visibility: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Loading visibility status...</p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Page Visibility</h3>
          <p className="text-xs text-gray-600">
            Control whether this page appears in the main navigation bar
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`visibility-${pageName}`}
              checked={isVisible === true}
              onChange={() => handleVisibilityChange(true)}
              disabled={saving}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm font-medium ${isVisible === true ? 'text-blue-700' : 'text-gray-600'}`}>
              Active
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`visibility-${pageName}`}
              checked={isVisible === false}
              onChange={() => handleVisibilityChange(false)}
              disabled={saving}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className={`text-sm font-medium ${isVisible === false ? 'text-red-700' : 'text-gray-600'}`}>
              Inactive
            </span>
          </label>
          {saving && (
            <span className="text-xs text-gray-500">Saving...</span>
          )}
        </div>
      </div>
    </div>
  );
}

