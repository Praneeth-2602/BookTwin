const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadBookPDF(file: File): Promise<{
  session_id: string;
  chunk_count: number;
  title_guess: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/chat/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function* streamChatMessage(
  session_id: string,
  message: string
): AsyncGenerator<{ token?: string; done?: boolean; sources?: string[]; error?: string }> {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, message }),
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Chat failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch (_) {}
      }
    }
  }
}

export async function fetchCharacterGraph(book_title: string) {
  const res = await fetch(`${API_BASE}/api/graph/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Graph failed: ${res.status}`);
  }
  return res.json();
}
