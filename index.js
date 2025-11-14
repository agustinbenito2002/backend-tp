import express from 'express'
import { supabase } from './db.js'

const app = express()
app.use(express.json())

// =============================
//      CRUD - DUENIOS
// =============================

// Create duenio
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

// Read all duenios
app.get('/api/duenios', async (req, res) => {
  const { data, error } = await supabase
    .from('duenios')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Read one duenio by id
app.get('/api/duenios/:id_duenio', async (req, res) => {
  const id = Number(req.params.id_duenio)

  const { data, error } = await supabase
    .from('duenios')
    .select('*')
    .eq('id_duenio', id)
    .single()

  if (error) return res.status(404).json({ error: 'Duenio not found' })
  res.json(data)
})

// Update duenio
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

// Delete duenio
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
//   CRUD - OBJETOS PERDIDOS
// =============================

// Create objeto perdido
app.post('/api/objetos', async (req, res) => {
  const { nombre_object, caracteristicas, id_duenio } = req.body

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .insert([{ 
      "nombre object": nombre_object, 
      caracteristicas, 
      "id duenio": id_duenio 
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Read all objetos perdidos
app.get('/api/objetos', async (req, res) => {
  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Read objeto perdido by id (with duenio info)
app.get('/api/objetos/:id', async (req, res) => {
  const id = Number(req.params.id)

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*, duenios(*)')
    .eq('id', id)
    .single()

  if (error) return res.status(404).json({ error: 'Objeto not found' })
  res.json(data)
})

// Update objeto perdido
app.put('/api/objetos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { nombre_object, caracteristicas, id_duenio } = req.body

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .update({
      "nombre object": nombre_object,
      caracteristicas,
      "id duenio": id_duenio
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// Delete objeto perdido
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
//  OBJETOS DE UN DUEÑO
// =============================
app.get('/api/duenios/:id_duenio/objetos', async (req, res) => {
  const id = Number(req.params.id_duenio)

  const { data, error } = await supabase
    .from('objetos_perdidos')
    .select('*')
    .eq('id duenio', id)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})


// =============================
//       START SERVER
// =============================
const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
