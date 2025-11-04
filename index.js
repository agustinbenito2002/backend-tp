import { createClient } from '@supabase/supabase-js' 
import express from 'express'
import {supabase} from "./db.js"


const app = express()
app.use(express.json())


// Get all duenios
app.get('/api/duenios', async (request, response) => {
  const { data, error } = await supabase
    .from('duenios')
    .select()
  if (error) {
    return response.status(500).json({ error: error.message })
  }

  console.log(data);

  response.json(data)
})

// Get single duenio by id
app.get('/api/duenios/:id_duenio', async (request, response) => {
  const id = Number(request.params.id_duenio)
  const { data: duenio, error } = await supabase
    .from('duenios')
    .select('*')
    .eq('id_duenio', id)
    .single()


  if (error) {
     console.log(error);
    response.status(404).json({ error: 'Duenio not found' })
       
  } else {
    response.json(duenio)
  }
})

// Get all objetos perdidos
app.get('/api/objetos', async (request, response) => {
  const { data: objetos, error } = await supabase
    .from('objetos_perdidos')
    .select('*')

  if (error) {
    return response.status(500).json({ error: error.message })
  }
  response.json(objetos)
})

// Get single objeto perdido by id
app.get('/api/objetos/:id', async (request, response) => {
  const id = Number(request.params.id)
  const { data: objeto, error } = await supabase
    .from('objetos_perdidos')
    .select('*, duenios(duenio)')
    .eq('id', id)
    .single()

  if (error) {
    return response.status(404).json({ error: 'Objeto not found' })
  }
  response.json(objeto)
})

// Get objetos perdidos by duenio_id
app.get('/api/duenios/:id/objetos', async (request, response) => {
  const duenio_id = Number(request.params.id)
  const { data: objetos, error } = await supabase
    .from('objetos_perdidos')
    .select('*')
    .eq('duenio_id', duenio_id)

  if (error) {
    return response.status(500).json({ error: error.message })
  }
  response.json(objetos)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})