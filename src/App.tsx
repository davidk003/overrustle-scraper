import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import LogScraper from "@/components/LogScraper";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="log-scraper-theme">
      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-12 mx-auto px-4">
          <LogScraper />
        </div>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;