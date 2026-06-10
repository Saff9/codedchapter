import { supabase } from "./supabase";

const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  // Extract auth token
  let token: string | null = null;
  const mockUserStr = localStorage.getItem("mock_auth_user");
  if (mockUserStr) {
    token = "mock-token";
  } else {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    } catch (e) {
      // Ignore
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let errMsg = "Request failed";
    try {
      const parsed = JSON.parse(text);
      errMsg = parsed.error ?? parsed.message ?? errMsg;
    } catch {
      errMsg = text || `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(typeof errMsg === "string" ? errMsg : "Request failed");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  // Posts
  listPosts: (category?: string, tag?: string, limit?: number, offset?: number, authorId?: string) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (tag) params.append("tag", tag);
    if (limit !== undefined) params.append("limit", String(limit));
    if (offset !== undefined) params.append("offset", String(offset));
    if (authorId) params.append("authorId", authorId);
    const query = params.toString();
    return req<any[]>(`/posts${query ? `?${query}` : ""}`);
  },
  getFeaturedPosts: () => req<any[]>("/posts/featured"),
  getAllTags: () => req<string[]>("/posts/tags"),
  getPost: (id: number) => req<any>(`/posts/${id}`),
  createPost: (body: object) => req<any>("/posts", { method: "POST", body: JSON.stringify(body) }),
  updatePost: (id: number, body: object) => req<any>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePost: (id: number) => req<any>(`/posts/${id}`, { method: "DELETE" }),

  // Comments
  listComments: (postId: number) => req<any[]>(`/posts/${postId}/comments`),
  createComment: (postId: number, body: object) => req<any>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(body) }),
  deleteComment: (postId: number, commentId: number) => req<any>(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),

  // Profiles
  getMyProfile: () => req<any>("/profiles/me"),
  getProfile: (username: string) => req<any>(`/profiles/${username}`),
  checkUsername: (username: string) => req<any>(`/profiles/check-username/${username}`),
  upsertProfile: (body: object) => req<any>("/profiles", { method: "POST", body: JSON.stringify(body) }),

  // Doubts
  listDoubts: (tag?: string, limit?: number, offset?: number, authorId?: string) => {
    const params = new URLSearchParams();
    if (tag) params.append("tag", tag);
    if (limit !== undefined) params.append("limit", String(limit));
    if (offset !== undefined) params.append("offset", String(offset));
    if (authorId) params.append("authorId", authorId);
    const query = params.toString();
    return req<any[]>(`/doubts${query ? `?${query}` : ""}`);
  },
  getDoubt: (id: number) => req<any>(`/doubts/${id}`),
  createDoubt: (body: object) => req<any>("/doubts", { method: "POST", body: JSON.stringify(body) }),
  deleteDoubt: (id: number) => req<any>(`/doubts/${id}`, { method: "DELETE" }),
  createAnswer: (doubtId: number, body: object) => req<any>(`/doubts/${doubtId}/answers`, { method: "POST", body: JSON.stringify(body) }),
  deleteAnswer: (doubtId: number, answerId: number) => req<any>(`/doubts/${doubtId}/answers/${answerId}`, { method: "DELETE" }),
  acceptAnswer: (doubtId: number, answerId: number) => req<any>(`/doubts/${doubtId}/answers/${answerId}/accept`, { method: "PATCH" }),
};
