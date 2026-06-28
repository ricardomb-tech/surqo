"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface Props {
  department: string
  municipality: string
  onDepartmentChange: (value: string) => void
  onMunicipalityChange: (value: string) => void
  required?: boolean
}

interface Department { id: number; name: string }
interface Municipality { id: number; name: string }

export default function ColombiaLocationSelector({
  department, municipality, onDepartmentChange, onMunicipalityChange, required,
}: Props) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingMuns, setLoadingMuns] = useState(false)
  const [deptId, setDeptId] = useState<number | null>(null)

  useEffect(() => {
    fetch("https://api-colombia.com/api/v1/Department")
      .then((r) => r.json())
      .then((data: Department[]) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
        setDepartments(sorted)
        // Pre-select if department name already set
        if (department) {
          const found = sorted.find((d) => d.name.toLowerCase() === department.toLowerCase())
          if (found) setDeptId(found.id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  }, [])

  useEffect(() => {
    if (!deptId) { setMunicipalities([]); return }
    setLoadingMuns(true)
    fetch(`https://api-colombia.com/api/v1/Department/${deptId}/cities`)
      .then((r) => r.json())
      .then((data: Municipality[]) => {
        setMunicipalities([...data].sort((a, b) => a.name.localeCompare(b.name)))
      })
      .catch(() => setMunicipalities([]))
      .finally(() => setLoadingMuns(false))
  }, [deptId])

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value)
    const found = departments.find((d) => d.id === id)
    if (found) {
      setDeptId(id)
      onDepartmentChange(found.name)
      onMunicipalityChange("") // reset municipality when dept changes
    }
  }

  const handleMunChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMunicipalityChange(e.target.value)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
          Departamento {required && "*"}
        </label>
        {loadingDepts ? (
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
          </div>
        ) : (
          <select
            value={deptId ?? ""}
            onChange={handleDeptChange}
            required={required}
            className="w-full"
          >
            <option value="">Seleccionar…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
          Municipio
        </label>
        {loadingMuns ? (
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando…
          </div>
        ) : (
          <select
            value={municipality}
            onChange={handleMunChange}
            disabled={municipalities.length === 0}
            className="w-full disabled:opacity-50"
          >
            <option value="">
              {municipalities.length === 0 ? "Selecciona un departamento primero" : "Seleccionar…"}
            </option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
