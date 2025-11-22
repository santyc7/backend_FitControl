import express from "express";
import cors from "cors";
import { db } from "./config/firebase";
import nutritionRoutes from "./routes/nutrition";

const app = express();

// CORS (permitir todo para APK y Render)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Rutas modulares
app.use("/api/nutrition", nutritionRoutes);

/* ----------------------- CRUD DE USUARIOS ----------------------- */
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
      return res.status(400).json({ error: "No se enviaron datos en la solicitud" });
    }

    datos.creadoEn = new Date().toISOString();
    const docRef = await db.collection("users").add(datos);

    res.status(201).json({
      message: "✅ Usuario agregado correctamente",
      id: docRef.id,
      ...datos
    });

  } catch (error) {
    console.error("❌ Error al agregar usuario:", error);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const datosActualizados = req.body;

    if (!id) return res.status(400).json({ error: "Falta el ID del usuario" });

    const usuarioRef = db.collection("users").doc(id);
    const usuario = await usuarioRef.get();

    if (!usuario.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    await usuarioRef.update({
      ...datosActualizados,
      actualizadoEn: new Date().toISOString()
    });

    res.json({ message: "✅ Usuario actualizado correctamente" });

  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const usuarioRef = db.collection("users").doc(id);

    const usuario = await usuarioRef.get();
    if (!usuario.exists) return res.status(404).json({ error: "Usuario no encontrado" });

    await usuarioRef.delete();

    res.json({ message: "🗑️ Usuario eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

/* ----------------------- SERVER ----------------------- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API escuchando en el puerto ${PORT}`);
});
