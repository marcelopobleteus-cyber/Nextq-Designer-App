import type { Metadata } from 'next'
import Link from 'next/link'
import './landing.css'

const SITE = 'https://designer.nextqtechnology.com'
const CONTACT = 'https://nextqtechnology.com/en/contact'
const TITLE = 'NextQ Designer — Plan CCTV, fiber and network projects'
const DESC =
  'Map cameras on floor plans and satellite views, design fiber and conduit diagrams, build the bill of materials and guide field crews. A NextQ Technology product.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: SITE },
  openGraph: { title: TITLE, description: DESC, url: SITE, siteName: 'NextQ Designer', type: 'website' },
  twitter: { card: 'summary', title: TITLE, description: DESC },
}

const FAQ = [
  { q: 'Who is NextQ Designer for?', a: 'Integrators, low-voltage and network contractors and in-house IT teams that design and deploy CCTV, structured cabling and fiber projects and want one place for the plan, the materials and the field work.' },
  { q: 'What can I design with it?', a: 'You can place cameras and devices on a map or on an uploaded floor plan, draw fiber and conduit diagrams, and keep the equipment and materials list of each project together with the design.' },
  { q: 'Can my field crew use it on site?', a: 'Yes. There is a mobile experience for employees with its own sign-in, so technicians see their assigned work, track time and log expenses from the phone.' },
  { q: 'Can I share a project with a customer?', a: 'Projects can be shared through a private link so a customer or partner can review the design without needing an account.' },
  { q: 'Does it help with the business side too?', a: 'Yes. Besides design, it includes customers, time tracking, expenses, invoices and payroll views, and reports.' },
  { q: 'Is my company data separate from others?', a: 'Yes. Each company works in its own workspace, protected by sign-in and database-level access rules.' },
  { q: 'How do I get access?', a: 'Contact NextQ Technology for a demo and we will set up your workspace. If you already have an account, use Sign in.' },
]

const FEATURES = [
  { ic: '🗺️', h: 'Map and floor-plan editor', p: 'Place cameras and devices on a map or on your own floor plan, drag to adjust and keep every detail in a side panel.' },
  { ic: '🧵', h: 'Fiber and conduit diagrams', p: 'Draw splice and connectivity diagrams and conduit cross-sections so the crew builds exactly what was designed.' },
  { ic: '📹', h: 'CCTV planning', p: 'Camera locations, device details and the network around them, organized per project.' },
  { ic: '📦', h: 'Equipment and materials', p: 'An equipment catalog and a bill of materials that stays tied to the design.' },
  { ic: '👷', h: 'Field crew tools', p: 'A mobile entry point for employees: assigned work, time tracking and expenses from the phone.' },
  { ic: '📊', h: 'Business side included', p: 'Customers, invoices, payroll views and reports next to your projects.' },
]

function Bar({ title }: { title: string }) {
  return <div className="lp-win-bar" aria-hidden="true"><i /><i /><i /><span>{title}</span></div>
}

function Shot() {
  return (
    <div className="lp-win lp-big">
      <Bar title="designer.nextqtechnology.com" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/projects.jpg" alt="NextQ Designer projects list with sample data" width={1288} height={700} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

export default function Welcome() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'NextQ Designer',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE,
      description: DESC,
      publisher: { '@type': 'Organization', name: 'NextQ Technology LLC', url: 'https://nextqtechnology.com' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]

  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="lp-nav">
        <div className="lp-wrap">
          <Link className="lp-brand" href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/nextq-symbol.svg" alt="" width={30} height={30} />
            NextQ Designer
          </Link>
          <nav aria-label="Main">
            <a className="hide-sm" href="#features">Features</a>
            <a className="hide-sm" href="#tour">Product tour</a>
            <a className="hide-sm" href="#faq">FAQ</a>
            <Link className="lp-btn sm" href="/login">Sign in</Link>
          </nav>
        </div>
      </header>

      <section className="lp-hero lp-hero2">
        <div className="lp-wrap">
          <div className="lp-center">
            <p className="lp-kicker">INFRASTRUCTURE DESIGN SOFTWARE</p>
            <h1>Design it once. <em>Build it right.</em></h1>
            <p className="lead">Plan CCTV, fiber and network projects on a map or floor plan, keep the materials list with the design and give your field crew what they need.</p>
            <div className="lp-cta">
              <Link className="lp-btn" href="/login">Sign in to Designer</Link>
              <a className="lp-btn ghost" href={CONTACT}>Request a demo</a>
            </div>
            <p className="lp-note">Workspaces are set up by NextQ Technology.</p>
          </div>
          <div className="lp-hero-shot">
            <Shot />
          </div>
        </div>
      </section>

      <div className="lp-facts">
        <div className="lp-wrap">
          <div className="lp-fact"><b>Map and floor plan</b><span>Place and adjust devices visually</span></div>
          <div className="lp-fact"><b>Fiber and conduit</b><span>Diagrams crews can build from</span></div>
          <div className="lp-fact"><b>Field-ready</b><span>Mobile entry for your employees</span></div>
          <div className="lp-fact"><b>Shareable</b><span>Private links for customers</span></div>
        </div>
      </div>

      <section className="lp-sec" id="features">
        <div className="lp-wrap">
          <p className="lp-eyebrow">WHAT IT DOES</p>
          <h2>From the first sketch to the finished job.</h2>
          <p className="lp-sub">Replace loose spreadsheets and disconnected drawings with one workspace where the design, the materials and the work stay together.</p>
          <div className="lp-grid">
            {FEATURES.map(f => (
              <div className="lp-card" key={f.h}><div className="ic" aria-hidden="true">{f.ic}</div><h3>{f.h}</h3><p>{f.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-sec tint" id="tour">
        <div className="lp-wrap">
          <p className="lp-eyebrow">PRODUCT TOUR</p>
          <h2>A look at the main screens.</h2>
          <p className="lp-sub">The projects screen is a real capture with sample names. The other screens are illustrations. Your workspace shows only your own projects.</p>
          <div className="lp-rows">
            <div className="lp-feat">
              <div className="lp-feat-text">
                <p className="lp-eyebrow">PROJECTS</p>
                <h3>One workspace per job</h3>
                <p>Every project keeps its design, devices, materials, tasks and people together, so nothing lives in a loose spreadsheet.</p>
                <ul><li>Status and client at a glance</li><li>Search and filter your whole portfolio</li><li>Open a project to see its full design</li></ul>
              </div>
              <Shot />
            </div>
            <div className="lp-feat rev">
              <div className="lp-feat-text">
                <p className="lp-eyebrow">MAP AND FLOOR PLAN</p>
                <h3>Place devices where they go</h3>
                <p>Position cameras, cabinets and fiber routes on a map or floor plan and adjust them visually.</p>
                <ul><li>Planned and draft items clearly marked</li><li>Fiber and conduit diagrams crews can build from</li><li>Private links to share with customers</li></ul>
              </div>
              <div className="lp-win lp-big" role="img" aria-label="Illustration of a project map with cameras, sample data">
                <Bar title="Project map · illustration" />
                <div className="lp-win-body">
                  <div className="lp-map" style={{ height: 230 }}>
                    <svg viewBox="0 0 400 190" aria-hidden="true">
                      <path d="M30 150 L130 90 L230 120 L350 50" fill="none" stroke="#FF6A13" strokeWidth="3" strokeDasharray="7 5" />
                      {[[30, 150], [130, 90], [230, 120], [350, 50]].map(([x, y], i) => (
                        <g key={i}><circle cx={x} cy={y} r="11" fill="#FF6A13" /><circle cx={x} cy={y} r="4" fill="#fff" /></g>
                      ))}
                      <rect x="170" y="30" width="70" height="38" rx="6" fill="#fff" stroke="#E4E4DF" />
                      <text x="180" y="52" fontSize="11" fill="#6B6B63">Cabinet A</text>
                    </svg>
                  </div>
                  <div className="lp-row" style={{ marginTop: 12 }}><div><strong>CAM-04 · North entrance</strong><small>Switch port 6</small></div><span className="lp-pill ok">Planned</span></div>
                  <div className="lp-row"><div><strong>Fiber route 1</strong><small>Cabinet A to Building B</small></div><span className="lp-pill or">Draft</span></div>
                </div>
              </div>
            </div>
            <div className="lp-feat">
              <div className="lp-feat-text">
                <p className="lp-eyebrow">MATERIALS</p>
                <h3>The list follows the design</h3>
                <p>The materials list stays tied to the design, so quotes and purchasing start from real quantities.</p>
                <ul><li>Quantities from the devices you placed</li><li>Flags for items to check in stock</li><li>Equipment catalog you control</li></ul>
              </div>
              <div className="lp-win lp-big" role="img" aria-label="Illustration of a bill of materials">
                <Bar title="Bill of materials · illustration" />
                <div className="lp-win-body">
                  <div className="lp-row" style={{ borderTop: 0 }}><div><strong>Outdoor dome camera</strong><small>Qty 24</small></div><span className="lp-pill ok">Listed</span></div>
                  <div className="lp-row"><div><strong>PoE switch, 24 port</strong><small>Qty 2</small></div><span className="lp-pill ok">Listed</span></div>
                  <div className="lp-row"><div><strong>Fiber patch cord</strong><small>Qty 12</small></div><span className="lp-pill warn">Check stock</span></div>
                  <div className="lp-row"><div><strong>Conduit, 2 in</strong><small>Qty 300 ft</small></div><span className="lp-pill ok">Listed</span></div>
                </div>
              </div>
            </div>
            <div className="lp-feat rev">
              <div className="lp-feat-text">
                <p className="lp-eyebrow">FIELD CREW</p>
                <h3>Technicians know what is next</h3>
                <p>Employees see their work, track time and log expenses from the phone without calling the office.</p>
                <ul><li>Clock in and out on site</li><li>Expenses with receipt photos</li><li>Only the jobs assigned to them</li></ul>
              </div>
              <div className="lp-win lp-big" role="img" aria-label="Illustration of field time tracking">
                <Bar title="Field app · illustration" />
                <div className="lp-win-body">
                  <div className="lp-row" style={{ borderTop: 0 }}><div><strong>Today · Campus fiber backbone</strong><small>Assigned to you</small></div><span className="lp-pill or">Active</span></div>
                  <div className="lp-row"><div><strong>Time on site</strong><small>Clock in and out from the phone</small></div><span className="lp-pill ok">Running</span></div>
                  <div className="lp-row"><div><strong>Expenses</strong><small>Add a receipt photo</small></div><span className="lp-pill warn">1 pending</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec dark">
        <div className="lp-wrap">
          <p className="lp-eyebrow">HOW IT WORKS</p>
          <h2>From plan to handover.</h2>
          <p className="lp-sub">We set up your workspace and help you start with a real project.</p>
          <div className="lp-steps">
            <div className="lp-step"><h3>Create a project</h3><p>Add the customer, the site and your floor plan or map.</p></div>
            <div className="lp-step"><h3>Design</h3><p>Place devices, draw fiber and conduit, build the materials list.</p></div>
            <div className="lp-step"><h3>Share</h3><p>Send a private link so the customer can review.</p></div>
            <div className="lp-step"><h3>Build</h3><p>The crew works from the design, tracks time and logs expenses.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="lp-wrap">
          <p className="lp-eyebrow">WHO USES IT</p>
          <h2>Built for the people who design and the people who build.</h2>
          <p className="lp-sub">Each person gets the view they need.</p>
          <div className="lp-roles">
            <div className="lp-card"><h3>Designers and engineers</h3><p>Maps, floor plans, fiber and conduit diagrams, equipment and materials.</p></div>
            <div className="lp-card"><h3>Owners and managers</h3><p>Customers, projects, invoices, payroll views and reports in one place.</p></div>
            <div className="lp-card"><h3>Field technicians</h3><p>A phone-first view with assigned work, time tracking and expenses.</p></div>
          </div>
        </div>
      </section>

      <section className="lp-sec tint" id="faq">
        <div className="lp-wrap">
          <p className="lp-eyebrow">FAQ</p>
          <h2>Questions, answered.</h2>
          <div className="lp-faq">
            {FAQ.map(f => (
              <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-wrap">
          <h2>Ready to design your next project?</h2>
          <p>Sign in if you already have an account, or ask for a demo and we will set up your workspace.</p>
          <div className="lp-cta">
            <Link className="lp-btn" href="/login">Sign in</Link>
            <a className="lp-btn ghost" href={CONTACT}>Request a demo</a>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <span>© {new Date().getFullYear()} NextQ Technology LLC · NextQ Designer</span>
          <span><a href="https://nextqtechnology.com">nextqtechnology.com</a><a href="https://nextqtechnology.com/en/privacy">Privacy</a><a href="https://nextqtechnology.com/en/terms">Terms</a></span>
        </div>
      </footer>
    </div>
  )
}
