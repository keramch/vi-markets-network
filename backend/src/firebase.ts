import admin from "firebase-admin";

// Only initialize once (ts-node-dev can reload code)
if (!admin.apps.length) {
  // This uses the JSON file you put in the backend folder
  // Do NOT commit this file to git later – it's secret.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require("../serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
