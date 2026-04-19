import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hand, Video, BookOpen, Lock } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <Badge variant="secondary" className="mb-6">
          Australian Sign Language · In-browser AI
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Auslan Live
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
          Real-time Auslan recognition with live subtitles — powered entirely in
          your browser. No video ever leaves your device.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/practice">
              <Hand className="mr-2 h-5 w-5" aria-hidden />
              Start practising
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/call">
              <Video className="mr-2 h-5 w-5" aria-hidden />
              Video call
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/glossary">
              <BookOpen className="mr-2 h-5 w-5" aria-hidden />
              View glossary
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Hand className="h-6 w-6 text-primary" />}
            title="Real-time recognition"
            description="50 common Auslan signs detected via MediaPipe hand landmarks and an in-browser TensorFlow.js classifier."
          />
          <FeatureCard
            icon={<Lock className="h-6 w-6 text-primary" />}
            title="100% private"
            description="All ML inference runs locally in your browser. Zero video frames are ever transmitted to any server."
          />
          <FeatureCard
            icon={<Video className="h-6 w-6 text-primary" />}
            title="Two-way video chat"
            description="Phase 2 peer-to-peer video calls with live Auslan subtitles for both participants."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4">{icon}</div>
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
