"use client";

import Script from "next/script";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export type TurnstileFieldHandle = {
  reset: () => void;
};

type TurnstileFieldProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TurnstileField = forwardRef<TurnstileFieldHandle, TurnstileFieldProps>(
  function TurnstileField({ siteKey, onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    const clearToken = useCallback(() => {
      onTokenChange(null);
    }, [onTokenChange]);

    const resetWidget = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      clearToken();
    }, [clearToken]);

    useImperativeHandle(ref, () => ({ reset: resetWidget }), [resetWidget]);

    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token: string) => onTokenChange(token),
        "expired-callback": clearToken,
        "error-callback": clearToken,
      });

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [scriptReady, siteKey, onTokenChange, clearToken]);

    return (
      <>
        <Script
          src={TURNSTILE_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
        <div
          ref={containerRef}
          className="min-h-[65px] max-w-full overflow-x-auto"
          aria-hidden={false}
        />
      </>
    );
  }
);

export default TurnstileField;
