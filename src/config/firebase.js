import admin from "firebase-admin";

// Las variables vienen desde Railway (Environment Variables)
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// Validación
if (!serviceAccount.project_id) {
  console.error("❌ Error: Variables FIREBASE_ no configuradas en Railway");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

console.log(`✅ Firebase conectado al proyecto: ${serviceAccount.project_id}`);
