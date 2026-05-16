// src/pages/ProfileSetupPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { validateRequired } from '../utils/validation'
import FileUpload from '../components/FileUpload'
import MultiSelect from '../components/MultiSelect'
import TrainerProfilePreview from '../components/TrainerProfilePreview'

const SPECIALTIES = ['Strength', 'HIIT', 'Yoga', 'Pilates', 'Rehabilitation', 'Sports Performance', 'Weight Loss', 'Nutrition']
const LOCATIONS = ['Central', 'CBD', 'Orchard', 'East', 'West', 'North', 'Northeast', 'Buona Vista', 'Novena', 'Online']

const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', padding: '40px 16px',
  display: 'flex', justifyContent: 'center',
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
  borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 520,
  height: 'fit-content',
}

const LABEL_STYLE = { display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, marginBottom: 6 }
const INPUT_STYLE = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
const BTN_PRIMARY = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }
const BTN_GHOST = { background: 'transparent', color: 'rgba(238,242,238,0.6)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '12px 24px', fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)' }
const ERR_STYLE = { color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }

const STEP_TITLES = ['Identity', 'Professional', 'Commercial', 'Certifications', 'Compliance']

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  // Step 1 (B) — Identity
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')

  // Step 2 (C) — Professional
  const [specialties, setSpecialties] = useState([])
  const [yearsExp, setYearsExp] = useState('')

  // Step 3 (D) — Commercial
  const [hourlyRate, setHourlyRate] = useState('')
  const [locations, setLocations] = useState([])
  const [bio, setBio] = useState('')

  // Step 4 (E) — Certifications: each entry is { name: string, file: File|null }
  const [certEntries, setCertEntries] = useState([{ name: '', file: null }])

  // Step 5 (F) — Compliance
  const [govIdFiles, setGovIdFiles] = useState([])
  const [cprFiles, setCprFiles] = useState([])
  const [insuranceFiles, setInsuranceFiles] = useState([])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Generate/revoke object URL for photo preview
  useEffect(() => {
    if (photoFiles[0]) {
      const url = URL.createObjectURL(photoFiles[0])
      setPhotoPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPhotoPreviewUrl('')
  }, [photoFiles])

  // Preview card data (Phase 1 fields only)
  const previewProfile = { name: fullName, photoUrl: photoPreviewUrl, specialties, yearsExp, hourlyRate, locations, bio }

  // All Phase 1 required fields filled → special CTA on Step 3
  const phase1Complete = !!(
    fullName.trim() && photoFiles.length > 0 &&
    specialties.length > 0 && yearsExp &&
    hourlyRate && locations.length > 0 && bio.trim()
  )

  function validateStep1() {
    const errs = {}
    const nameErr = validateRequired(fullName, 'Full name')
    const phoneErr = validateRequired(phone, 'Phone number')
    if (nameErr) errs.fullName = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (photoFiles.length === 0) errs.photo = 'Profile photo is required.'
    return errs
  }

  function validateStep2() {
    const errs = {}
    if (specialties.length === 0) errs.specialties = 'Select at least one specialty.'
    const expErr = validateRequired(yearsExp, 'Years of experience')
    if (expErr) errs.yearsExp = expErr
    return errs
  }

  function validateStep3() {
    const errs = {}
    const rateErr = validateRequired(hourlyRate, 'Hourly rate')
    if (rateErr) errs.hourlyRate = rateErr
    else if (isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid rate in SGD.'
    if (locations.length === 0) errs.locations = 'Select at least one location.'
    const bioErr = validateRequired(bio, 'Bio')
    if (bioErr) errs.bio = bioErr
    return errs
  }

  function validateStep4() {
    const errs = {}
    const hasValidEntry = certEntries.some(e => e.name.trim() && e.file)
    if (!hasValidEntry) errs.certEntries = 'Add at least one certification with a name and document.'
    return errs
  }

  function validateStep5() {
    const errs = {}
    if (govIdFiles.length === 0) errs.govId = 'Government ID is required.'
    if (cprFiles.length === 0) errs.cpr = 'CPR/First Aid certificate is required.'
    return errs
  }

  function handleNext() {
    let errs = {}
    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()
    if (step === 3) errs = validateStep3()
    if (step === 4) errs = validateStep4()
    setErrors(errs)
    if (Object.keys(errs).length === 0) { setStep(s => s + 1); setErrors({}) }
  }

  async function uploadFiles(bucket, userId, type, files) {
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleSubmit() {
    if (submitting) return
    const errs = validateStep5()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setServerError('')

    try {
      const userId = session.user.id

      const [profilePhotoUrl] = await uploadFiles('profile-photos', userId, 'photo', photoFiles)

      const certFiles = certEntries.map(e => e.file).filter(Boolean)
      const certNames = certEntries.map(e => e.name.trim()).filter(Boolean)
      const certUrls = await uploadFiles('documents', userId, 'certifications', certFiles)

      const govIdUrls = await uploadFiles('documents', userId, 'government_id', govIdFiles)
      const cprUrls = await uploadFiles('documents', userId, 'cpr_cert', cprFiles)
      const insuranceUrls = insuranceFiles.length > 0
        ? await uploadFiles('documents', userId, 'insurance', insuranceFiles)
        : []

      const documents = {
        certifications: certUrls,
        government_id: govIdUrls,
        cpr_cert: cprUrls,
        insurance: insuranceUrls,
      }

      const { error } = await supabase.rpc('submit_trainer_profile', {
        p_full_name:         fullName.trim(),
        p_phone:             phone.trim(),
        p_email:             session.user.email,
        p_profile_photo_url: profilePhotoUrl,
        p_bio:               bio.trim(),
        p_certifications:    certNames,
        p_specialties:       specialties,
        p_years_experience:  parseInt(yearsExp, 10),
        p_hourly_rate:       Number(hourlyRate),
        p_session_types:     ['In-person', 'Virtual'],
        p_locations_served:  locations,
        p_documents:         documents,
      })

      if (error) throw new Error(error.message)

      // Fire submission notification — non-blocking
      supabase.functions.invoke('notify-trainer', {
        body: {
          trainerName:  fullName.trim(),
          trainerEmail: session.user.email,
          status:       'submitted',
        },
      }).catch(() => {})

      navigate('/trainer/application-status')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function addCertEntry() {
    setCertEntries(prev => [...prev, { name: '', file: null }])
  }

  function updateCertEntry(index, field, value) {
    setCertEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function removeCertEntry(index) {
    setCertEntries(prev => prev.filter((_, i) => i !== index))
  }

  const isPhase1 = step <= 3
  const stepPct = (step / 5) * 100
  const showPreview = isPhase1 && (!isMobile || fullName.trim())

  const ctaLabel = step === 3 && phase1Complete
    ? 'This is how clients will see you — ready to get verified?'
    : 'Continue'
  const ctaStyle = step === 3 && phase1Complete
    ? { ...BTN_PRIMARY, boxShadow: '0 0 16px rgba(74,222,128,0.3)' }
    : BTN_PRIMARY

  return (
    <div style={PAGE_STYLE}>
      <div style={{
        display: 'flex',
        gap: 40,
        width: '100%',
        maxWidth: isPhase1 ? 960 : 520,
        alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Form card */}
        <div style={CARD_STYLE}>
          {/* Progress indicator */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
              Step {step} of 5 — {STEP_TITLES[step - 1]}
            </p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${stepPct}%`, background: '#4ade80', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Step 1 (B) — Identity */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Tell us about yourself</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Full name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} style={INPUT_STYLE} placeholder="Jordan Lee" />
                {errors.fullName && <p style={ERR_STYLE}>{errors.fullName}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Phone number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} placeholder="+65 9xxx xxxx" />
                {errors.phone && <p style={ERR_STYLE}>{errors.phone}</p>}
              </div>
              <FileUpload label="Profile photo" files={photoFiles} onChange={setPhotoFiles} maxFiles={1} required />
              {errors.photo && <p style={ERR_STYLE}>{errors.photo}</p>}
            </>
          )}

          {/* Step 2 (C) — Professional */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your expertise</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Specialties</label>
                <MultiSelect options={SPECIALTIES} selected={specialties} onChange={setSpecialties} />
                {errors.specialties && <p style={ERR_STYLE}>{errors.specialties}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Years of experience</label>
                <input type="number" min="0" max="50" value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} placeholder="0" />
                {errors.yearsExp && <p style={ERR_STYLE}>{errors.yearsExp}</p>}
              </div>
            </>
          )}

          {/* Step 3 (D) — Commercial */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your offering</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Hourly rate (SGD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 16 }}>$</span>
                  <input type="number" min="1" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} placeholder="80" />
                </div>
                {errors.hourlyRate && <p style={ERR_STYLE}>{errors.hourlyRate}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Locations served</label>
                <MultiSelect options={LOCATIONS} selected={locations} onChange={setLocations} />
                {errors.locations && <p style={ERR_STYLE}>{errors.locations}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>
                  Bio{' '}
                  <span style={{ color: 'rgba(238,242,238,0.35)', fontWeight: 400 }}>({bio.length}/300)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 300))}
                  rows={4}
                  placeholder="Tell potential clients about your training style, background, and what makes you unique…"
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
                />
                {errors.bio && <p style={ERR_STYLE}>{errors.bio}</p>}
              </div>
            </>
          )}

          {/* Step 4 (E) — Certifications */}
          {step === 4 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Your certifications</h2>
              <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Add each certification with its name and supporting document.
              </p>
              {certEntries.map((entry, i) => (
                <div key={i} style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ ...LABEL_STYLE, margin: 0 }}>Certification {i + 1}</label>
                    {certEntries.length > 1 && (
                      <button type="button" onClick={() => removeCertEntry(i)} style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.35)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    value={entry.name}
                    onChange={e => updateCertEntry(i, 'name', e.target.value)}
                    placeholder="e.g. NASM-CPT, ACE, ACSM"
                    style={{ ...INPUT_STYLE, marginBottom: 10 }}
                  />
                  <FileUpload
                    label="Document (PDF or image)"
                    files={entry.file ? [entry.file] : []}
                    onChange={files => updateCertEntry(i, 'file', files[0] || null)}
                    maxFiles={1}
                  />
                </div>
              ))}
              {errors.certEntries && <p style={ERR_STYLE}>{errors.certEntries}</p>}
              <button type="button" onClick={addCertEntry} style={{ ...BTN_GHOST, fontSize: 13, padding: '8px 16px', marginTop: 4 }}>
                + Add another certification
              </button>
            </>
          )}

          {/* Step 5 (F) — Compliance */}
          {step === 5 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Verification documents</h2>
              <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                These are reviewed by our team and never shared publicly.
              </p>
              <FileUpload label="Government-issued ID (NRIC / Passport)" files={govIdFiles} onChange={setGovIdFiles} maxFiles={2} required />
              {errors.govId && <p style={ERR_STYLE}>{errors.govId}</p>}
              <FileUpload label="CPR / First Aid certificate" files={cprFiles} onChange={setCprFiles} maxFiles={2} required />
              {errors.cpr && <p style={ERR_STYLE}>{errors.cpr}</p>}
              <FileUpload label="Professional liability insurance (optional but recommended)" files={insuranceFiles} onChange={setInsuranceFiles} maxFiles={2} />
              {serverError && (
                <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 12, marginBottom: 0, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                  {serverError}
                </p>
              )}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            {step > 1 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setErrors({}) }} style={BTN_GHOST}>Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 5
              ? <button type="button" onClick={handleNext} style={ctaStyle}>{ctaLabel}</button>
              : <button type="button" onClick={handleSubmit} disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
            }
          </div>
        </div>

        {/* Live preview panel — Phase 1 only, after name entered on mobile */}
        {showPreview && (
          <div style={{ flex: 1, maxWidth: 380, position: isMobile ? 'static' : 'sticky', top: 40 }}>
            <TrainerProfilePreview profile={previewProfile} />
          </div>
        )}
      </div>
    </div>
  )
}
