"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authReady: boolean;
  authError: string | null;
  authRevision: number;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  sendVerificationEmail: () => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }

  return "";
}

function getFriendlyAuthError(errorCode: string, mode: "login" | "signup") {
  if (errorCode === "auth/email-already-in-use") {
    return "This email is already in use. Please log in instead.";
  }

  if (
    errorCode === "auth/invalid-credential" ||
    errorCode === "auth/wrong-password" ||
    errorCode === "auth/user-not-found"
  ) {
    return "Invalid email or password.";
  }

  if (errorCode === "auth/weak-password") {
    return "Please use a stronger password with at least 8 characters, uppercase, lowercase, number, and special character.";
  }

  if (errorCode === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (errorCode === "auth/operation-not-allowed") {
    return "Email and password sign-in is not enabled yet in Firebase Authentication.";
  }

  return mode === "signup"
    ? "We could not create your account. Please try again."
    : "We could not log you in. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(firebaseAuth));
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRevision, setAuthRevision] = useState(0);

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authReady: isFirebaseConfigured,
      authError,
      authRevision,
      signInWithGoogle: async () => {
        setAuthError(null);

        if (!firebaseAuth) {
          setAuthError("Firebase Authentication is not configured yet. Add your Firebase web app keys to .env.local.");
          return false;
        }

        try {
          await signInWithPopup(firebaseAuth, googleProvider);
          return true;
        } catch (error) {
          const errorCode = getFirebaseErrorCode(error);

          if (errorCode === "auth/cancelled-popup-request" || errorCode === "auth/popup-closed-by-user") {
            return false;
          }

          console.warn("Firebase Google sign-in failed:", errorCode || "unknown error");
          setAuthError("We could not complete Google sign-in. Please try again.");
          return false;
        }
      },
      signInWithEmail: async (email, password) => {
        setAuthError(null);

        if (!firebaseAuth) {
          setAuthError("Firebase Authentication is not configured yet. Add your Firebase web app keys to .env.local.");
          return false;
        }

        try {
          await signInWithEmailAndPassword(firebaseAuth, email, password);
          return true;
        } catch (error) {
          const errorCode = getFirebaseErrorCode(error);
          setAuthError(getFriendlyAuthError(errorCode, "login"));
          return false;
        }
      },
      signUpWithEmail: async (email, password) => {
        setAuthError(null);

        if (!firebaseAuth) {
          setAuthError("Firebase Authentication is not configured yet. Add your Firebase web app keys to .env.local.");
          return false;
        }

        try {
          const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          await sendEmailVerification(credential.user);
          return true;
        } catch (error) {
          const errorCode = getFirebaseErrorCode(error);
          setAuthError(getFriendlyAuthError(errorCode, "signup"));
          return false;
        }
      },
      sendPasswordReset: async (email) => {
        setAuthError(null);

        if (!firebaseAuth) {
          setAuthError("Firebase Authentication is not configured yet. Add your Firebase web app keys to .env.local.");
          return false;
        }

        try {
          await sendPasswordResetEmail(firebaseAuth, email);
          return true;
        } catch (error) {
          const errorCode = getFirebaseErrorCode(error);

          if (errorCode === "auth/invalid-email") {
            setAuthError("Please enter a valid email address.");
            return false;
          }

          setAuthError("If an account exists for this email, a password reset link will be sent.");
          return false;
        }
      },
      sendVerificationEmail: async () => {
        setAuthError(null);

        if (!firebaseAuth?.currentUser) {
          setAuthError("Please log in first, then request a verification email.");
          return false;
        }

        try {
          await sendEmailVerification(firebaseAuth.currentUser);
          return true;
        } catch (error) {
          const errorCode = getFirebaseErrorCode(error);

          if (errorCode === "auth/too-many-requests") {
            setAuthError("Too many requests. Please wait a moment before sending another email.");
            return false;
          }

          setAuthError("We could not send a verification email right now. Please try again.");
          return false;
        }
      },
      refreshUser: async () => {
        setAuthError(null);

        if (!firebaseAuth?.currentUser) {
          return false;
        }

        try {
          await reload(firebaseAuth.currentUser);
          setUser(firebaseAuth.currentUser);
          setAuthRevision((current) => current + 1);
          return firebaseAuth.currentUser.emailVerified;
        } catch {
          setAuthError("We could not refresh your verification status. Please try again.");
          return false;
        }
      },
      logout: async () => {
        if (firebaseAuth) {
          await signOut(firebaseAuth);
        }
      },
    }),
    [authError, authRevision, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
