"use client";

import { useFormStatus } from "react-dom";
import React from "react";

interface LoadingButtonProps {
  loading?: boolean | undefined;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset" | undefined;
}

export default function LoadingButton({ loading, children, className, type, onClick }: LoadingButtonProps) {
  const { pending } = useFormStatus();
  const isLoading  = loading === true || pending

  return (
    <button
      type={type}
      disabled={isLoading}
      onClick={onClick}
      className={className || "items-center justify-center gap-2 rounded bg-slate-500 px-6 py-2 text-white hover:bg-slate-700 disabled:opacity-50 shadow-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"}
    >
      { isLoading ? (
        <div className="flex items-center gap-0">
          <svg
            className="flex-1 animate-spin h-5 w-5 text-white mx-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </div>
      ) : (
        children
      )}
    </button>
  );
}