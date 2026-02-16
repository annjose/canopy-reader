"use client";

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastContextValue = {
  toasts: ToasterToast[];
  toast: (toast: Omit<ToasterToast, "id">) => { id: string; dismiss: () => void };
  dismiss: (toastId?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

let idCounter = 0;
function genId() {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return String(idCounter);
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

function reducer(state: { toasts: ToasterToast[] }, action: Action) {
  switch (action.type) {
    case "ADD_TOAST":
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      return {
        toasts: state.toasts.map((t) =>
          toastId === undefined || t.id === toastId ? { ...t, open: false } : t,
        ),
      };
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      return {
        toasts:
          toastId === undefined
            ? []
            : state.toasts.filter((t) => t.id !== toastId),
      };
    }
    default:
      return state;
  }
}

const TOAST_REMOVE_DELAY = 1000;

export function ToastProviderInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const toastTimeouts = React.useRef(new Map<string, number>());

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: "DISMISS_TOAST", toastId });

    if (toastId) {
      const existing = toastTimeouts.current.get(toastId);
      if (existing) window.clearTimeout(existing);
      const timeout = window.setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", toastId });
        toastTimeouts.current.delete(toastId);
      }, TOAST_REMOVE_DELAY);
      toastTimeouts.current.set(toastId, timeout);
    } else {
      // remove all
      state.toasts.forEach((t) => {
        const existing = toastTimeouts.current.get(t.id);
        if (existing) window.clearTimeout(existing);
        const timeout = window.setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId: t.id });
          toastTimeouts.current.delete(t.id);
        }, TOAST_REMOVE_DELAY);
        toastTimeouts.current.set(t.id, timeout);
      });
    }
  }, [state.toasts]);

  const toast = React.useCallback(
    (t: Omit<ToasterToast, "id">) => {
      const id = genId();
      const toast: ToasterToast = {
        ...t,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss(id);
        },
      };
      dispatch({ type: "ADD_TOAST", toast });

      return {
        id,
        dismiss: () => dismiss(id),
      };
    },
    [dismiss],
  );

  const value = React.useMemo(
    () => ({ toasts: state.toasts, toast, dismiss }),
    [state.toasts, toast, dismiss],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProviderInternal");
  }
  return ctx;
}

// Convenience export to call toast() outside of components
let toastRef: ToastContextValue["toast"] | null = null;
let dismissRef: ToastContextValue["dismiss"] | null = null;

export function ToastGlobalsBridge() {
  const { toast, dismiss } = useToast();
  React.useEffect(() => {
    toastRef = toast;
    dismissRef = dismiss;
    return () => {
      toastRef = null;
      dismissRef = null;
    };
  }, [toast, dismiss]);
  return null;
}

export function toast(t: Parameters<ToastContextValue["toast"]>[0]) {
  if (!toastRef) {
    // no-op if toaster not mounted yet
    return { id: "", dismiss: () => {} };
  }
  return toastRef(t);
}

export function dismiss(toastId?: string) {
  dismissRef?.(toastId);
}
