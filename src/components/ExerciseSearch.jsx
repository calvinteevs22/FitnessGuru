// src/components/ExerciseSearch.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const MUSCLE_GROUPS = ['Chest','Back','Shoulders','Biceps','Triceps','Forearms','Quads','Hamstrings','Glutes','Calves','Core','Full Body','Cardio']
const EQUIPMENT_TYPES = ['Barbell','Dumbbell','Cable','Machine','Bodyweight','Kettlebell','Resistance Band','Smith Machine','TRX','Cardio Machine']

const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const SELECT = { ...INPUT, width: 'auto', cursor: 'pointer' }

export default function ExerciseSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const hasFilter = muscle || equipment
    if (query.length < 2 && !hasFilter) { setResults([]); setOpen(false); return }

    let q = supabase.from('exercises').select('id,name,muscle_group,equipment')
    if (query.length >= 2) q = q.ilike('name', `%${query}%`)
    if (muscle) q = q.eq('muscle_group', muscle)
    if (equipment) q = q.eq('equipment', equipment)
    q.order('name').limit(20).then(({ data }) => {
      setResults(data ?? [])
      setOpen((data ?? []).length > 0)
    })
  }, [query, muscle, equipment])

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(ex) {
    onSelect(ex)
    setQuery('')
    setMuscle('')
    setEquipment('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          style={{ ...INPUT, flex: 1, minWidth: 160 }}
          placeholder="Search exercises..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <select style={SELECT} value={muscle} onChange={e => setMuscle(e.target.value)}>
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={SELECT} value={equipment} onChange={e => setEquipment(e.target.value)}>
          <option value="">All equipment</option>
          {EQUIPMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1a2e1a', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 6, zIndex: 20, maxHeight: 260, overflowY: 'auto' }}>
          {results.map(ex => (
            <button
              key={ex.id}
              onMouseDown={() => handleSelect(ex)}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid rgba(238,242,238,0.06)', padding: '10px 14px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer' }}
            >
              <span style={{ fontWeight: 600 }}>{ex.name}</span>
              <span style={{ color: 'rgba(238,242,238,0.4)', fontSize: 12, marginLeft: 8 }}>{ex.muscle_group} · {ex.equipment}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
