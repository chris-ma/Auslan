import Link from "next/link";
import { SIGNS, SIGNS_BY_TIER } from "@auslan/vocab";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Hand, Info } from "lucide-react";

export default function GlossaryPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm hover:underline text-muted-foreground">
              ← Home
            </Link>
            <h1 className="mt-1 text-2xl font-bold">Supported Signs</h1>
          </div>
          <Button asChild>
            <Link href="/practice">
              <Hand className="mr-2 h-4 w-4" aria-hidden />
              Practise
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        <p className="text-muted-foreground">
          {SIGNS.length} signs across three priority tiers. Signs are based on
          the{" "}
          <a
            href="https://auslan.org.au"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Auslan Signbank
          </a>{" "}
          canonical forms.
        </p>

        {([1, 2, 3] as const).map((tier) => (
          <section key={tier}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Badge variant={tier === 1 ? "default" : tier === 2 ? "secondary" : "outline"}>
                Tier {tier}
              </Badge>
              {tier === 1 && "Essential vocabulary"}
              {tier === 2 && "Extended vocabulary"}
              {tier === 3 && "Numbers & extra"}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SIGNS_BY_TIER[tier].map((sign) => (
                <Tooltip key={sign.label}>
                  <TooltipTrigger asChild>
                    <div className="group flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 hover:border-primary/50 hover:bg-accent transition-colors cursor-default">
                      <span className="font-medium text-sm text-foreground">
                        {sign.displayText}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {sign.type === "static" ? "Static" : "Dynamic"}
                        </Badge>
                        <Info className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-52 text-xs">
                    <strong>{sign.hand === "both" ? "Two hands" : `${sign.hand.charAt(0).toUpperCase() + sign.hand.slice(1)} hand`}</strong>
                    {" — "}
                    {sign.description}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
