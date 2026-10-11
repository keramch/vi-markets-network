import { GoogleAuthProvider, signInWithPopup, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth } from "./firebase";

// ── Google sign-in ───────────────────────────────────────────────────────────
// Uses the popup flow (not redirect): it works in Safari/iPhone despite their
// third-party storage blocking, without needing auth to run on our own domain.

// Google refuses to sign people in inside in-app browsers (Instagram,
// Facebook, etc.) — hide the button there and suggest a real browser instead.
export function isInAppBrowser(): boolean {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  return /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|Line\/|MicroMessenger|musical_ly|Bytedance|TikTok|Snapchat|Pinterest/i.test(ua);
}

export function isGoogleUser(user: FirebaseUser | null | undefined): boolean {
  return !!user?.providerData.some((p) => p.providerId === "google.com");
}

// Opens the Google popup. Returns the signed-in Firebase user, or null if the
// person closed the popup. Throws an Error with a friendly message otherwise.
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    return result.user;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
    if (code === "auth/popup-blocked") {
      throw new Error("Your browser blocked the Google sign-in window. Please allow pop-ups for vimarkets.ca and try again.");
    }
    if (code === "auth/account-exists-with-different-credential") {
      throw new Error("You already have an account with this email. Please log in with your email and password.");
    }
    if (code === "auth/network-request-failed") {
      throw new Error("Connection problem. Check your internet connection and try again.");
    }
    console.error("Google sign-in failed:", err);
    throw new Error("Google sign-in didn't work. Please try again, or use your email instead.");
  }
}

// Splits a Google display name into first / last
export function splitDisplayName(displayName: string | null | undefined): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = (displayName ?? "").trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}
