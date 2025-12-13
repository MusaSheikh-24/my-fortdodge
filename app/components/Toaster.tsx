"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toastFn = useCallback(
    (message: string, type: ToastType = "info") => {
      addToast(message, type);
    },
    [addToast]
  );

  const success = useCallback(
    (message: string) => {
      addToast(message, "success");
    },
    [addToast]
  );

  const error = useCallback(
    (message: string) => {
      addToast(message, "error");
    },
    [addToast]
  );

  const info = useCallback(
    (message: string) => {
      addToast(message, "info");
    },
    [addToast]
  );

  // Set global instance on mount and update
  useEffect(() => {
    const contextValue: ToastContextType = { toast: toastFn, success, error, info };
    setGlobalToastInstance(contextValue);
    return () => {
      setGlobalToastInstance(null as any);
    };
  }, [toastFn, success, error, info]);

  const contextValue: ToastContextType = { toast: toastFn, success, error, info };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md w-full sm:w-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onRemove(toast.id);
      }, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-sky-50 border-sky-200 text-sky-900";
      case "error":
        return "bg-rose-50 border-rose-200 text-rose-900";
      case "info":
        return "bg-gray-50 border-gray-200 text-gray-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getIconStyles = () => {
    switch (toast.type) {
      case "success":
        return "text-sky-600";
      case "error":
        return "text-rose-600";
      case "info":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        pointer-events-auto
        rounded-lg border shadow-lg
        ${getToastStyles()}
        transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${getIconStyles()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5 break-words">
            {toast.message}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Global toast instance for use outside React components
let globalToastInstance: ToastContextType | null = null;

// Internal function to set the global instance (called by ToastProvider)
function setGlobalToastInstance(instance: ToastContextType) {
  globalToastInstance = instance;
}

// Individual toast functions
function toastSuccess(message: string) {
  if (globalToastInstance) {
    globalToastInstance.success(message);
  } else {
    console.warn("Toast not initialized. Make sure ToastProvider is mounted in your layout.");
  }
}

function toastError(message: string) {
  if (globalToastInstance) {
    globalToastInstance.error(message);
  } else {
    console.warn("Toast not initialized. Make sure ToastProvider is mounted in your layout.");
  }
}

function toastInfo(message: string) {
  if (globalToastInstance) {
    globalToastInstance.info(message);
  } else {
    console.warn("Toast not initialized. Make sure ToastProvider is mounted in your layout.");
  }
}

// Export toast object for convenience (compatible with existing imports)
export const toast = {
  success: toastSuccess,
  error: toastError,
  info: toastInfo,
};

