"use client";

import { useEffect, useState } from "react";
import { ReaderProfile } from "@/lib/types";
import { getProfile, clearProfile } from "@/lib/profile";

export function ProfileSidebar() {
  const [profile, setProfile] = useState<ReaderProfile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
    // Listen for storage events (profile updated in background)
    const handler = () => setProfile(getProfile());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!profile) return null;

  return (
    <div className="mt-auto pt-6 border-t border-[rgba(26,20,16,0.08)]">
      <div className="text-[9px] tracking-[0.2em] uppercase text-[rgba(26,20,16,0.3)] mb-3 flex items-center justify-between">
        <span>Reader profile</span>
        <button
          onClick={() => { clearProfile(); setProfile(null); }}
          className="text-[rgba(26,20,16,0.3)] hover:text-[#d4380d] transition-colors"
        >
          clear
        </button>
      </div>
      <p className="text-[11px] font-serif text-[rgba(26,20,16,0.6)] leading-relaxed mb-3">
        {profile.summary}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {profile.favoriteGenres.slice(0, 4).map((g) => (
          <span
            key={g}
            className="text-[9px] px-2 py-0.5 rounded-full bg-[rgba(26,20,16,0.05)] text-[rgba(26,20,16,0.5)]"
          >
            {g}
          </span>
        ))}
      </div>
      <div className="text-[9px] font-mono text-[rgba(26,20,16,0.3)]">
        {profile.readCount} {profile.readCount === 1 ? "book" : "books"} read · last updated {profile.lastUpdated}
      </div>
    </div>
  );
}
