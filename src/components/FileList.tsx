"use client";

import type { FileMeta } from "@/types/clone";

type Props = {
  files: FileMeta[];
  downloadHref: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ files, downloadHref }: Props) {
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {files.length} files generated · {formatBytes(totalBytes)}
        </p>
        <a
          href={downloadHref}
          className="rounded-md bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-85 transition-opacity"
        >
          Download ZIP
        </a>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase text-neutral-500">
              <th className="px-4 py-2 font-medium">Path</th>
              <th className="px-4 py-2 font-medium w-20">Type</th>
              <th className="px-4 py-2 font-medium w-24 text-right">Size</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.path}
                className="border-b border-neutral-100 dark:border-neutral-900 last:border-b-0"
              >
                <td className="px-4 py-1.5 font-mono text-xs">{file.path}</td>
                <td className="px-4 py-1.5 text-xs text-neutral-500">{file.type}</td>
                <td className="px-4 py-1.5 text-xs text-neutral-500 text-right">
                  {formatBytes(file.bytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
