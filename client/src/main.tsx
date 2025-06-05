import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThreadProvider } from './context/ThreadContext';

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThreadProvider>
      <App />
    </ThreadProvider>
  </QueryClientProvider>
);
