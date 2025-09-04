// components/DebugEnv.tsx
"use client";
import { useEffect } from "react";

export default function DebugEnv() {
  useEffect(() => {
    console.log("URL Supabase  =", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("ANON KEY     =", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);
  return null;
}
