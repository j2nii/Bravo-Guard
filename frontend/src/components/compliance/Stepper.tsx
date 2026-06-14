import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { id: number; label: string };

interface StepperProps {
  steps: Step[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {steps.map((step, idx) => {
        const isComplete = step.id < current;
        const isCurrent = step.id === current;
        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isComplete && "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isComplete && !isCurrent && "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-5 w-5" /> : step.id}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{`${step.id}단계`}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                    isCurrent && "font-semibold",
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 h-0.5 flex-1 rounded-full",
                  step.id < current ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
