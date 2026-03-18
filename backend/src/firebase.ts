import admin from "firebase-admin";

if (!admin.apps.length) {
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
  console.log("ENV LENGTH:", rawEnv.length);
  console.log("FIRST 50 CHARS:", rawEnv.substring(0, 50));
  const serviceAccount = JSON.parse(rawEnv);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const auth = admin.auth();