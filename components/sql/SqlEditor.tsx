"use client";
import { useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL, MySQL, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { DbDialect, DbSchema } from "@/types";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  dialect?: DbDialect;
  schema?: DbSchema;
  readOnly?: boolean;
}

function getDialectConfig(dialect?: DbDialect) {
  switch (dialect) {
    case "mysql":
      return MySQL;
    case "sqlite":
      return SQLite;
    default:
      return PostgreSQL;
  }
}

export function SqlEditor({ value, onChange, onRun, dialect, readOnly = false }: SqlEditorProps) {
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  const runKeymap = keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        onRunRef.current?.();
        return true;
      },
    },
  ]);

  const extensions = [
    sql({ dialect: getDialectConfig(dialect) }),
    runKeymap,
  ];

  return (
    <div className="rounded-input overflow-hidden border border-[rgba(255,255,255,0.11)]">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={oneDark}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          autocompletion: true,
        }}
        style={{ fontSize: "12px" }}
        minHeight="120px"
        maxHeight="320px"
      />
    </div>
  );
}
