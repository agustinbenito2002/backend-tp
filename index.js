import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "./db.js";

const app = express();
app.use(express.json());

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================
// JWT CONFIG
// ============================
const SECRET_KEY = "MI_SECRETO_SUPER_SEGURO";

// Middleware para proteger rutas
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ============================
// AUTENTICACIÓN
// ============================

// Registrar usuario
app.post("/api/auth/register", async (req, res) => {
  const { email, password, nombre } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ email, password: hashed, nombre }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Usuario registrado", user: data });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user)
    return res.status(400).json({ error: "Usuario no encontrado" });

  const coincide = await bcrypt.compare(password, user.password);

  if (!coincide)
    return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
    expiresIn: "2h",
  });

  res.json({ message: "Login exitoso", token });
});

// Ruta protegida de prueba
app.get("/api/auth/profile", verificarToken, (req, res) => {
  res.json({ message: "Acceso permitido", usuario: req.usuario });
});

// ============================
// CRUD - DUENIOS
// ============================

app.post("/api/duenios", async (req, res) => {
  const { duenio, telefono, mail, direccion } = req.body;

  const { data, error } = await supabase
    .from("duenios")
    .insert([{ duenio, telefono, mail, direccion }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/duenios", async (req, res) => {
  const { data, error } = await supabase.from("duenios").select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/duenios/:id_duenio", async (req, res) => {
  const id = Number(req.params.id_duenio);

  const { data, error } = await supabase
    .from("duenios")
    .select("*")
    .eq("id_duenio", id)
    .single();

  if (error) return res.status(404).json({ error: "Duenio no encontrado" });
  res.json(data);
});

app.put("/api/duenios/:id_duenio", async (req, res) => {
  const id = Number(req.params.id_duenio);
  const { duenio, telefono, mail, direccion } = req.body;

  const { data, error } = await supabase
    .from("duenios")
    .update({ duenio, telefono, mail, direccion })
    .eq("id_duenio", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/duenios/:id_duenio", async (req, res) => {
  const id = Number(req.params.id_duenio);

  const { error } = await supabase
    .from("duenios")
    .delete()
    .eq("id_duenio", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Duenio eliminado correctamente" });
});

// ============================
// CRUD OBJETOS PERDIDOS
// ============================

app.post("/api/objetos", async (req, res) => {
  const { nombre_object, caracteristicas, id_duenio } = req.body;

  const { data, error } = await supabase
    .from("objetos_perdidos")
    .insert([{ nombre_object, caracteristicas, id_duenio }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/objetos", async (req, res) => {
  const { data, error } = await supabase
    .from("objetos_perdidos")
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/objetos/:id", async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from("objetos_perdidos")
    .select("*, duenios(*)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error: "Objeto no encontrado" });
  res.json(data);
});

app.put("/api/objetos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre_object, caracteristicas, id_duenio } = req.body;

  const { data, error } = await supabase
    .from("objetos_perdidos")
    .update({ nombre_object, caracteristicas, id_duenio })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/api/objetos/:id", async (req, res) => {
  const id = Number(req.params.id);

  const { error } = await supabase
    .from("objetos_perdidos")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Objeto eliminado correctamente" });
});

// Objetos por dueño
app.get("/api/duenios/:id_duenio/objetos", async (req, res) => {
  const id = Number(req.params.id_duenio);

  const { data, error } = await supabase
    .from("objetos_perdidos")
    .select("*")
    .eq("id_duenio", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ============================
// START SERVER
// ============================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

