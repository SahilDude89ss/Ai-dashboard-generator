"use client";

import { Turn, UserTurn, AssistantTurn } from "@/types";
import { ThinkingStep } from "./ThinkingStep";
import { StreamingIndicator } from "./StreamingIndicator";
import { ClarificationCard } from "./ClarificationCard";
import { ResultRenderer } from "../results/ResultRenderer";

interface Props {
  turn: Turn;
  onClarificationAnswer?: (answer: string) => void;
}

function UserBubble({ turn }: { turn: UserTurn }) {
  return (
    <div className="flex justify-end w-full">
      <div className="max-w-[75%] ml-auto bg-s3 rounded-card px-4 py-3 text-text text-sm leading-relaxed">
        {turn.content}
      </div>
    </div>
  );
}

function AssistantBubble({
  turn,
  onClarificationAnswer,
}: {
  turn: AssistantTurn;
  onClarificationAnswer?: (answer: string) => void;
}) {
  const isStreaming =
    (turn.status === "planning" || turn.status === "executing") &&
    turn.queries.length === 0;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Thinking step */}
      {turn.thinking && <ThinkingStep thinking={turn.thinking} />}

      {/* Streaming indicator when no queries yet */}
      {isStreaming && (
        <StreamingIndicator
          label={turn.status === "planning" ? "Planning…" : "Executing…"}
        />
      )}

      {/* Clarification card */}
      {turn.clarification && onClarificationAnswer && (
        <ClarificationCard
          clarification={turn.clarification}
          onAnswer={onClarificationAnswer}
        />
      )}

      {/* Query results */}
      {turn.queries.map((query) => (
        <ResultRenderer key={query.id} query={query} />
      ))}

      {/* Explanation */}
      {turn.explanation && (
        <p className="text-muted2 text-xs leading-relaxed">{turn.explanation}</p>
      )}

      {/* Error state */}
      {turn.status === "error" && (
        <p className="text-a3 text-sm">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

export function TurnBubble({ turn, onClarificationAnswer }: Props) {
  if (turn.role === "user") {
    return <UserBubble turn={turn} />;
  }

  return (
    <AssistantBubble
      turn={turn}
      onClarificationAnswer={onClarificationAnswer}
    />
  );
}
