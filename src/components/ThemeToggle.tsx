import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "menu" }) {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (variant === "menu") {
    return (
      <button
        onClick={toggleTheme}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        {theme === "dark" ? "Светла тема" : "Тъмна тема"}
      </button>
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Светла тема" : "Тъмна тема"}>
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Превключи тема</span>
    </Button>
  );
}
