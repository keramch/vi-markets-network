import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "./firebase";
import type {
  Market,
  Vendor,
  User,
  Review,
  Application,
  NotificationSettings,
  MemberStatus,
  MarketEvent
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof (data as any).error === "string") {
        message = (data as any).error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  try {
    return (await res.json()) as T;
  } catch {
    // if no JSON body
    return undefined as unknown as T;
  }
}

// -------- NORMALIZERS --------

function normalizeMarket(raw: any): Market {
  return {
    ...raw,
    reviews: raw.reviews || [],
    photos: raw.photos || [],
    status: raw.status || "active",
    location:
  raw.location ||
  ({
    address: "",
    city: "",
    region: "",
    coordinates: undefined
  } as any)
  } as Market;
}

function normalizeVendor(raw: any): Vendor {
  return {
    ...raw,
    reviews: raw.reviews || [],
    photos: raw.photos || [],
    attendingMarketIds: raw.attendingMarketIds || [],
    status: raw.status || "active"
  } as Vendor;
}

function normalizeUser(raw: any): User {
  return {
    ...raw,
    notificationSettings:
      raw.notificationSettings || {
        favoriteMarket: true,
        favoriteVendor: true,
        nearbyMarket: false
      }
  } as User;
}

function normalizeApplication(raw: any): Application {
  return {
    ...raw,
    customResponses: raw.customResponses || []
  } as Application;
}

// -------- API FUNCTIONS --------

// LISTS

export const getMarkets = async (): Promise<Market[]> => {
  const raw = await request<any[]>("/markets");
  return raw.map(normalizeMarket);
};

export const getVendors = async (): Promise<Vendor[]> => {
  const raw = await request<any[]>("/vendors");
  return raw.map(normalizeVendor);
};

export const getUsers = async (): Promise<User[]> => {
  const raw = await request<any[]>("/users");
  return raw.map(normalizeUser);
};

export const getApplications = async (): Promise<Application[]> => {
  const raw = await request<any[]>("/applications");
  return raw.map(normalizeApplication);
};

// LOGIN — signs in via Firebase Auth, then fetches the Firestore user document

export const login = async (email: string, password: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const authedEmail = credential.user.email!;
  return fetchMe(authedEmail);
};

// FETCH ME — retrieves the Firestore user doc by email (used after login / on page reload)

export const fetchMe = (email: string): Promise<User> => {
  return request<User>(`/auth/me?email=${encodeURIComponent(email)}`).then(normalizeUser);
};

// REGISTER

export const register = (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: "vendor" | "market";
  businessName: string;
  city: string;
  description?: string;
  plan?: string;
  vendorTypes?: string[];
  categories?: string[];
  tags?: string[];
}): Promise<User> => {
  return request<User>("/users/register", {
    method: "POST",
    body: JSON.stringify(data),
  }).then(normalizeUser);
};

// USERS

export const updateUser = (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  return request<User>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

export const setFoundingMember = (userId: string, currentSub: User['subscription']): Promise<User> => {
  return updateUser(userId, { subscription: { ...currentSub, tier: 'pro', foundingMember: true } });
};

// MARKETS

export const updateMarket = (
  marketId: string,
  updates: Partial<Market>
): Promise<Market> => {
  return request<Market>(`/markets/${marketId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

// VENDORS

export const updateVendor = (
  vendorId: string,
  updates: Partial<Vendor>
): Promise<Vendor> => {
  return request<Vendor>(`/vendors/${vendorId}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
};

// REVIEWS

export const addReview = (
  entityType: "market" | "vendor",
  entityId: string,
  reviewData: Omit<Review, "id" | "date" | "status">
): Promise<Review> => {
  const { rating, comment, author } = reviewData;

  return request<Review>("/reviews", {
    method: "POST",
    body: JSON.stringify({
      entityType,
      entityId,
      rating,
      comment,
      author
    })
  });
};

export const moderateReview = (
  entityId: string, // kept for signature compatibility
  reviewId: string,
  status: "approved" | "declined"
): Promise<void> => {
  return request<void>(`/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
};

// APPLICATIONS

export const createApplication = (
  vendorId: string,
  marketId: string,
  customResponses: { question: string; answer: string }[]
): Promise<Application> => {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify({ vendorId, marketId, customResponses })
  });
};

export const updateApplicationStatus = (
  applicationId: string,
  status: "approved" | "rejected"
): Promise<Application> => {
  return request<Application>(`/applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
};

// ADMIN — send message to a member

export const sendAdminMessage = (
  to: string,
  subject: string,
  body: string
): Promise<void> => {
  return request<void>("/admin/message", {
    method: "POST",
    body: JSON.stringify({ to, subject, body }),
  });
};

// MARKET EVENTS

export const getMarketEvents = async (params: {
  marketPageId?: string;
  status?: string;
  month?: number;
  year?: number;
} = {}): Promise<MarketEvent[]> => {
  const qs = new URLSearchParams();
  if (params.marketPageId) qs.set("marketPageId", params.marketPageId);
  if (params.status) qs.set("status", params.status);
  if (params.month !== undefined) qs.set("month", String(params.month));
  if (params.year !== undefined) qs.set("year", String(params.year));
  const query = qs.toString();
  return request<MarketEvent[]>(`/market-events${query ? `?${query}` : ""}`);
};

export const createMarketEvent = (
  data: Omit<MarketEvent, "id" | "createdAt" | "updatedAt">
): Promise<MarketEvent> => {
  return request<MarketEvent>("/market-events", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateMarketEvent = (
  id: string,
  updates: Partial<MarketEvent>
): Promise<MarketEvent> => {
  return request<MarketEvent>(`/market-events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
};

export const archiveMarketEvent = (id: string): Promise<void> => {
  return request<void>(`/market-events/${id}`, { method: "DELETE" });
};

// ADMIN — hard delete (market/vendor + owner user + Firebase Auth)

export const hardDeleteMember = (
  memberId: string,
  type: "market" | "vendor"
): Promise<void> => {
  return request<void>(`/admin/members/${type}/${memberId}`, {
    method: "DELETE",
  });
};
