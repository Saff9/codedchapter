/**
 * screen-guard.tsx
 * ================
 * Screen capture protection overlay component.
 *
 * Renders a full-screen black overlay with a branded message when a
 * potential screen capture event is detected.
 *
 * CSS @media print rule (in index.css) handles the Ctrl+P case separately.
 */

import { useScreenGuard } from "@/hooks/useScreenGuard";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldOff } from "lucide-react";

interface ScreenGuardProps {
  children: React.ReactNode;
  /** Disable guard entirely (e.g., for admin users or development) */
  disabled?: boolean;
}

export function ScreenGuard({ children, disabled = false }: ScreenGuardProps) {
  const { isBlocked } = useScreenGuard();

  return (
    <div className="relative">
      {children}

      {/* CSS print protection is handled by @media print in index.css */}

      {/* JS-based overlay for focus loss / screen record detection */}
      <AnimatePresence>
        {!disabled && isBlocked && (
          <motion.div
            key="screen-guard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none"
            aria-label="Content protected"
          >
            {/* Black screen — this is what a screenshot/screen record sees */}
            <div className="flex flex-col items-center gap-6 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <ShieldOff className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="space-y-2">
                <p
                  className="text-zinc-400 text-sm font-medium font-mono"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Content is protected
                </p>
                <p className="text-zinc-600 text-xs">
                  Return to the Coded Chapter tab to continue reading.
                </p>
              </div>
              <p
                className="text-zinc-700 text-[10px] font-mono"
              >
                &gt;_ codedchapter.vercel.app
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
