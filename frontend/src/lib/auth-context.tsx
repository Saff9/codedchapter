import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useToast } from "@/hooks/use-toast";

// Check if we are running in Mock Mode (no environment variables provided)
// Mock mode is strictly disabled in production.
const IS_MOCK = import.meta.env.PROD ? false : !import.meta.env.VITE_SUPABASE_URL;

interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  isLoading: boolean;
  isMock: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (IS_MOCK) {
      // ── MOCK AUTH LOAD ─────────────────────────────────────────────────────
      const savedUser = localStorage.getItem("mock_auth_user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setSession({ access_token: "mock-token", user: parsedUser });
        } catch (e) {
          localStorage.removeItem("mock_auth_user");
        }
      }
      setIsLoading(false);
      return () => {};
    } else {
      // ── SUPABASE AUTH LOAD ─────────────────────────────────────────────────
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user as unknown as AuthUser || null);
        setIsLoading(false);
      }).catch((err) => {
        console.error("Error loading session", err);
        setIsLoading(false);
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user as unknown as AuthUser || null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    if (IS_MOCK) {
      // Mock log in: accept any password
      const username = email.split("@")[0] || "guest_coder";
      const mockUser: AuthUser = {
        id: "mock-user-123",
        email,
        user_metadata: {
          full_name: username.replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Guest Coder",
          first_name: username.charAt(0).toUpperCase() + username.slice(1) || "Guest",
          last_name: "Coder",
          username,
        },
      };
      localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setSession({ access_token: "mock-token", user: mockUser });
      setIsLoading(false);
      toast({
        title: "Mock Sign In Successful",
        description: `Logged in as ${mockUser.user_metadata?.full_name} (Preview Mode)`,
      });
      return { user: mockUser, session: { access_token: "mock-token" } };
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      } catch (err: any) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: err.message || "Invalid credentials",
        });
        throw err;
      }
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    setIsLoading(true);
    if (IS_MOCK) {
      // Mock registration: accept any details
      const mockUser: AuthUser = {
        id: "mock-user-123",
        email,
        user_metadata: {
          full_name: fullName,
          first_name: fullName.split(" ")[0] || "Guest",
          last_name: fullName.split(" ").slice(1).join(" ") || "Coder",
          username,
        },
      };
      
      // Auto-create a profile in our backend database
      try {
        await fetch("/api/profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer mock-token",
          },
          body: JSON.stringify({
            username,
            displayName: fullName,
            bio: "Learning to code, sharing every facepalm on the way.",
          }),
        });
      } catch (e) {
        console.warn("Failed to create mock profile on backend", e);
      }

      localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setSession({ access_token: "mock-token", user: mockUser });
      setIsLoading(false);
      toast({
        title: "Mock Account Created",
        description: `Welcome ${fullName}! (Preview Mode)`,
      });
      return { user: mockUser, session: { access_token: "mock-token" } };
    } else {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username,
            },
          },
        });
        if (error) throw error;

        // Auto-create profile in database if registration succeeded
        if (data.user) {
          await fetch("/api/profiles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${data.session?.access_token}`,
            },
            body: JSON.stringify({
              username,
              displayName: fullName,
              bio: "",
            }),
          });
        }

        toast({
          title: "Registration Successful",
          description: "Please check your email to confirm registration.",
        });
        return data;
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: err.message || "An error occurred during sign up",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    if (IS_MOCK) {
      localStorage.removeItem("mock_auth_user");
      setUser(null);
      setSession(null);
      setIsLoading(false);
      toast({
        title: "Logged Out",
        description: "You have been logged out (Preview Mode)",
      });
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsLoading(false);
      toast({
        title: "Logged Out",
        description: "You have been logged out",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isMock: IS_MOCK,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
