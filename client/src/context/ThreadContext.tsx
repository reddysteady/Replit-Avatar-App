import React, { createContext, useContext, useState } from 'react';
import { ThreadType } from '@shared/schema';

interface ThreadContextType {
  activeThread: ThreadType | null;
  setActiveThread: (thread: ThreadType | null) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export const ThreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThread, setActiveThread] = useState<ThreadType | null>(null);

  return (
    <ThreadContext.Provider value={{ activeThread, setActiveThread }}>
      {children}
    </ThreadContext.Provider>
  );
};

export const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error('useThreadContext must be used within a ThreadProvider');
  }
  return context;
};