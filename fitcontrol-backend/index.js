import express from "express";
import cors from "cors"; // 👈 importar cors
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { onRequest, onCall } from "firebase-functions/v2/https";
import { db } from "./src/config/firebase.js"; // 🔧 ruta corregida porque dijiste que está dentro de src/

const app = express();

/* ----------------------- CONFIGURACIÓN CORS ----------------------- */
// 👇 Permitir solicitudes desde el frontend (puerto 5173)
app.use(cors({
  origin: "http://localhost:5173", // o "*" si quieres permitir cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ⚙️ Manejo de preflight (para Express 5 evitar error con '*')
app.options(/.*/, cors());

app.use(express.json());


/* ----------------------- CRUD DE USUARIOS ----------------------- */

// 🟢 Ruta GET (listar usuarios)
app.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(users);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// 🟢 Ruta POST (agregar usuario)
app.post("/api/usuarios", async (req, res) => {
  try {
    const datos = req.body;
    if (!datos || Object.keys(datos).length === 0) {
      return res.status(400).json({ error: "No se enviaron datos en la solicitud" });
    }
    datos.creadoEn = new Date().toISOString();
    const docRef = await db.collection("users").add(datos);
    res.status(201).json({
      message: "✅ Usuario agregado correctamente",
      id: docRef.id,
      ...datos,
    });
  } catch (error) {
    console.error("❌ Error al agregar usuario:", error);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

// 🟡 Ruta PUT (actualizar usuario por ID)
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    if (!id) return res.status(400).json({ error: "Falta el ID del usuario" });

    const usuarioRef = db.collection("users").doc(id);
    const usuario = await usuarioRef.get();
    if (!usuario.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    await usuarioRef.update({
      ...datosActualizados,
      actualizadoEn: new Date().toISOString(),
    });

    res.json({ message: "✅ Usuario actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// 🔴 Ruta DELETE (eliminar usuario por ID)
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioRef = db.collection("users").doc(id);
    const usuario = await usuarioRef.get();

    if (!usuario.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await usuarioRef.delete();
    res.json({ message: "🗑️ Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});


/* ----------------------- CLOUD FUNCTIONS LÓGICA ----------------------- */

// 🧩 Función para generar plan personalizado
export const generatePlan = onCall(async (request) => {
  const { uid, objetivo, peso, altura, edad, genero } = request.data;

  if (!uid || !objetivo) {
    throw new Error("Faltan datos obligatorios (uid u objetivo)");
  }

  let rutina = [];
  let alimentacion = [];

  if (objetivo === "bajar_peso") {
    rutina = ["Cardio 30min", "Sentadillas 3x15", "Plancha 3x1min"];
    alimentacion = ["Ensaladas", "Pechuga", "Avena"];
  } else if (objetivo === "subir_peso") {
    rutina = ["Pesas 4x10", "Press banca", "Dominadas"];
    alimentacion = ["Arroz", "Pollo", "Batidos de proteína"];
  } else {
    rutina = ["Full body 3x10", "Caminata 20min"];
    alimentacion = ["Balanceado", "Frutas", "Verduras"];
  }

  const plan = {
    uid,
    objetivo,
    rutina,
    alimentacion,
    creadoEn: new Date().toISOString(),
  };

  await db.collection("planes").doc(uid).set(plan);
  return { message: "✅ Plan generado exitosamente", plan };
});

// 🧩 Obtener plan de usuario
export const getUserPlan = onCall(async (request) => {
  const { uid } = request.data;
  if (!uid) throw new Error("Falta el UID del usuario");

  const planRef = db.collection("planes").doc(uid);
  const doc = await planRef.get();

  if (!doc.exists) throw new Error("El usuario no tiene plan asignado");

  return doc.data();
});

// 🧩 Actualizar perfil
export const updateUserProfile = onCall(async (request) => {
  const { uid, data } = request.data;
  if (!uid || !data) throw new Error("Faltan datos");

  const userRef = db.collection("users").doc(uid);
  await userRef.update({
    ...data,
    actualizadoEn: new Date().toISOString(),
  });

  return { message: "✅ Perfil actualizado correctamente" };
});


/* ----------------------- RUTAS DE PLANES (LOCAL) ----------------------- */

// 🟢 Generar plan desde Express (POST /api/planes)
app.post("/api/planes", async (req, res) => {
  try {
    const { uid, objetivo, peso, altura, edad, genero } = req.body;

    if (!uid || !objetivo) {
      return res.status(400).json({ error: "Faltan datos obligatorios (uid u objetivo)" });
    }

    let rutina = [];
    let alimentacion = [];

    if (objetivo === "bajar_peso") {
      rutina = ["Cardio 30min", "Sentadillas 3x15", "Plancha 3x1min"];
      alimentacion = ["Ensaladas", "Pechuga", "Avena"];
    } else if (objetivo === "subir_peso") {
      rutina = ["Pesas 4x10", "Press banca", "Dominadas"];
      alimentacion = ["Arroz", "Pollo", "Batidos de proteína"];
    } else {
      rutina = ["Full body 3x10", "Caminata 20min"];
      alimentacion = ["Balanceado", "Frutas", "Verduras"];
    }

    const plan = {
      uid,
      objetivo,
      rutina,
      alimentacion,
      creadoEn: new Date().toISOString(),
    };

    await db.collection("planes").doc(uid).set(plan);
    res.status(201).json({ message: "✅ Plan generado correctamente", plan });
  } catch (error) {
    console.error("❌ Error al generar plan:", error);
    res.status(500).json({ error: "Error al generar plan" });
  }
});

// 🟡 Obtener plan por UID (GET /api/planes/:uid)
app.get("/api/planes/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection("planes").doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Plan no encontrado para este usuario" });
    }

    res.json(doc.data());
  } catch (error) {
    console.error("❌ Error al obtener plan:", error);
    res.status(500).json({ error: "Error al obtener plan" });
  }
});


/* ----------------------- DEPLOY EXPRESS APP ----------------------- */
export const api = onRequest(app);


/* ----------------------- LOCAL SERVER ----------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor local corriendo en http://localhost:${PORT}`);
});
