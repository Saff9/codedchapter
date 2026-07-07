/*
 * api.ts
 * ======
 * Central API client for the frontend.
 *
 * Two modes — chosen automatically based on whether VITE_API_URL is set:
 *
 *   No backend (VITE_API_URL not set)
 *     Post reads go directly to Substack's public API.
 *     Doubts, comments, and profiles still try the local /api proxy.
 *     This is the mode used when running on Vercel without a backend.
 *
 *   With backend (VITE_API_URL set)
 *     All requests go through the backend as normal.
 *     Posts are served from the backend's Substack RSS cache.
 *
 * The switch is invisible to the rest of the app. All callers use `api.*`
 * and get back the same shape either way.
 */

import { supabase } from "./supabase";
import {
  fetchSubstackDirect,
  fetchSubstackPostById,
  fetchSubstackTags,
} from "./substack-direct";

// If VITE_API_URL is not set in the environment, there is no backend.
// In that case post reads go to Substack directly.
const API_URL = import.meta.env.VITE_API_URL ?? "";
const HAS_BACKEND = API_URL.trim().length > 0;

const baseEnv = API_URL || "/api";
const BASE = baseEnv !== "/api" && !baseEnv.endsWith("/api") && !baseEnv.endsWith("/api/")
  ? baseEnv.replace(/\/$/, "") + "/api"
  : baseEnv;

// ── Authenticated HTTP helper ─────────────────────────────────────────────────

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  // Attach Supabase auth token when the user is signed in
  let token: string | null = null;
  const mockUserStr = localStorage.getItem("mock_auth_user");
  if (mockUserStr) {
    token = "mock-token";
  } else {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token ?? null;
    } catch {
      // No auth session — continue without token
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

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

// ── Public API ────────────────────────────────────────────────────────────────

export const api = {

  // Posts
  // When no backend is configured, these go straight to Substack's public API.
  // When a backend is available, they go through the backend as normal.

  listPosts: (category?: string, tag?: string, limit?: number, offset?: number, authorId?: string) => {
    if (!HAS_BACKEND) {
      // authorId filtering is not possible without a backend (Substack has no concept of it)
      return fetchSubstackDirect({ category, tag, limit });
    }
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (tag)      params.append("tag", tag);
    if (limit !== undefined)  params.append("limit",    String(limit));
    if (offset !== undefined) params.append("offset",   String(offset));
    if (authorId) params.append("authorId", authorId);
    const query = params.toString();
    return req<any[]>(`/posts${query ? `?${query}` : ""}`);
  },

  getFeaturedPosts: () => {
    if (!HAS_BACKEND) {
      return fetchSubstackDirect({ limit: 3 });
    }
    return req<any[]>("/posts/featured");
  },

  getAllTags: () => {
    if (!HAS_BACKEND) {
      return fetchSubstackTags();
    }
    return req<string[]>("/posts/tags");
  },

  getPost: (id: number) => {
    if (!HAS_BACKEND) {
      return fetchSubstackPostById(id);
    }
    return req<any>(`/posts/${id}`);
  },

  createPost:  (body: object) => req<any>("/posts",      { method: "POST",   body: JSON.stringify(body) }),
  updatePost:  (id: number, body: object) => req<any>(`/posts/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deletePost:  (id: number) => req<any>(`/posts/${id}`,  { method: "DELETE" }),

  // Comments — always go through the backend (reading comments without a backend returns empty)
  listComments:  (postId: number) => {
    if (!HAS_BACKEND) return Promise.resolve([] as any[]);
    return req<any[]>(`/posts/${postId}/comments`);
  },
  createComment: (postId: number, body: object) =>
    req<any>(`/posts/${postId}/comments`,               { method: "POST",   body: JSON.stringify(body) }),
  deleteComment: (postId: number, commentId: number) =>
    req<any>(`/posts/${postId}/comments/${commentId}`,  { method: "DELETE" }),

  // Profiles — always go through the backend
  getMyProfile: () => req<any>("/profiles/me"),
  getProfile:   (username: string) => req<any>(`/profiles/${username}`),
  checkUsername:(username: string) => req<any>(`/profiles/check-username/${username}`),
  upsertProfile:(body: object) => req<any>("/profiles", { method: "POST",   body: JSON.stringify(body) }),

  // Doubts — always go through the backend
  listDoubts: (tag?: string, limit?: number, offset?: number, authorId?: string) => {
    if (!HAS_BACKEND) return Promise.resolve([] as any[]);
    const params = new URLSearchParams();
    if (tag)      params.append("tag",      tag);
    if (limit !== undefined)  params.append("limit",  String(limit));
    if (offset !== undefined) params.append("offset", String(offset));
    if (authorId) params.append("authorId", authorId);
    const query = params.toString();
    return req<any[]>(`/doubts${query ? `?${query}` : ""}`);
  },
  getDoubt:     (id: number) => req<any>(`/doubts/${id}`),
  createDoubt:  (body: object) => req<any>("/doubts",            { method: "POST",   body: JSON.stringify(body) }),
  deleteDoubt:  (id: number) => req<any>(`/doubts/${id}`,        { method: "DELETE" }),
  createAnswer: (doubtId: number, body: object) =>
    req<any>(`/doubts/${doubtId}/answers`,                       { method: "POST",   body: JSON.stringify(body) }),
  deleteAnswer: (doubtId: number, answerId: number) =>
    req<any>(`/doubts/${doubtId}/answers/${answerId}`,           { method: "DELETE" }),
  acceptAnswer: (doubtId: number, answerId: number) =>
    req<any>(`/doubts/${doubtId}/answers/${answerId}/accept`,    { method: "PATCH"  }),
};
