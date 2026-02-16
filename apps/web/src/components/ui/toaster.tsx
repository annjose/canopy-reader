"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { ToastGlobalsBridge, ToastProviderInternal, useToast } from "@/hooks/use-toast";

export function Toaster() {
  return (
    <ToastProvider>
      <ToastProviderInternal>
        <ToastGlobalsBridge />
        <ToastRenderer />
      </ToastProviderInternal>
    </ToastProvider>
  );
}

function ToastRenderer() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title ? <ToastTitle>{title}</ToastTitle> : null}
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </>
  );
}
