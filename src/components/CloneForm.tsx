"use client";

import { useState, type FormEvent } from "react";
import type { CloneOptions } from "@/types/clone";

type Props = {
  disabled: boolean;
  onSubmit: (url: string, options: CloneOptions) => void;
};

const selectClasses =
  "rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1.5 text-sm";

export default function CloneForm({ disabled, onSubmit }: Props) {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<CloneOptions["mode"]>("single");
  const [styling, setStyling] = useState<CloneOptions["styling"]>("tailwind");
  const [framework, setFramework] = useState<CloneOptions["framework"]>("next");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim(), { mode, styling, framework });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={disabled}
          className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="rounded-md bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-85 disabled:opacity-40 transition-opacity"
        >
          {disabled ? "Cloning…" : "Clone"}
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <label className="flex items-center gap-2">
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as CloneOptions["mode"])}
            disabled={disabled}
            className={selectClasses}
          >
            <option value="single">Single page</option>
            <option value="multi">Multi page</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Styling
          <select
            value={styling}
            onChange={(e) => setStyling(e.target.value as CloneOptions["styling"])}
            disabled={disabled}
            className={selectClasses}
          >
            <option value="tailwind">Tailwind</option>
            <option value="css">CSS</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Framework
          <select
            value={framework}
            onChange={(e) => setFramework(e.target.value as CloneOptions["framework"])}
            disabled={disabled}
            className={selectClasses}
          >
            <option value="next">Next.js</option>
            <option value="vite">Vite React</option>
          </select>
        </label>
      </div>
    </form>
  );
}
