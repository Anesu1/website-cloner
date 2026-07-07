export type CloneOptions = {
  mode: "single" | "multi";
  styling: "tailwind" | "css";
  framework: "next" | "vite";
};

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type FileMeta = { path: string; type: "text" | "binary"; bytes: number };
