import admin from "firebase-admin";

// Si existe GOOGLE_PRIVATE_KEY (Render), usar variables de entorno
if (process.env.GOOGLE_PRIVATE_KEY) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      // OJO: reemplazo obligatorio porque las keys vienen con \n escapados en Render
      privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    })
  });

  console.log("🔥 Firebase inicializado mediante variables de entorno.");
} 
// Caso local → usar firebase-key.json
else {
  console.log("📁 Usando firebase-key.json (modo local)");

  const serviceAccount = await import("./firebase-key.json", {
    assert: { type: "json" }
  }).then(m => m.default);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const db = admin.firestore();
