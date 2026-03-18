import admin from "firebase-admin";

if (!admin.apps.length) {
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
  const serviceAccount = JSON.parse(rawEnv);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const auth = admin.auth();