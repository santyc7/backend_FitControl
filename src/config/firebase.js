import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 👇 Esto asegura que funcione bien incluso si ejecutas desde otra carpeta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, "firebase-key.json");

// Verificación por si el archivo no existe
if (!fs.existsSync(keyPath)) {
  console.error("❌ No se encontró el archivo firebase-key.json en /config");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();

// 👇 Muestra en consola el ID del proyecto conectado
console.log(`✅ Firebase conectado al proyecto: ${serviceAccount.project_id}`);
