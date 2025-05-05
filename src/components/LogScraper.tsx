import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Download, Terminal, Play, Clock, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Import the original script logic
import { useScraper } from "@/hooks/use-scraper";

export default function LogScraper() {
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [endTimestamp, setEndTimestamp] = useState(Math.floor(Date.now() / 1000));

  const {
    logs,
    progress,
    isRunning,
    startScraping,
    downloadLogs,
    resetTimestamp
  } = useScraper();

  useEffect(() => {
    // Scroll to bottom when logs update
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to scrape logs for.",
        variant: "destructive"
      });
      return;
    }

    startScraping(username, endTimestamp);
    toast({
      title: "Scraping started",
      description: `Starting to scrape logs for ${username}`,
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toISOString();
  };

  const handleReset = () => {
    const now = Math.floor(Date.now() / 1000);
    setEndTimestamp(now);
    resetTimestamp(now);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Scraper</h1>
          <p className="text-muted-foreground mt-1">
            Scrape and download chat logs with ease
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Scrape Settings</CardTitle>
            <CardDescription>Enter user details to begin scraping logs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="username" className="text-sm font-medium">
                    Username to scrape
                  </label>
                </div>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="endTimestamp" className="text-sm font-medium">
                    End timestamp (Unix)
                  </label>
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="endTimestamp"
                    type="number"
                    step="86400"
                    value={endTimestamp}
                    onChange={(e) => setEndTimestamp(Number(e.target.value))}
                    disabled={isRunning}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleReset}
                    disabled={isRunning}
                    title="Reset to current time"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(endTimestamp)}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isRunning || !username.trim()}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Scraping
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{logs.length} logs scraped</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={downloadLogs}
              disabled={isRunning || logs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Logs
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Log Output</CardTitle>
              <CardDescription>
                Real-time scraping progress
              </CardDescription>
            </div>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea 
              className="h-[400px] p-4 font-mono text-sm" 
              ref={logContainerRef}
            >
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "py-1",
                      i % 2 === 0 ? "bg-muted/40" : "bg-background"
                    )}
                  >
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  {isRunning ? "Scraping in progress..." : "No logs scraped yet"}
                </div>
              )}
              {isRunning && logs.length > 0 && (
                <div className="py-1 animate-pulse">
                  {logs.length} logs scraped
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}