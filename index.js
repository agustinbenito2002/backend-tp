import express from 'express'
import cors from 'cors'
import { supabase } from './db.js'

const app = express()

app.use(cors()) // Habilitar CORS para todas las rutas

app.use(cors({
  origin: 'http://localhost:5173',      // tu frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json())

// =============================
// CRUD - DUENIOS
// =============================

// Crear dueño
app.post('/api/duenios', async (req, res) => {
  const { duenio, telefono, mail, direccion } = req.body

  const { data, error } = await supabase
    .from('duenios')
    .insert([{ duenio, telefono, mail, direccion }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Obtener todos los dueños
app.get('/api/duenios', async (req, res) => {
  const { data, error } = await supabase
    .from('duenios')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Obtener dueño por id
app.get('/api/duenios/:id_duenio', async (req, res) => {
  const id = Number(req.params.id_duenio)

  const { data, error } = await supabase
    .from('duenios')
    .select('*')
    .eq('id_duenio', id)
    .single()

  if (error) return res.status(404).json({ error: 'Duenio no encontrado' })
  res.json(data)
})

// Actualizar dueño
app.put('/api/duenios/:id_duenio', async (req, res) => {
  const id = Number(req.params.id_duenio)
  const { duenio, telefono, mail, direccion } = req.body

  const { data, error } = await supabase
    .from('duenios')
    .update({ duenio, telefono, mail, direccion })
    .eq('id_duenio', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Eliminar dueño
app.delete('/api/duenios/:id_duenio', async (req, res) => {
  const id = Number(req.params.id_duenio)

  const { error } = await supabase
    .from('duenios')
    .delete()
    .eq('id_duenio', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Duenio eliminado correctamente' })
})


// =============================
// CRUD - OBJETOS PERDIDOS
// =============================

// Crear objeto
app.post('/api/objetos', async (req, res) => {
  const { nombre_object, caracteristicas, id_duenio } = req.body

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .insert([{ 
      nombre_object,
      caracteristicas,
      id_duenio 
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Obtener todos los objetos
app.get('/api/objetos', async (req, res) => {
  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Obtener un objeto con info del dueño
app.get('/api/objetos/:id', async (req, res) => {
  const id = Number(req.params.id)

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*, duenios(*)')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Objeto no encontrado' })
  res.json(data)
})

// Actualizar objeto
app.put('/api/objetos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre_object, caracteristicas, id_duenio } = req.body

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .update({
      nombre_object,
      caracteristicas,
      id_duenio
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Eliminar objeto
app.delete('/api/objetos/:id', async (req, res) => {
  const id = Number(req.params.id)

  const { error } = await supabase
    .from('objetos_perdidos')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Objeto eliminado correctamente' })
})


// =============================
// OBJETOS POR DUEÑO
// =============================
app.get('/api/duenios/:id_duenio/objetos', async (req, res) => {
  const id = Number(req.params.id_duenio)

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*')
    .eq('id_duenio', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})


// =============================
// INICIAR SERVIDOR
// =============================
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
