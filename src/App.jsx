import { useState } from 'react'

const trainers = [
  {
    name: "Sarah Chen",
    specialty: "Strength & Conditioning",
    certs: ["NASM-CPT", "TRX Certified"],
    rating: 4.9,
    reviews: 47,
    rate: 85,
    areas: ["Bishan", "Toa Payoh", "Ang Mo Kio"],
    venues: ["Condo Gym", "Park"],
    image: "SC"
  },
  {
    name: "Marcus Tan",
    specialty: "Weight Loss & HIIT",
    certs: ["ACE-CPT", "Precision Nutrition L1"],
    rating: 4.8,
    reviews: 32,
    rate: 75,
    areas: ["Tampines", "Pasir Ris", "Bedok"],
    venues: ["Condo Gym", "Home", "Park"],
    image: "MT"
  },
  {
    name: "Priya Sharma",
    specialty: "Prenatal & Postnatal Fitness",
    certs: ["ACSM-CPT", "Pre/Postnatal Cert"],
    rating: 5.0,
    reviews: 28,
    rate: 90,
    areas: ["Orchard", "River Valley", "Tiong Bahru"],
    venues: ["Home", "Studio"],
    image: "PS"
  },
  {
    name: "James Lim",
    specialty: "Functional Fitness & Seniors",
    certs: ["NASM-CPT", "Senior Fitness Specialist"],
    rating: 4.9,
    reviews: 53,
    rate: 70,
    areas: ["Jurong", "Clementi", "Bukit Batok"],
    venues: ["Community Centre", "Home", "Park"],
    image: "JL"
  },
  {
    name: "Aisha Rahman",
    specialty: "Boxing & Self-Defence",
    certs: ["ACE-CPT", "Boxing Coach L2"],
    rating: 4.7,
    reviews: 19,
    rate: 80,
    areas: ["Woodlands", "Yishun", "Sembawang"],
    venues: ["Condo Gym", "Park"],
    image: "AR"
  },
  {
    name: "Daniel Wong",
    specialty: "Bodybuilding & Hypertrophy",
    certs: ["NASM-CPT", "CSCS"],
    rating: 4.8,
    reviews: 41,
    rate: 95,
    areas: ["CBD", "Marina Bay", "Tanjong Pagar"],
    venues: ["Condo Gym", "Studio"],
    image: "DW"
  }
]

function Nav() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">FG</span>
          </div>
          <span className="text-xl font-bold">
            <span className="text-green-brand">Fitness</span>
            <span className="text-gray-900">Guru</span>
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-gray-600 hover:text-green-brand transition-colors text-sm font-medium">How It Works</a>
          <a href="#trainers" className="text-gray-600 hover:text-green-brand transition-colors text-sm font-medium">Trainers</a>
          <a href="#pricing" className="text-gray-600 hover:text-green-brand transition-colors text-sm font-medium">Pricing</a>
          <a href="#for-trainers" className="text-gray-600 hover:text-green-brand transition-colors text-sm font-medium">For Trainers</a>
          <a href="#waitlist" className="bg-green-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-dark transition-colors">
            Join Waitlist
          </a>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2" aria-label="Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-4">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-gray-600 hover:text-green-brand text-sm font-medium">How It Works</a>
          <a href="#trainers" onClick={() => setOpen(false)} className="text-gray-600 hover:text-green-brand text-sm font-medium">Trainers</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-gray-600 hover:text-green-brand text-sm font-medium">Pricing</a>
          <a href="#for-trainers" onClick={() => setOpen(false)} className="text-gray-600 hover:text-green-brand text-sm font-medium">For Trainers</a>
          <a href="#waitlist" onClick={() => setOpen(false)} className="bg-green-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold text-center">Join Waitlist</a>
        </div>
      )}
    </nav>
  )
}

function Hero() {
  return (
    <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            Launching in Singapore
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Personal training from{' '}
            <span className="text-green-brand">SGD $65</span>
            <br className="hidden sm:block" />
            {' '}per session
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Singapore's personal training marketplace. Certified, vetted trainers &mdash; no gym membership required. Train at your condo gym, home, or park.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#waitlist" className="bg-green-brand text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-green-dark transition-colors shadow-lg shadow-green-brand/25">
              Find a Trainer
            </a>
            <a href="#for-trainers" className="border-2 border-green-brand text-green-brand px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-green-50 transition-colors">
              I'm a Trainer
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-brand">30-50%</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">less than gym rates</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-brand">80%</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">kept by trainers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-green-brand">0</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">lock-in packages</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Personal training is expensive because of the <span className="text-green-brand">middleman</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Gyms take 40-50% of every session fee. You pay $130-200 at a gym. Your trainer sees less than half. We fix that.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">At a gym</div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You pay</span>
                <span className="text-2xl font-bold text-gray-900">$150</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gym takes</span>
                <span className="text-xl font-bold text-red-500">-$65</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trainer earns</span>
                <span className="text-xl font-bold text-gray-700">$85</span>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-brand relative">
            <div className="absolute -top-3 left-8 bg-green-brand text-white text-xs font-bold px-3 py-1 rounded-full">BETTER FOR EVERYONE</div>
            <div className="text-sm font-semibold text-green-brand uppercase tracking-wider mb-4">On FitnessGuru</div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">You pay</span>
                <span className="text-2xl font-bold text-green-brand">$85</span>
              </div>
              <div className="h-px bg-green-200" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform fee (20%)</span>
                <span className="text-xl font-bold text-gray-500">-$17</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trainer earns</span>
                <span className="text-xl font-bold text-green-brand">$68</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-green-800">Same trainer. Same quality. 43% less for you. Trainer earns more per dollar you spend.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Discover",
      desc: "Browse verified trainer profiles with certifications, reviews, specialisations, and real-time availability. Filter by location, training style, and price.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      num: "2",
      title: "Book",
      desc: "Pick a trainer, choose a time slot, select a venue. Book and pay in 60 seconds. Single session or package. No phone calls. No waiting.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      num: "3",
      title: "Train & Grow",
      desc: "Show up and train. Rate your session. Build an ongoing relationship with a trainer who knows your goals and tracks your progress.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ]

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How it works</h2>
          <p className="mt-4 text-lg text-gray-600">From search to session in under 90 seconds</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-brand mb-6">
                {step.icon}
              </div>
              <div className="text-sm font-bold text-green-brand mb-2">Step {step.num}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Venues() {
  const venues = [
    { name: "Condo Gym", cost: "SGD $0", desc: "80% of private estates have one", icon: "🏢" },
    { name: "Your Home", cost: "SGD $0", desc: "Maximum convenience, zero commute", icon: "🏠" },
    { name: "Public Park", cost: "SGD $0", desc: "East Coast, Bishan & more", icon: "🌳" },
    { name: "ActiveSG Gym", cost: "SGD $2.50", desc: "Government community centres", icon: "🏋️" },
  ]

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">No gym required</h2>
          <p className="mt-4 text-lg text-gray-600">Train wherever suits you. The best coaching doesn't need marble floors.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {venues.map((v) => (
            <div key={v.name} className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{v.name}</h3>
              <div className="text-green-brand font-semibold text-sm mb-1">{v.cost}</div>
              <p className="text-gray-500 text-xs">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerCard({ trainer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-brand font-bold text-lg shrink-0">
          {trainer.image}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900">{trainer.name}</h3>
          <p className="text-sm text-green-brand font-medium">{trainer.specialty}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-3">
        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        <span className="text-sm font-semibold text-gray-900">{trainer.rating}</span>
        <span className="text-sm text-gray-400">({trainer.reviews} reviews)</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {trainer.certs.map((c) => (
          <span key={c} className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-full font-medium">{c}</span>
        ))}
      </div>
      <div className="text-xs text-gray-500 mb-1">
        <span className="font-medium">Areas:</span> {trainer.areas.join(", ")}
      </div>
      <div className="text-xs text-gray-500 mb-4">
        <span className="font-medium">Venues:</span> {trainer.venues.join(", ")}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <span className="text-2xl font-bold text-gray-900">${trainer.rate}</span>
          <span className="text-sm text-gray-500"> /session</span>
        </div>
        <a href="#waitlist" className="bg-green-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors">
          Book Now
        </a>
      </div>
    </div>
  )
}

function Trainers() {
  return (
    <section id="trainers" className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Meet our trainers</h2>
          <p className="mt-4 text-lg text-gray-600">Every trainer is certified, insured, and reviewed by real clients</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((t) => <TrainerCard key={t.name} trainer={t} />)}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Transparent pricing</h2>
          <p className="mt-4 text-lg text-gray-600">No hidden fees. No lock-in packages. What you see is what you pay.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Starting from</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$65<span className="text-lg text-gray-500 font-normal">/session</span></div>
            <p className="text-sm text-gray-500 mb-6">Newer certified trainers building their practice</p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Certified (NASM/ACE/ACSM)</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Insured</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Verified reviews</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Single session booking</li>
            </ul>
          </div>
          <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-brand relative">
            <div className="absolute -top-3 right-8 bg-green-brand text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
            <div className="text-sm font-semibold text-green-brand uppercase tracking-wider mb-2">Average</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$85<span className="text-lg text-gray-500 font-normal">/session</span></div>
            <p className="text-sm text-gray-500 mb-6">Experienced trainers with specialist skills</p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Everything in Starting</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> 3-7 years experience</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Specialisations (prenatal, seniors, etc.)</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Programme design included</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Premium</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$100+<span className="text-lg text-gray-500 font-normal">/session</span></div>
            <p className="text-sm text-gray-500 mb-6">Elite trainers, competition coaches, rehab specialists</p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Everything in Average</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> 7+ years experience</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Advanced certifications (CSCS, etc.)</li>
              <li className="flex items-start gap-2"><span className="text-green-brand mt-0.5">&#10003;</span> Still 30-50% less than gym equivalent</li>
            </ul>
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          Trainers set their own rates. FitnessGuru takes a 20% platform fee &mdash; that's it. No hidden charges.
        </p>
      </div>
    </section>
  )
}

function ForTrainers() {
  return (
    <section id="for-trainers" className="py-16 sm:py-24 bg-green-brand text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Trainers: keep 80% of what you earn
            </h2>
            <p className="mt-4 text-lg text-green-100 leading-relaxed">
              Stop building someone else's business. Set your own rates, own your client relationships, and build your practice on your terms.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Keep 80% of every session fee",
                "Set your own rates and schedule",
                "Own your client relationships",
                "Get discovered by clients you'd never reach",
                "Zero commission for your first 90 days",
                "Professional profile setup included",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-300 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <a href="#waitlist" className="inline-block mt-8 bg-white text-green-brand px-8 py-3.5 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Apply as a Trainer
            </a>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6">Your earnings comparison</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-200">At a gym (client pays $150)</span>
                  <span className="font-bold">You earn $75-90</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full">
                  <div className="h-3 bg-green-300/50 rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-200">On FitnessGuru (client pays $100)</span>
                  <span className="font-bold">You earn $80</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full">
                  <div className="h-3 bg-green-300 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-green-200">
              Client pays less. You earn more per dollar spent. Everyone wins.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhoIsItFor() {
  const personas = [
    { title: "Young professionals", desc: "Gym PT is $130-200. Your budget is $75. We got you.", icon: "💼" },
    { title: "Working parents", desc: "Train at home while the kids nap. No commute to a gym.", icon: "👨‍👩‍👧" },
    { title: "HDB residents", desc: "Train at your void deck, nearby park, or community centre.", icon: "🏘️" },
    { title: "Seniors", desc: "Functional fitness at home or community centre. Safe and affordable.", icon: "🧓" },
    { title: "First-timers", desc: "No fitness network? Verified profiles and real reviews make it easy.", icon: "🌟" },
    { title: "Condo residents", desc: "Your condo gym is fully equipped and underused. Put it to work.", icon: "🏊" },
  ]

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">For everyone who was priced out</h2>
          <p className="mt-4 text-lg text-gray-600">Personal training should not be a luxury</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((p) => (
            <div key={p.title} className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-2xl mb-3">{p.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Waitlist() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('client')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="waitlist" className="py-16 sm:py-24 bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Join the waitlist</h2>
        <p className="mt-4 text-lg text-gray-600">
          Be the first to know when FitnessGuru launches in Singapore
        </p>
        {submitted ? (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-8">
            <div className="text-4xl mb-3">&#127881;</div>
            <h3 className="text-xl font-bold text-green-brand">You're on the list!</h3>
            <p className="text-gray-600 mt-2">We'll be in touch when we launch. {role === 'trainer' ? 'Expect a personal email from our founder.' : 'Get ready for affordable personal training.'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button type="button" onClick={() => setRole('client')}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors ${role === 'client' ? 'bg-white text-green-brand shadow-sm' : 'text-gray-500'}`}>
                I want a trainer
              </button>
              <button type="button" onClick={() => setRole('trainer')}
                className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors ${role === 'trainer' ? 'bg-white text-green-brand shadow-sm' : 'text-gray-500'}`}>
                I am a trainer
              </button>
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-green-brand focus:border-transparent"
            />
            <button type="submit" className="w-full bg-green-brand text-white py-3.5 rounded-lg font-semibold text-base hover:bg-green-dark transition-colors shadow-lg shadow-green-brand/25">
              {role === 'trainer' ? 'Apply as a Trainer' : 'Join the Waitlist'}
            </button>
            <p className="text-xs text-gray-400">No spam. Just a launch notification.</p>
          </form>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">FG</span>
            </div>
            <span className="font-bold text-white">FitnessGuru</span>
          </div>
          <p className="text-sm">
            &copy; 2026 FitnessGuru Pte Ltd. Singapore.
          </p>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          Cut out the middleman. Trainers earn what they deserve. Everyone gets a coach.
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Venues />
      <Trainers />
      <Pricing />
      <WhoIsItFor />
      <ForTrainers />
      <Waitlist />
      <Footer />
    </div>
  )
}
