"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryTalkStore } from "@/store/querytalk";

export default function ChatIndexPage() {
  const router = useRouter();
  const { activeSessionId } = useQueryTalkStore();

  useEffect(() => {
    if (activeSessionId) {
      router.replace(`/querytalk/chat/${activeSessionId}`);
    } else {
      router.replace("/querytalk/connect");
    }
  }, [activeSessionId, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}
