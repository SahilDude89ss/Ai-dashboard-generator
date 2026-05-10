"use client";
import { useState, useCallback } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useDashcraftStore } from "@/store/dashcraft";
import { parseSqlDump } from "@/lib/db/parse-sql-dump";
import { Spinner } from "@/components/ui/Spinner";

interface SqlUploadZoneProps {
  onParsed: () => void;
}

export function SqlUploadZone({ onParsed }: SqlUploadZoneProps) {
  const { dialect, setSchema, setSqlDump, setSchemaStatus } = useDashcraftStore();
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setParsing(true);
      setSchemaStatus("loading");

      try {
        const content = await file.text();
        setSqlDump(content);

        if (file.size > 5 * 1024 * 1024) {
          // Large file: send to server
          const formData = new FormData();
          formData.append("file", file);
          formData.append("dialect", dialect);
          const res = await fetch("/api/schema/parse", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Parse failed");
          setSchema({ ...data.schema, connectedAt: new Date() });
        } else {
          // Small file: parse client-side
          const schema = parseSqlDump(content, dialect);
          if (schema.tables.length === 0) {
            throw new Error("No CREATE TABLE statements found in this file.");
          }
          setSchema(schema);
        }
        onParsed();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Parse failed";
        setError(msg);
        setSchemaStatus("error", msg);
      } finally {
        setParsing(false);
      }
    },
    [dialect, setSchema, setSqlDump, setSchemaStatus, onParsed]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center gap-3 p-10 rounded-card border-2 border-dashed cursor-pointer transition-all ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-[rgba(255,255,255,0.15)] bg-s1 hover:border-[rgba(255,255,255,0.25)] hover:bg-s2"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".sql,.dump,.gz"
          className="sr-only"
          onChange={onFileChange}
        />
        {parsing ? (
          <>
            <Spinner size="lg" />
            <p className="text-muted2 text-sm">Parsing {fileName}…</p>
          </>
        ) : fileName && !error ? (
          <>
            <FileText size={32} className="text-a2" />
            <p className="text-a2 font-semibold text-sm">{fileName}</p>
            <p className="text-muted text-xs">Click to re-upload</p>
          </>
        ) : (
          <>
            <Upload size={32} className="text-muted2" />
            <div className="text-center">
              <p className="text-text font-semibold text-sm">Drop your SQL dump here</p>
              <p className="text-muted text-xs mt-1">or click to browse</p>
            </div>
            <p className="text-muted text-xs">.sql, .dump, .gz up to 50MB</p>
          </>
        )}
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 mt-3 rounded-input bg-a3/10 border border-a3/30 text-a3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
