// API client — fetches employees, works, and route from the backend.

async function fetchEmployees() {
  const res = await fetch('/api/employees')
  if (!res.ok) throw new Error(`employees ${res.status}`)
  return res.json()
}

async function fetchWorks() {
  const res = await fetch('/api/works')
  if (!res.ok) throw new Error(`works ${res.status}`)
  return res.json()
}

async function fetchRoute(empId, workId) {
  const url = `/api/route?from=${encodeURIComponent(empId)}&to=${encodeURIComponent(workId)}`
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok && !body.fallback) throw new Error(body.error || `route ${res.status}`)
  return body.fallback || body
}

async function fetchConfig() {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error(`config ${res.status}`)
  return res.json()
}

window.api = { fetchEmployees, fetchWorks, fetchRoute, fetchConfig }
