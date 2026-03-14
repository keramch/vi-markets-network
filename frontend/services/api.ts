import type { Market, Vendor, User, Review, Application, MembershipPlan, NotificationSettings, MemberStatus } from '../types';
import { markets as mockMarkets, vendors as mockVendors, applications as mockApplications, users as mockUsers } from '../data/mockData';

// --- SIMULATED DATABASE ---
let markets: Market[] = JSON.parse(JSON.stringify(mockMarkets));
let vendors: Vendor[] = JSON.parse(JSON.stringify(mockVendors));
let applications: Application[] = JSON.parse(JSON.stringify(mockApplications));
let users: User[] = JSON.parse(JSON.stringify(mockUsers));

const SIMULATED_LATENCY = 500;

const simulateRequest = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => resolve(data), SIMULATED_LATENCY);
    });
};

// --- API FUNCTIONS ---

export const getMarkets = () => simulateRequest(markets);
export const getVendors = () => simulateRequest(vendors);
export const getUsers = () => simulateRequest(users);
export const getApplications = () => simulateRequest(applications);

export const login = (email: string, postalCode: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const emailLower = email.toLowerCase();
            let user = users.find(u => u.email.toLowerCase() === emailLower);

            if (user) {
                resolve(user);
            } else {
                // Auto-create a new "free" user if they don't exist
                 const newUser: User = { 
                    id: `user-${Date.now()}`, 
                    email,
                    postalCode,
                    membership: 'free',
                    isAdmin: false,
                    autoRenew: false,
                    isFoundingMember: false,
                    notificationSettings: {
                        favoriteMarket: true,
                        favoriteVendor: true,
                        nearbyMarket: false,
                    },
                };
                users.push(newUser);
                resolve(newUser);
            }
        }, SIMULATED_LATENCY);
    });
};

export const updateUser = (userId: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updates };
                resolve(users[userIndex]);
            } else {
                reject(new Error("User not found"));
            }
        }, SIMULATED_LATENCY);
    });
};

export const setFoundingMember = (userId: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                const user = users[userIndex];
                const newMembership = user.ownedMarketId ? 'market-pro-lifetime' : 'vendor-pro-lifetime';
                users[userIndex] = { 
                    ...user, 
                    isFoundingMember: true,
                    membership: newMembership
                };
                resolve(users[userIndex]);
            } else {
                reject(new Error("User not found"));
            }
        }, SIMULATED_LATENCY);
    });
}

export const addReview = (entityType: 'market' | 'vendor', entityId: string, reviewData: Omit<Review, 'id' | 'date' | 'status'>): Promise<Review> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newReview: Review = {
                id: `rev-${Date.now()}`,
                ...reviewData,
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
            };
            
            if (entityType === 'market') {
                markets = markets.map(m => m.id === entityId ? { ...m, reviews: [newReview, ...m.reviews] } : m);
            } else {
                vendors = vendors.map(v => v.id === entityId ? { ...v, reviews: [newReview, ...v.reviews] } : v);
            }
            resolve(newReview);
        }, SIMULATED_LATENCY);
    });
};

export const moderateReview = (entityId: string, reviewId: string, status: 'approved' | 'declined'): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
             const updateReviews = (reviews: Review[]) => reviews.map(r => r.id === reviewId ? {...r, status} : r);
             markets = markets.map(m => m.id === entityId ? {...m, reviews: updateReviews(m.reviews)} : m);
             vendors = vendors.map(v => v.id === entityId ? {...v, reviews: updateReviews(v.reviews)} : v);
             resolve();
        }, SIMULATED_LATENCY);
    });
};

export const updateMarket = (marketId: string, updates: Partial<Market>): Promise<Market> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = markets.findIndex(m => m.id === marketId);
            if (index !== -1) {
                markets[index] = { ...markets[index], ...updates };
                resolve(markets[index]);
            } else {
                reject(new Error("Market not found"));
            }
        }, SIMULATED_LATENCY);
    });
};

export const updateVendor = (vendorId: string, updates: Partial<Vendor>): Promise<Vendor> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = vendors.findIndex(v => v.id === vendorId);
            if (index !== -1) {
                vendors[index] = { ...vendors[index], ...updates };
                resolve(vendors[index]);
            } else {
                reject(new Error("Vendor not found"));
            }
        }, SIMULATED_LATENCY);
    });
};

export const createApplication = (vendorId: string, marketId: string, customResponses: { question: string, answer: string }[]): Promise<Application> => {
    return new Promise(resolve => {
        setTimeout(() => {
             const newApplication: Application = {
                id: `app-${Date.now()}`,
                vendorId,
                marketId,
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                customResponses,
            };
            applications.push(newApplication);
            resolve(newApplication);
        }, SIMULATED_LATENCY);
    });
};

export const updateApplicationStatus = (applicationId: string, status: 'approved' | 'rejected'): Promise<Application> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = applications.findIndex(app => app.id === applicationId);
            if (index !== -1) {
                applications[index].status = status;
                resolve(applications[index]);
            } else {
                reject(new Error("Application not found"));
            }
        }, SIMULATED_LATENCY);
    });
};

export const deleteMember = (memberId: string, type: 'market' | 'vendor'): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (type === 'market') {
                markets = markets.filter(m => m.id !== memberId);
            } else {
                vendors = vendors.filter(v => v.id !== memberId);
            }
            resolve();
        }, SIMULATED_LATENCY);
    });
}