import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { validateRequired } from '../utils/validation'
import FileUpload from '../components/FileUpload'
import MultiSelect from '../components/MultiSelect'

const SPECIALTIES = ['Strength Training', 'HIIT', 'Yoga', 'Pilates', 'Bodybuilding', 'Crossfit', 'Running', 'Cycling', 'Boxing', 'Rehabilitation', 'Weight Loss', 'Nutrition']
const SESSION_TYPES = ['In-person', 'Virtual', 'Both']
const LOCATIONS = ['Central', 'CBD', 'Orchard', 'East', 'West', 'North', 'Northeast', 'Online']

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

const STEP_TITLES = ['Basic info', 'Professional', 'Documents', 'Commercial']

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { session, refreshProfile } = useAuth()
  const [step, setStep] = useState(2)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Step 2 — Basic info
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])

  // Step 3 — Professional
  const [certNames, setCertNames] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [yearsExp, setYearsExp] = useState('')
  const [certFiles, setCertFiles] = useState([])

  // Step 4 — Documents
  const [govIdFiles, setGovIdFiles] = useState([])
  const [cprFiles, setCprFiles] = useState([])
  const [insuranceFiles, setInsuranceFiles] = useState([])

  // Step 5 — Commercial
  const [hourlyRate, setHourlyRate] = useState('')
  const [sessionTypes, setSessionTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [bio, setBio] = useState('')

  function validateStep2() {
    const errs = {}
    const nameErr = validateRequired(fullName, 'Full name')
    const phoneErr = validateRequired(phone, 'Phone number')
    if (nameErr) errs.fullName = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (photoFiles.length === 0) errs.photo = 'Profile photo is required.'
    return errs
  }

  function validateStep3() {
    const errs = {}
    if (specialties.length === 0) errs.specialties = 'Select at least one specialty.'
    const expErr = validateRequired(yearsExp, 'Years of experience')
    if (expErr) errs.yearsExp = expErr
    if (certFiles.length === 0) errs.certFiles = 'Upload at least one certification document.'
    return errs
  }

  function validateStep4() {
    const errs = {}
    if (govIdFiles.length === 0) errs.govId = 'Government ID is required.'
    if (cprFiles.length === 0) errs.cpr = 'CPR/First Aid certificate is required.'
    return errs
  }

  function validateStep5() {
    const errs = {}
    const rateErr = validateRequired(hourlyRate, 'Hourly rate')
    if (rateErr) errs.hourlyRate = rateErr
    else if (isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid hourly rate in SGD.'
    if (sessionTypes.length === 0) errs.sessionTypes = 'Select at least one session type.'
    if (locations.length === 0) errs.locations = 'Select at least one location.'
    const bioErr = validateRequired(bio, 'Bio')
    if (bioErr) errs.bio = bioErr
    return errs
  }

  function handleNext() {
    let errs = {}
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
      const certUrls = await uploadFiles('documents', userId, 'certifications', certFiles)
      const govIdUrls = await uploadFiles('documents', userId, 'government_id', govIdFiles)
      const cprUrls = await uploadFiles('documents', userId, 'cpr_cert', cprFiles)
      const insuranceUrls = await uploadFiles('documents', userId, 'insurance', insuranceFiles)

      const documents = {
        certifications: certUrls,
        government_id: govIdUrls,
        cpr_cert: cprUrls,
        insurance: insuranceUrls,
      }

      const { error } = await supabase.rpc('submit_trainer_profile', {
        p_full_name: fullName.trim(),
        p_phone: phone.trim(),
        p_email: session.user.email,
        p_profile_photo_url: profilePhotoUrl,
        p_bio: bio.trim(),
        p_certifications: certNames,
        p_specialties: specialties,
        p_years_experience: parseInt(yearsExp, 10),
        p_hourly_rate: Number(hourlyRate),
        p_session_types: sessionTypes,
        p_locations_served: locations,
        p_documents: documents,
      })

      if (error) throw new Error(error.message)

      await refreshProfile()
      navigate('/dashboard/trainer')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const stepPct = ((step - 2) / 3) * 75 + 25

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            Step {step} of 5 — {STEP_TITLES[step - 2]}
          </p>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${stepPct}%`, background: '#4ade80', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Step 2 — Basic info */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Tell us about yourself</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} style={INPUT_STYLE} />
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

        {/* Step 3 — Professional */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your qualifications</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Specialties</label>
              <MultiSelect options={SPECIALTIES} selected={specialties} onChange={setSpecialties} />
              {errors.specialties && <p style={ERR_STYLE}>{errors.specialties}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Years of experience</label>
              <input type="number" min="0" max="50" value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} />
              {errors.yearsExp && <p style={ERR_STYLE}>{errors.yearsExp}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Certification names</label>
              <MultiSelect options={[]} selected={certNames} onChange={setCertNames} allowCustom placeholder="e.g. NASM-CPT" />
            </div>
            <FileUpload label="Certification documents" files={certFiles} onChange={setCertFiles} required />
            {errors.certFiles && <p style={ERR_STYLE}>{errors.certFiles}</p>}
          </>
        )}

        {/* Step 4 — Documents */}
        {step === 4 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Verification documents</h2>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              These are reviewed by our team and never shared publicly.
            </p>
            <FileUpload label="Government-issued ID (NRIC / Passport)" files={govIdFiles} onChange={setGovIdFiles} maxFiles={2} required />
            {errors.govId && <p style={ERR_STYLE}>{errors.govId}</p>}
            <FileUpload label="CPR / First Aid certificate" files={cprFiles} onChange={setCprFiles} maxFiles={2} required />
            {errors.cpr && <p style={ERR_STYLE}>{errors.cpr}</p>}
            <FileUpload label="Professional liability insurance" files={insuranceFiles} onChange={setInsuranceFiles} maxFiles={2} />
          </>
        )}

        {/* Step 5 — Commercial */}
        {step === 5 && (
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
              <label style={LABEL_STYLE}>Session types</label>
              <MultiSelect options={SESSION_TYPES} selected={sessionTypes} onChange={setSessionTypes} />
              {errors.sessionTypes && <p style={ERR_STYLE}>{errors.sessionTypes}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Locations served</label>
              <MultiSelect options={LOCATIONS} selected={locations} onChange={setLocations} />
              {errors.locations && <p style={ERR_STYLE}>{errors.locations}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell potential clients about your training style, background, and what makes you unique…"
                style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }} />
              {errors.bio && <p style={ERR_STYLE}>{errors.bio}</p>}
            </div>
            {serverError && (
              <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                {serverError}
              </p>
            )}
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
          {step > 2 && (
            <button type="button" onClick={() => { setStep(s => s - 1); setErrors({}) }} style={BTN_GHOST}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < 5 ? (
            <button type="button" onClick={handleNext} style={BTN_PRIMARY}>Continue</button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
