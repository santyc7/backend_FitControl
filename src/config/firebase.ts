import admin from "firebase-admin";

// 🚀 KEY DESDE VARIABLE DE ENTORNO (Railway)
let serviceAccount: any;

if (process.env.FIREBASE_KEY) {
  // La variable viene codificada, así que la parseamos
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  console.log("🔥 Usando FIREBASE_KEY desde variables de entorno (Railway)");
} else {
  // 🖥️ MODO LOCAL: Cargar archivo firebase-key.json
  console.log("🖥️ Usando firebase-key.json local");
  //serviceAccount = await import("./firebase-key.json", { assert: { type: "json" } });
  serviceAccount = serviceAccount.default;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();

console.log(`✅ Firebase conectado al proyecto: ${serviceAccount.project_id}`);
