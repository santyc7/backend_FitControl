import express from "express";
import cors from "cors";
import { db } from "./config/firebase.js";
import nutritionRoutes from "./routes/nutrition";

const app = express();

// CORS flexible para desarrollo y producción
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options(/.*/, cors());
app.use(express.json());

// Rutas
app.use("/api/nutrition", nutritionRoutes);

// ---------------------- CRUD Usuarios ----------------------
app.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post("/api/usuarios", async (req, res) => {
  try {
    const datos = req.body;

    if (!datos || Object.keys(datos).length === 0) {
      return res.status(400).json({ error: "No se enviaron datos" });
    }

    datos.creadoEn = new Date().toISOString();

    const docRef = await db.collection("users").add(datos);
    res.status(201).json({ message: "Usuario agregado", id: docRef.id, ...datos });

  } catch (error) {
    console.error("❌ Error al agregar usuario:", error);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const datos = req.body;

    const userRef = db.collection("users").doc(id);
    const user = await userRef.get();

    if (!user.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    await userRef.update({ ...datos, actualizadoEn: new Date().toISOString() });

    res.json({ message: "Usuario actualizado" });

  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    const userRef = db.collection("users").doc(id);
    const user = await userRef.get();

    if (!user.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    await userRef.delete();

    res.json({ message: "Usuario eliminado" });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ---------------------- Servidor ----------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
