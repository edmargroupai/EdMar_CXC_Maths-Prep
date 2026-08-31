"use client";

import { useTheme } from "@/providers/app-providers";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-wrap gap-2">
      {(["system", "light", "dark"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={theme === option ? "secondary" : "ghost"}
          onClick={() => setTheme(option)}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </Button>
      ))}
    </div>
  );
}
