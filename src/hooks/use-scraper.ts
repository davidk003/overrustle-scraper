import { useState, useCallback, useEffect, useRef } from "react";

interface ScrapeOptions {
  userName: string;
  endTime: number;
}

// Helper function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useScraper() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [endTimestamp, setEndTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [userName, setUserName] = useState("");
  
  // Use ref to store the current log array to avoid closure issues
  const logsRef = useRef<string[]>([]);
  
  // Update the ref whenever logs change
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  const resetTimestamp = useCallback((timestamp: number) => {
    setEndTimestamp(timestamp);
  }, []);

  const startScraping = useCallback((username: string, endTime: number) => {
    if (isRunning) return;
    
    setUserName(username);
    setEndTimestamp(endTime);
    setLogs([]);
    logsRef.current = [];
    setIsRunning(true);
    setProgress(0);
    setTotalLogs(0);
    
    // Start the scraping process
    const currDate = new Date(endTime * 1000).toISOString().split("T")[0];
    searchReq(username, currDate, 0);
  }, [isRunning]);
  
  const searchReq = useCallback(async (userName: string, currDate: string, searchAfterTime = 0) => {
    const requestOptions = {
      method: "GET",
      redirect: "follow" as RequestRedirect
    };
    
    try {
      const response = await fetch(
        `https://api-v2.rustlesearch.dev/anon/search?start_date=2010-01-01&end_date=${currDate}&channel=Destinygg&username=${userName}&search_after=${searchAfterTime}`,
        requestOptions
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          const rateLimitLog = "You are being rate limited, try again later";
          const newLogs = [...logsRef.current, rateLimitLog];
          setLogs(newLogs);
          logsRef.current = newLogs;
          setIsRunning(false);
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.text();
      const data = JSON.parse(result).data;
      const outputList = data.messages || [];
      const totalCount = data.total || 0;
      
      if (totalCount > 0 && totalLogs === 0) {
        setTotalLogs(totalCount);
      }
      
      const next = outputList[outputList.length - 1]?.searchAfter;
      
      if (!next || outputList.length === 0) {
        setIsRunning(false);
        // Final progress update
        setProgress(100);
        
        // Add a completion log
        const newLogs = [...logsRef.current, `Scraping complete: ${logsRef.current.length} logs retrieved`];
        setLogs(newLogs);
        logsRef.current = newLogs;
      } else {
        // Add new logs to the state
        const newLogEntries = outputList.map((o: any) => `${o.ts} ${o.text}`);
        const updatedLogs = [...logsRef.current, ...newLogEntries];
        
        // Update progress
        if (totalCount > 0) {
          const newProgress = Math.min(Math.floor((updatedLogs.length / totalCount) * 100), 99);
          setProgress(newProgress);
        }
        
        // Add a progress log
        const progressLog = `${updatedLogs.length} logs scraped`;
        updatedLogs.push(progressLog);
        
        setLogs(updatedLogs);
        logsRef.current = updatedLogs;
        
        // Add delay before next request
        await delay(300);
        
        // Recursive call with next search parameter
        searchReq(userName, currDate, next);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      
      // Add error log
      const errorLog = `Error: ${error.message}`;
      const newLogs = [...logsRef.current, errorLog];
      setLogs(newLogs);
      logsRef.current = newLogs;
      setIsRunning(false);
    }
  }, [totalLogs]);

  const downloadLogs = useCallback(() => {
    if (logs.length === 0) return;
    
    const text = logs
      .filter(log => !log.endsWith("logs scraped")) // Filter out the progress logs
      .join("\n");
      
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userName}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, [logs, userName]);

  return {
    logs,
    isRunning,
    progress,
    totalLogs,
    startScraping,
    downloadLogs,
    resetTimestamp
  };
}