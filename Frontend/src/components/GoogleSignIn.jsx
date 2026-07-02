import React, { useEffect, useRef } from "react";
import { C } from "../theme";

export default function GoogleSignIn({ clientId, onSuccess, onError, disabled }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!clientId || !btnRef.current) return;

    const renderButton = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onSuccess(response.credential),
        auto_select: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: btnRef.current.offsetWidth || 388,
        text: "continue_with",
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderButton;
    script.onerror = () => onError?.("Failed to load Google Sign-In");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [clientId, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div ref={btnRef} style={{ width: "100%", minHeight: 44, display: "flex", justifyContent: "center" }} />
      <p style={{ textAlign: "center", color: C.muted, fontSize: 11, margin: "12px 0 0" }}>
        Sign in with your Google account
      </p>
    </div>
  );
}
