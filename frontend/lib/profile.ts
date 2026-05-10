import { ReaderProfile } from "./types";

const PROFILE_KEY = "booktwin_profile";

export function getProfile(): ReaderProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: ReaderProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (_) {}
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function getProfileContext(): string {
  const profile = getProfile();
  if (!profile) return "";
  return `Reader profile (${profile.readCount} books): ${profile.summary} Favourite genres: ${profile.favoriteGenres.join(", ")}.`;
}

export async function updateProfileAfterRecommendation(
  recommendation: object,
  mood: string
): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const currentProfile = getProfile();

  try {
    const res = await fetch(`${API_BASE}/api/profile/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_profile: currentProfile ? JSON.stringify(currentProfile) : "",
        new_recommendation: recommendation,
        mood,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.updated_profile) {
      const updated: ReaderProfile = {
        version: 1,
        lastUpdated: new Date().toISOString().split("T")[0],
        summary: data.updated_profile.summary || "",
        favoriteGenres: data.updated_profile.favoriteGenres || [],
        recentMoods: data.updated_profile.recentMoods || [],
        readCount: data.updated_profile.readCount || 1,
      };
      saveProfile(updated);
    }
  } catch (_) {
    // Non-critical — silently ignore
  }
}
