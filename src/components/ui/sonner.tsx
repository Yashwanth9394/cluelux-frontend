"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-gray-900/95 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-2xl backdrop-blur-md",
          description: "group-[.toast]:text-gray-200",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:bg-emerald-600/95 group-[.toast]:text-white group-[.toast]:border-emerald-500",
          error: "group-[.toast]:bg-red-600/95 group-[.toast]:text-white group-[.toast]:border-red-500",
          info: "group-[.toast]:bg-blue-600/95 group-[.toast]:text-white group-[.toast]:border-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(17, 24, 39, 0.95)",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(55, 65, 81, 0.8)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
