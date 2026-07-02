import React from "react";
import { C } from "../theme";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        zIndex: 9999,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `4px solid ${C.border}`,
          borderTopColor: C.teal,
          animation: "pharmaSpin 0.9s linear infinite",
        }}
      />
      <p style={{ color: C.teal, fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 14, margin: 0 }}>
        {message}
      </p>
      <style>{`@keyframes pharmaSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
