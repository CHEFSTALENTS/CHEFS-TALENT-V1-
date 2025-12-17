"use client";

import { useState } from "react";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const res = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Code incorrect");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", padding: 24 }}>
        <h1>Accès privé</h1>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code d’accès"
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />
        <button onClick={submit} style={{ width: "100%", marginTop: 12 }}>
          Entrer
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
