"use client";

interface AIStatusLoaderProps {
  title: string;
  status: string;
}

export function AIStatusLoader({ title, status }: AIStatusLoaderProps) {
  return (
    <div className="ai-status-loader">
      <div className="ai-status-spinner" aria-hidden="true" />
      <div>
        <p className="ai-status-title">{title}</p>
        <p className="ai-status-detail">{status}</p>
      </div>
    </div>
  );
}
