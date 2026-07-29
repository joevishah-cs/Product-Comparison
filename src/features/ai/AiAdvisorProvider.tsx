import * as React from "react";

interface AiAdvisorContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AiAdvisorContext = React.createContext<AiAdvisorContextValue | null>(null);

/**
 * The advisor starts closed and only opens on an explicit user action. Nothing in
 * the app -- including sign-in, navigation or a selection change -- opens it.
 */
export function AiAdvisorProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  const value = React.useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return <AiAdvisorContext.Provider value={value}>{children}</AiAdvisorContext.Provider>;
}

export function useAiAdvisor(): AiAdvisorContextValue {
  const ctx = React.useContext(AiAdvisorContext);
  if (!ctx) throw new Error("useAiAdvisor must be used inside <AiAdvisorProvider>");
  return ctx;
}
