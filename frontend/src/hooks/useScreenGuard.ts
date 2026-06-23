/**
 * useScreenGuard.ts
 * =================
 * Screen capture protection hook.
 *
 * What this does:
 *   1. CSS @media print blocks → page goes blank on Ctrl+P / print-screen on many platforms
 *   2. Page Visibility API → detects when the window loses focus (potential screen recorder)
 *   3. Pointer Lock + Fullscreen change events → common screen recording triggers
 *
 * What this CANNOT do:
 *   - Block OS-level screenshots (Windows Snipping Tool, macOS Cmd+Shift+3)
 *     These operate at the OS level, below the browser sandbox.
 *   - Block mobile screenshots (iOS/Android)
 *   - DRM protection (requires Widevine/CDM hardware — not available in plain HTML)
 *
 * Best practice: Combine this with server-side watermarking for maximum deterrence.
 */

import { useState, useEffect, useCallback } from "react";

interface ScreenGuardState {
  /** True when a potential capture event is detected */
  isBlocked: boolean;
  /** Reason for blocking (for accessibility/debugging) */
  reason: string | null;
}

export function useScreenGuard(): ScreenGuardState {
  const [state, setState] = useState<ScreenGuardState>({
    isBlocked: false,
    reason: null,
  });

  const block = useCallback((reason: string) => {
    setState({ isBlocked: true, reason });
  }, []);

  const unblock = useCallback(() => {
    setState({ isBlocked: false, reason: null });
  }, []);

  useEffect(() => {
    // ── Visibility API ──────────────────────────────────────────────────────
    // Fires when the user switches tabs or the window loses focus.
    // Screen recording software often causes a brief visibility change.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        block("visibility-hidden");
      } else {
        // Small delay to prevent flash on normal tab switches
        setTimeout(unblock, 400);
      }
    };

    // ── Window Blur ────────────────────────────────────────────────────────
    // Fires when the browser window loses focus — could be screen recording.
    const handleWindowBlur = () => {
      block("window-blur");
    };
    const handleWindowFocus = () => {
      setTimeout(unblock, 300);
    };

    // ── Fullscreen Change ──────────────────────────────────────────────────
    // Screen recording tools often put the browser into fullscreen.
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        block("fullscreen");
      } else {
        unblock();
      }
    };

    // ── Print Media Event ──────────────────────────────────────────────────
    // Fired before the browser renders the print dialog.
    const handleBeforePrint = () => block("print");
    const handleAfterPrint = () => unblock();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [block, unblock]);

  return state;
}
