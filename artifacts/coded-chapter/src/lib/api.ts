const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Posts
  createPost: (body: object) => req("/posts", { method: "POST", body: JSON.stringify(body) }),
  updatePost: (id: number, body: object) => req(`/posts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePost: (id: number) => req(`/posts/${id}`, { method: "DELETE" }),

  // Profiles
  getMyProfile: () => req("/profiles/me"),
  getProfile: (username: string) => req(`/profiles/${username}`),
  checkUsername: (username: string) => req(`/profiles/check-username/${username}`),
  upsertProfile: (body: object) => req("/profiles", { method: "POST", body: JSON.stringify(body) }),

  // Doubts
  listDoubts: (tag?: string) => req<any[]>(`/doubts${tag ? `?tag=${tag}` : ""}`),
  getDoubt: (id: number) => req<any>(`/doubts/${id}`),
  createDoubt: (body: object) => req("/doubts", { method: "POST", body: JSON.stringify(body) }),
  deleteDoubt: (id: number) => req(`/doubts/${id}`, { method: "DELETE" }),
  createAnswer: (doubtId: number, body: object) => req(`/doubts/${doubtId}/answers`, { method: "POST", body: JSON.stringify(body) }),
  deleteAnswer: (doubtId: number, answerId: number) => req(`/doubts/${doubtId}/answers/${answerId}`, { method: "DELETE" }),
  acceptAnswer: (doubtId: number, answerId: number) => req(`/doubts/${doubtId}/answers/${answerId}/accept`, { method: "PATCH" }),
};
