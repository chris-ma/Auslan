"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Video, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function CallLobbyPage() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    const id = roomInput.trim();
    if (!id) {
      setError("Please enter a room code.");
      return;
    }
    if (!/^[0-9a-f]{32}$/i.test(id)) {
      setError("Invalid room code format.");
      return;
    }
    router.push(`/call/${id}`);
  };

  const handleCreate = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    router.push(`/call/${id}?host=1`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Video Call</h1>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          Start a new call and share the room link, or enter a code from someone
          else.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Create new call */}
        <Button className="w-full" size="lg" onClick={handleCreate}>
          <Video className="mr-2 h-5 w-5" aria-hidden />
          Create new room
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or join existing</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join by room code */}
        <div className="space-y-2">
          <label htmlFor="room-code" className="text-sm font-medium">
            Room code
          </label>
          <div className="flex gap-2">
            <input
              id="room-code"
              type="text"
              value={roomInput}
              onChange={(e) => {
                setRoomInput(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Paste room code here"
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-describedby={error ? "room-code-error" : undefined}
            />
            <Button onClick={handleJoin}>
              <LinkIcon className="mr-2 h-4 w-4" aria-hidden />
              Join
            </Button>
          </div>
          {error && (
            <p id="room-code-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>

      <Button variant="ghost" asChild>
        <Link href="/">← Back to home</Link>
      </Button>
    </main>
  );
}
