import 'dotenv/config'
import express, { Request, Response } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prisma from './db.js'
import { googleDirectionsPolyline, googleTransitRoute, mockMapShape, mockRoute } from './maps.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '../public')
const PORT = Number(process.env.PORT) || 3000
const FARE_BRL = Number(process.env.BUS_FARE_BRL) || 5.0
const API_KEY = process.env.GOOGLE_MAPS_API_KEY

const app = express()

app.use(express.json())
app.use(express.static(PUBLIC_DIR))

function formatAddress(r: { street: string; number: number; neighborhood: string; city: string }) {
  return `${r.street}, ${r.number} — ${r.neighborhood}, ${r.city}`
}

app.get('/api/employees', async (_req: Request, res: Response) => {
  const rows = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: formatAddress(r),
      lat: r.lat,
      lng: r.lng,
    })),
  )
})

app.get('/api/works', async (_req: Request, res: Response) => {
  const rows = await prisma.work.findMany({ orderBy: { name: 'asc' } })
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      address: formatAddress(r),
      lat: r.lat,
      lng: r.lng,
    })),
  )
})

app.get('/api/route', async (req: Request, res: Response) => {
  const from = String(req.query.from || '')
  const to = String(req.query.to || '')
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query params required' })
  }
  const [emp, work] = await Promise.all([
    prisma.employee.findUnique({ where: { id: from } }),
    prisma.work.findUnique({ where: { id: to } }),
  ])
  if (!emp || !work) return res.status(404).json({ error: 'employee or work not found' })
  if (emp.lat == null || emp.lng == null || work.lat == null || work.lng == null) {
    return res.status(422).json({ error: 'missing coordinates for employee or work' })
  }

  try {
    const [route, mapShape] = await Promise.all([
      API_KEY
        ? googleTransitRoute(emp, work, API_KEY, FARE_BRL)
        : Promise.resolve(mockRoute(emp, work, FARE_BRL)),
      API_KEY
        ? googleDirectionsPolyline(emp, work, API_KEY).catch((err) => {
            console.error('directions error:', err instanceof Error ? err.message : err)
            return mockMapShape(emp, work)
          })
        : Promise.resolve(mockMapShape(emp, work)),
    ])
    res.json({ ...route, map: mapShape })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('route error:', msg)
    res.status(502).json({ error: msg, fallback: mockRoute(emp, work, FARE_BRL) })
  }
})

app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ mapsJsKey: process.env.GOOGLE_MAPS_JS_API_KEY || '' })
})

app.listen(PORT, () => {
  console.log(`server listening on :${PORT} (fare R$${FARE_BRL}, key=${API_KEY ? 'set' : 'mock'})`)
})
