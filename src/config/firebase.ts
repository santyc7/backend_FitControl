import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------------------------------------------------
   🔥 1. MODO PRODUCCIÓN (Render usa ENV)
--------------------------------------------------------- */
if (process.env.GOOGLE_PRIVATE_KEY) {
  console.log("🔥 Firebase inicializado con variables de entorno");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

} else {
  /* ---------------------------------------------------------
     🖥️ 2. MODO LOCAL (usa firebase-key.json)
  --------------------------------------------------------- */
  console.log("📁 Usando firebase-key.json (modo local)");

  const keyPath = path.join(__dirname, "firebase-key.json");

  if (!fs.existsSync(keyPath)) {
    console.error("❌ No se encontró firebase-key.json");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
