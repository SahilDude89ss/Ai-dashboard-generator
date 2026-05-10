"use client";

import { useQueryTalkStore } from "@/store/querytalk";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, Plus } from "lucide-react";

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function SessionList() {
  const router = useRouter();
  const sessions = useQueryTalkStore((s) => s.listSessions());
  const activeSessionId = useQueryTalkStore((s) => s.activeSessionId);
  const loadSession = useQueryTalkStore((s) => s.loadSession);
  const deleteSession = useQueryTalkStore((s) => s.deleteSession);

  function handleSelect(id: string) {
    loadSession(id);
    router.push(`/querytalk/${id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteSession(id);
  }

  return (
    <div className="flex flex-col h-full">
      {/* New session button */}
      <div className="p-3 border-b border-DEFAULT flex-shrink-0">
        <button
          onClick={() => router.push("/querytalk/connect")}
          className="flex items-center gap-2 w-full bg-accent/10 hover:bg-accent/20 text-accent rounded-btn px-3 py-2 text-sm transition-colors"
        >
          <Plus size={14} />
          New Session
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <p className="text-muted2 text-xs text-center py-8 px-4">
            No sessions yet. Start by connecting to a database.
          </p>
        )}
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              onClick={() => handleSelect(session.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-s2 transition-colors group relative ${
                isActive ? "border-l-2 border-accent bg-s2/50" : "border-l-2 border-transparent"
              }`}
            >
              <MessageSquare
                size={13}
                className={isActive ? "text-accent flex-shrink-0" : "text-muted2 flex-shrink-0"}
              />
              <div className="flex-1 min-w-0">
                <p className="text-text text-xs font-medium truncate">
                  {session.title}
                </p>
                <p className="text-muted2 text-xs">
                  {formatRelativeDate(session.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted2 hover:text-a3 transition-all p-0.5 rounded"
              >
                <Trash2 size={12} />
              </button>
            </button>
          );
        })}
      </div>
    </div>
  );
}
