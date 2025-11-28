import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "./db.js";

const app = express();
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check - devuelve 200 para comprobar que el backend está activo
app.get("/", (req, res) => {
  res.json({ message: "Backend running" });
});

// Controlador para favicon (evita 404 en algunas apps)
app.get("/favicon.ico", (req, res) => res.status(204).end());

// ============================
// UTIL - Async error wrapper
// ============================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================
// JWT CONFIG
// ============================
const SECRET_KEY = process.env.SECRET_KEY ?? "MI_SECRETO_SUPER_SEGURO";

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
app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ email, password: hashed, nombre }])
      .select()
      .single();

    if (error) {
      console.error("Error creando usuario:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Usuario registrado", user: data });
  })
);

// Login
app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(400).json({ error: "Usuario no encontrado" });

    const coincide = await bcrypt.compare(password, user.password);

    if (!coincide) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "2h",
    });

    res.json({ message: "Login exitoso", token });
  })
);

// Ruta protegida de prueba
app.get("/api/auth/profile", verificarToken, (req, res) => {
  res.json({ message: "Acceso permitido", usuario: req.usuario });
});

// ============================
// CRUD - DUENIOS
// ============================

app.post(
  "/api/duenios",
  asyncHandler(async (req, res) => {
    const { duenio, telefono, mail, direccion } = req.body;
    if (!duenio) {
      return res.status(400).json({ error: "El nombre del dueño es obligatorio" });
    }

    const { data, error } = await supabase
      .from("duenios")
      .insert([{ duenio, telefono, mail, direccion }])
      .select()
      .single();

    if (error) {
      console.error("Error creando duenio:", error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  })
);

app.get(
  "/api/duenios",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase.from("duenios").select("id_duenio, duenio");

    if (error) {
      console.error("Error obteniendo duenios:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  })
);

app.get(
  "/api/duenios/:id_duenio",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id_duenio);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id_duenio inválido" });

    const { data, error } = await supabase
      .from("duenios")
      .select("*")
      .eq("id_duenio", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Dueño no encontrado" });

    res.json(data);
  })
);

app.put(
  "/api/duenios/:id_duenio",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id_duenio);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id_duenio inválido" });

    const { duenio, telefono, mail, direccion } = req.body;
    const updateData = {};
    if (duenio !== undefined) updateData.duenio = duenio;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (mail !== undefined) updateData.mail = mail;
    if (direccion !== undefined) updateData.direccion = direccion;

    const { data, error } = await supabase
      .from("duenios")
      .update(updateData)
      .eq("id_duenio", id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando duenio:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  })
);

app.delete(
  "/api/duenios/:id_duenio",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id_duenio);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id_duenio inválido" });

    const { error } = await supabase.from("duenios").delete().eq("id_duenio", id);

    if (error) {
      console.error("Error eliminando duenio:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: "Duenio eliminado correctamente" });
  })
);

// ============================
// CRUD OBJETOS PERDIDOS
// ============================

app.post(
  "/api/objetos",
  asyncHandler(async (req, res) => {
    const { nombre, caracteristicas, id_duenio, estado } = req.body;

    if (!nombre || !caracteristicas || id_duenio === undefined || estado === undefined) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Validamos que el dueño exista
    const { data: duenioExiste, error: duenioError } = await supabase
      .from("duenios")
      .select("id_duenio")
      .eq("id_duenio", Number(id_duenio))
      .single();

    if (duenioError || !duenioExiste) {
      return res.status(400).json({ error: "El dueño no existe" });
    }

    // Insertamos
    const { data, error } = await supabase
      .from("objetos_perdidos")
      .insert([
        {
          nombre,
          caracteristicas,
          id_duenio: Number(id_duenio),
          estado: Boolean(estado),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error insertando objeto:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data);
  })
);

app.get(
  "/api/objetos",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("objetos_perdidos")
      .select(`
        id,
        nombre,
        caracteristicas,
        estado,
        id_duenio,
        created_at,
        duenios:duenios (
          id_duenio,
          duenio,
          telefono,
          mail,
          direccion
        )
      `)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error obteniendo objetos:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  })
);

app.get(
  "/api/objetos/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const { data, error } = await supabase
      .from("objetos_perdidos")
      .select("*, duenios(*)")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Objeto no encontrado" });
    res.json(data);
  })
);

app.put(
  "/api/objetos/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id inválido" });

    const { nombre, caracteristicas, id_duenio, estado } = req.body;
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (caracteristicas !== undefined) updateData.caracteristicas = caracteristicas;
    if (id_duenio !== undefined) updateData.id_duenio = Number(id_duenio);
    if (estado !== undefined) updateData.estado = Boolean(estado);

    // Optional: check id_duenio exists if provided
    if (updateData.id_duenio) {
      const { data: duenioCheck, error: duenioErr } = await supabase
        .from("duenios")
        .select("id_duenio")
        .eq("id_duenio", updateData.id_duenio)
        .single();
      if (duenioErr || !duenioCheck) {
        return res.status(400).json({ error: "El dueño especificado no existe" });
      }
    }

    const { data, error } = await supabase
      .from("objetos_perdidos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando objeto:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  })
);

app.delete(
  "/api/objetos/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase.from("objetos_perdidos").delete().eq("id", id);

    if (error) {
      console.error("Error eliminando objeto:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Objeto eliminado" });
  })
);

// Objetos por dueño
app.get(
  "/api/duenios/:id_duenio/objetos",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id_duenio);
    if (Number.isNaN(id)) return res.status(400).json({ error: "id_duenio inválido" });

    const { data, error } = await supabase
      .from("objetos_perdidos")
      .select("*")
      .eq("id_duenio", id);

    if (error) {
      console.error("Error obteniendo objetos por dueño:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  })
);

// 404 para rutas no encontradas (API)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Ruta API no encontrada", path: req.path });
  }
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Ocurrió un error interno" });
});

// add handlers to catch unhandled errors and rejections
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
  // opcional: process.exit(1); // si deseas que el proceso se reinicie
});

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});