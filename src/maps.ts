import type { employee, work } from '@prisma/client'

export type Coord = { lat: number; lng: number }

export type MapShape = {
  polyline: string
  bounds: { ne: Coord; sw: Coord }
  source: 'google' | 'mock'
}

export type RouteResponse = {
  straightKm: number
  transit: {
    km: number
    min: number
    busTickets: number
    fareEstimateBRL: number
    transfers: number
    source: 'google' | 'mock'
  }
  drive: { km: number; min: number; tolls: number; fuelL: number; fuelCost: number }
  walk: { km: number; min: number }
  bike: { km: number; min: number }
  steps: Array<{ icon: string; text: string; dist: string; time: string }>
  map: MapShape | null
}

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json'

const FIELD_MASK = [
  'routes.duration',
  'routes.distanceMeters',
  'routes.legs.steps.transitDetails',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.distanceMeters',
  'routes.legs.steps.navigationInstruction',
  'routes.legs.steps.travelMode',
].join(',')

export function haversineKm(a: Coord, b: Coord): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

function parseDurationSeconds(d: string | undefined): number {
  if (!d) return 0
  const m = /^(\d+(?:\.\d+)?)s$/.exec(d)
  return m ? Math.round(parseFloat(m[1])) : 0
}

function buildOtherModes(straightKm: number) {
  const driveKm = +(straightKm * 1.42).toFixed(1)
  const walkKm = +(straightKm * 1.18).toFixed(1)
  const bikeKm = +(straightKm * 1.25).toFixed(1)
  const driveMin = Math.round((driveKm / 28) * 60)
  const walkMin = Math.round((walkKm / 4.5) * 60)
  const bikeMin = Math.round((bikeKm / 14) * 60)
  const tolls = driveKm > 18 ? Math.min(2, Math.floor(driveKm / 22)) : 0
  const fuelL = +(driveKm / 11).toFixed(2)
  const fuelCost = +(fuelL * 6.19).toFixed(2)
  return {
    drive: { km: driveKm, min: driveMin, tolls, fuelL, fuelCost },
    walk: { km: walkKm, min: walkMin },
    bike: { km: bikeKm, min: bikeMin },
  }
}

function mockSteps(origin: string, destinationName: string, totalKm: number, totalMin: number) {
  return [
    { icon: 'start', text: `Saída de ${origin}`, dist: '—', time: '0 min' },
    { icon: 'straight', text: `Caminhe até a parada mais próxima`, dist: `${(totalKm * 0.05).toFixed(1)} km`, time: `${Math.round(totalMin * 0.1)} min` },
    { icon: 'right', text: `Embarque no ônibus em direção ao centro`, dist: `${(totalKm * 0.45).toFixed(1)} km`, time: `${Math.round(totalMin * 0.5)} min` },
    { icon: 'merge', text: `Transferência em terminal`, dist: `${(totalKm * 0.10).toFixed(1)} km`, time: `${Math.round(totalMin * 0.15)} min` },
    { icon: 'left', text: `Embarque no segundo ônibus`, dist: `${(totalKm * 0.30).toFixed(1)} km`, time: `${Math.round(totalMin * 0.20)} min` },
    { icon: 'flag', text: `Chegada em ${destinationName}`, dist: `${(totalKm * 0.10).toFixed(1)} km`, time: `${Math.round(totalMin * 0.05)} min` },
  ]
}

export function mockRoute(from: employee, to: work, fareBRL: number): RouteResponse {
  const straight = haversineKm({ lat: from.lat!, lng: from.lng! }, { lat: to.lat!, lng: to.lng! })
  const transitKm = +(straight * 1.55).toFixed(1)
  const transitMin = Math.round((transitKm / 18) * 60)
  const busTickets = Math.max(1, Math.round(transitKm / 12))
  const other = buildOtherModes(straight)
  return {
    straightKm: +straight.toFixed(2),
    transit: {
      km: transitKm,
      min: transitMin,
      busTickets,
      fareEstimateBRL: +(busTickets * fareBRL).toFixed(2),
      transfers: Math.max(0, busTickets - 1),
      source: 'mock',
    },
    ...other,
    steps: mockSteps(from.street, to.name, transitKm, transitMin),
    map: mockMapShape(from, to),
  }
}

export function mockMapShape(from: employee, to: work): MapShape {
  const a: Coord = { lat: from.lat!, lng: from.lng! }
  const b: Coord = { lat: to.lat!, lng: to.lng! }
  return {
    polyline: encodePolyline([a, b]),
    bounds: {
      ne: { lat: Math.max(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
      sw: { lat: Math.min(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
    },
    source: 'mock',
  }
}

function encodePolyline(points: Coord[]): string {
  let result = ''
  let prevLat = 0
  let prevLng = 0
  for (const p of points) {
    const eLat = Math.round(p.lat * 1e5)
    const eLng = Math.round(p.lng * 1e5)
    result += encodeSignedValue(eLat - prevLat) + encodeSignedValue(eLng - prevLng)
    prevLat = eLat
    prevLng = eLng
  }
  return result
}

function encodeSignedValue(v: number): string {
  let value = v < 0 ? ~(v << 1) : v << 1
  let out = ''
  while (value >= 0x20) {
    out += String.fromCharCode((0x20 | (value & 0x1f)) + 63)
    value >>>= 5
  }
  out += String.fromCharCode(value + 63)
  return out
}

type RoutesApiStep = {
  travelMode?: string
  distanceMeters?: number
  staticDuration?: string
  navigationInstruction?: { instructions?: string; maneuver?: string }
  transitDetails?: {
    transitLine?: {
      name?: string
      nameShort?: string
      vehicle?: { type?: string; name?: { text?: string } }
    }
    stopDetails?: {
      arrivalStop?: { name?: string }
      departureStop?: { name?: string }
    }
    stopCount?: number
  }
}

function mapStepIcon(maneuver: string | undefined, travelMode: string | undefined, isFirst: boolean, isLast: boolean) {
  if (isFirst) return 'start'
  if (isLast) return 'flag'
  if (travelMode === 'TRANSIT') return 'merge'
  if (maneuver?.includes('RIGHT')) return 'right'
  if (maneuver?.includes('LEFT')) return 'left'
  return 'straight'
}

export async function googleTransitRoute(
  from: employee,
  to: work,
  apiKey: string,
  fareBRL: number,
): Promise<RouteResponse> {
  const body = {
    origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
    destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
    travelMode: 'TRANSIT',
    transitPreferences: { allowedTravelModes: ['BUS', 'RAIL'] },
    languageCode: 'pt-BR',
    units: 'METRIC',
  }
  const res = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Routes API ${res.status}: ${text}`)
  }
  const data: any = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('Routes API returned no routes')

  const transitKm = +(route.distanceMeters / 1000).toFixed(1)
  const transitMin = Math.round(parseDurationSeconds(route.duration) / 60)

  const allSteps: RoutesApiStep[] = (route.legs || []).flatMap((l: any) => l.steps || [])
  const busSteps = allSteps.filter(
    (s) => s.transitDetails?.transitLine?.vehicle?.type === 'BUS',
  )
  const busTickets = busSteps.length || 0
  const transfers = Math.max(0, busTickets - 1)

  const steps = allSteps.map((s, i) => {
    const isFirst = i === 0
    const isLast = i === allSteps.length - 1
    const distKm = (s.distanceMeters || 0) / 1000
    const min = Math.round(parseDurationSeconds(s.staticDuration) / 60)
    let text = s.navigationInstruction?.instructions || ''
    if (s.transitDetails) {
      const line = s.transitDetails.transitLine?.nameShort || s.transitDetails.transitLine?.name || 'Ônibus'
      const dep = s.transitDetails.stopDetails?.departureStop?.name || ''
      const arr = s.transitDetails.stopDetails?.arrivalStop?.name || ''
      text = `Embarque na linha ${line}${dep ? ` em ${dep}` : ''}${arr ? ` até ${arr}` : ''}`
    }
    return {
      icon: mapStepIcon(s.navigationInstruction?.maneuver, s.travelMode, isFirst, isLast),
      text: text || 'Continue',
      dist: distKm >= 0.1 ? `${distKm.toFixed(1)} km` : `${Math.round((s.distanceMeters || 0))} m`,
      time: `${min} min`,
    }
  })

  const straight = haversineKm({ lat: from.lat!, lng: from.lng! }, { lat: to.lat!, lng: to.lng! })
  const other = buildOtherModes(straight)

  return {
    straightKm: +straight.toFixed(2),
    transit: {
      km: transitKm,
      min: transitMin,
      busTickets,
      fareEstimateBRL: +(busTickets * fareBRL).toFixed(2),
      transfers,
      source: 'google',
    },
    ...other,
    steps,
    map: null,
  }
}

export async function googleDirectionsPolyline(
  from: employee,
  to: work,
  apiKey: string,
): Promise<MapShape> {
  const params = new URLSearchParams({
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    mode: 'transit',
    transit_mode: 'bus',
    departure_time: 'now',
    language: 'pt-BR',
    region: 'br',
    units: 'metric',
    key: apiKey,
  })
  const res = await fetch(`${DIRECTIONS_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`Directions HTTP ${res.status}`)
  const data: any = await res.json()
  if (data.status !== 'OK') {
    throw new Error(`Directions ${data.status}: ${data.error_message ?? ''}`)
  }
  const r = data.routes?.[0]
  if (!r) throw new Error('Directions returned no routes')
  return {
    polyline: r.overview_polyline.points,
    bounds: {
      ne: { lat: r.bounds.northeast.lat, lng: r.bounds.northeast.lng },
      sw: { lat: r.bounds.southwest.lat, lng: r.bounds.southwest.lng },
    },
    source: 'google',
  }
}
