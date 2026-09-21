import React, { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, BarChart3, Bell, BrainCircuit, Check, ChevronRight,
  CircleGauge, ClipboardCheck, Database, Ear, FileText, FlaskConical,
  HeartPulse, Image, Map, Menu, Milk, Radio, ShieldCheck, Smartphone,
  Thermometer, Waves, X,
} from "lucide-react";
import heroPoster from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/godrishti-hero-poster.jpg";
import heroVideo from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/godrishti-hero-video-20260920-b.mp4";
import brandLogo from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/godrishti-logo.jpeg";
import sensorDevice from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/godrishti-sensor-device-focused.jpg";
import farmerStory from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/farmer-story.jpg";
import udderAssessment from "@/GoDrishti-Landing-Source/GoDrishti-Landing/src/assets/udder-assessment.jpg";

const signalInputs = [
  [Thermometer, "Surface / skin temperature"], [Activity, "Activity"],
  [Waves, "Motion & acceleration"], [CircleGauge, "Gyroscope"],
  [Ear, "Chewing-related acoustic signals"], [Thermometer, "Ambient temperature & humidity"],
] as const;

const capabilities = [
  [Radio, "Continuous screening", "Non-invasive signals tracked over time."],
  [Thermometer, "Surface temperature", "Skin-level temperature patterns—not core body temperature."],
  [Activity, "Motion sensing", "Activity, acceleration and gyroscope signals."],
  [Ear, "Acoustic inference", "AI can infer rumination behaviour from chewing-related acoustic signals."],
  [BrainCircuit, "Temporal modelling", "Historical and current patterns reviewed together."],
  [Bell, "Risk prioritization", "Animals with increasing risk move into focus."],
  [Image, "Udder observations", "Supporting visual evidence, not standalone diagnosis."],
  [FlaskConical, "CMT input", "Farmer-entered results used as supporting information."],
  [Milk, "Milk & lab records", "Available results combined with other signals."],
  [ClipboardCheck, "Animal records", "Health history and manual observations in context."],
  [Map, "Herd visibility", "Animal-to-herd risk distribution without fabricated geography."],
  [BarChart3, "Decision support", "Evidence organized for targeted confirmation and action."],
] as const;

const dataSources = [
  [Radio, "Real-time sensor data"], [Database, "Historical farm data"],
  [ClipboardCheck, "Farm management data"], [HeartPulse, "Animal health records"],
  [Milk, "Milk data"], [FlaskConical, "Laboratory records"],
  [FileText, "Manual inputs"], [Thermometer, "Environmental conditions"],
] as const;

const assessmentFlows = [
  [Smartphone, "Phone image → image processing → supporting visual evidence"],
  [FlaskConical, "CMT result → manually entered → stored as supporting information"],
  [Milk, "Milk sample → manual / lab test → result combined with other signals"],
] as const;

function Brand() {
  return (
    <a href="#overview" className="flex items-center gap-3" aria-label="GoDrishti home">
      <img src={brandLogo} alt="GoDrishti" width={640} height={640} className="h-12 w-auto max-w-[180px] rounded-sm object-contain" />
    </a>
  );
}

function ButtonLink({ href, to, children, outline = false }: { href?: string; to?: string; children: ReactNode; outline?: boolean }) {
  const className = `inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-bold transition-colors ${outline ? "border border-primary/30 bg-transparent text-primary hover:bg-secondary" : "bg-primary text-primary-foreground hover:bg-earth"}`;
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
        <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
      <ArrowRight className="size-4" />
    </a>
  );
}

function SectionHead({ kicker, title, text, center = false }: { kicker?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={`${center ? "mx-auto text-center" : ""} max-w-3xl`}>
      {kicker && <p className="eyebrow mb-5">{kicker}</p>}
      <h2 className="display-title">{title}</h2>
      {text && <p className="body-lead mt-6">{text}</p>}
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    ["Overview", "#overview"],
    ["How It Works", "#how-it-works"],
    ["Technology", "#technology"],
    ["Forecasting", "#forecasting"],
    ["Livestock", "#livestock"],
    ["Dashboard", "#dashboard"],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="section-shell flex h-20 items-center justify-between gap-5">
        <Brand />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Primary">
          {nav.map(([name, href]) => (
            <a key={name} href={href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
              {name}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="px-3 text-sm font-bold text-primary">Login</Link>
          <ButtonLink to="/login">Get Started</ButtonLink>
        </div>
        <button onClick={() => setOpen(!open)} className="grid size-11 place-items-center rounded-md border border-border xl:hidden" aria-expanded={open} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="section-shell flex flex-col gap-1 border-t border-border py-4 xl:hidden" aria-label="Mobile">
          {nav.map(([name, href]) => (
            <a key={name} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-semibold hover:bg-muted">
              {name}
            </a>
          ))}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ButtonLink to="/login" outline>Login</ButtonLink>
            <ButtonLink to="/login">Get Started</ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section id="overview" className="section-shell pb-16 pt-20 text-center md:pt-28">
          <p className="eyebrow">AI-Powered Livestock Health Intelligence</p>
          <h1 className="mx-auto mt-6 max-w-5xl font-display text-5xl font-medium leading-[1.02] md:text-7xl lg:text-8xl">
            See the change before it becomes <em className="text-earth">a problem.</em>
          </h1>
          <p className="body-lead mx-auto mt-7 max-w-3xl">
            Continuous livestock signals and multimodal evidence help identify animals whose mastitis risk is increasing before clinical signs appear.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="#technology">Explore GoDrishti</ButtonLink>
            <ButtonLink href="#how-it-works" outline>See How It Works</ButtonLink>
          </div>
          <div className="relative mt-16 overflow-hidden rounded-lg bg-surface-strong shadow-2xl">
            <video className="aspect-[16/9] w-full object-cover" autoPlay muted loop playsInline controls preload="metadata" poster={heroPoster}>
              <source src={heroVideo} type="video/mp4" />
              <img src={heroPoster} alt="Indian dairy farmer observing cows and buffalo in a dairy farm" width={1536} height={1024} />
            </video>
            <div className="pointer-events-none absolute bottom-5 left-5 hidden rounded-md bg-background/90 px-4 py-3 text-left backdrop-blur sm:block">
              <span className="block text-xs font-bold uppercase text-tech-green">Sense → Screen → Prioritize → Confirm → Act</span>
              <span className="text-sm text-foreground">Early-risk screening and decision support—not automatic diagnosis.</span>
            </div>
          </div>
        </section>

        <section className="editorial-rule section-space">
          <div className="section-shell">
            <SectionHead center kicker="The problem" title="Mastitis can become visible only after clinical signs appear." text="Farmers need earlier visibility into changing animal-level patterns." />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                ["Late visibility", "Risk may become obvious only after clinical signs."],
                ["Scattered information", "Sensor, animal, milk, laboratory and farm-management information may exist in different places."],
                ["Targeted attention", "Farmers need a way to prioritize animals for closer assessment."],
              ].map(([title, text]) => (
                <article key={title} className="border-t border-border pt-6 text-left">
                  <h3 className="font-sans text-sm font-bold uppercase text-primary">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="technology" className="section-space bg-surface-strong text-primary-foreground">
          <div className="section-shell">
            <SectionHead kicker="Multimodal early-risk intelligence" title="From continuous signals to targeted confirmation." text="A low-cost screening-to-confirmation architecture brings non-invasive monitoring and available diagnostic information into one evidence-aware workflow." />
            <div className="mt-16 grid border-y border-primary-foreground/20 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "Continuous Screening", "Monitor changing livestock signals over time."],
                ["02", "Early Risk Identification", "Identify animals whose risk pattern is increasing."],
                ["03", "Targeted Confirmation", "Prioritize animals for additional assessment and available tests."],
                ["04", "Herd-Level Decision Support", "Move from individual monitoring to herd-level visibility."],
              ].map(([number, title, text]) => (
                <article key={number} className="border-b border-primary-foreground/20 p-7 md:border-r lg:border-b-0">
                  <span className="text-sm font-bold text-tech-green">{number}</span>
                  <h3 className="mt-12 text-2xl">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-primary-foreground/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="forecasting" className="section-space">
          <div className="section-shell grid items-start gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <SectionHead kicker="Temporal risk analysis" title="Designed for 7–14 day mastitis risk forecasting." text="Historical time-series and multimodal livestock data are used to identify temporal patterns associated with future mastitis risk. The architecture is undergoing validation using longitudinal field data." />
            <div>
              <div className="flex items-center justify-between gap-2 border-y border-border py-5 text-center text-xs font-bold uppercase text-muted-foreground">
                <span>Day −14</span><ArrowRight className="size-4 text-tech-cyan" />
                <span>Day −7</span><ArrowRight className="size-4 text-tech-cyan" />
                <span>Day −1</span><ArrowRight className="size-4 text-tech-cyan" />
                <span>Clinical outcome</span>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  "Historical signals + current signals + farm context",
                  "AI / ML temporal analysis",
                  "Risk forecast for targeted assessment",
                ].map((text, index) => (
                  <div key={text} className="flex gap-5 border-t border-border py-5">
                    <span className="font-display text-2xl text-tech-cyan">0{index + 1}</span>
                    <p className="pt-1 font-semibold">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="livestock" className="section-space bg-muted">
          <div className="section-shell grid gap-12 lg:grid-cols-2">
            <img src={farmerStory} alt="Indian dairy farmer observing an animal in a working dairy shed" loading="lazy" width={1280} height={960} className="aspect-[4/5] w-full rounded-lg object-cover" />
            <div className="self-center">
              <SectionHead kicker="Animal and herd intelligence" title="From one animal to the whole herd." text="GoDrishti supports animal-level risk prioritization and herd-level visibility without replacing hands-on assessment." />
              <ol className="mt-12">
                {[
                  "Sense changing animal signals",
                  "Screen for increasing risk patterns",
                  "Prioritize animals for closer assessment",
                  "Confirm with supporting evidence",
                  "Act with farmer or professional judgment",
                ].map((text, index) => (
                  <li key={text} className="group flex items-center gap-6 border-t border-border py-5">
                    <span className="text-xs font-bold text-tech-cyan">0{index + 1}</span>
                    <span className="font-display text-2xl">{text}</span>
                    <ChevronRight className="ml-auto size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="section-shell">
            <SectionHead center kicker="Low-cost sensor monitoring" title="Signals become useful when they are connected over time." text="The non-invasive device can collect multiple livestock and environmental signals. Data flows into AI / ML analysis to surface a changing risk pattern." />
            <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
              <img src={sensorDevice} alt="Actual GoDrishti livestock monitoring sensor device" loading="lazy" width={768} height={1024} className="aspect-[16/9] w-full object-contain" />
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-2 sm:inset-x-5 sm:bottom-5">
                {["Temperature", "Activity", "Humidity", "Livestock signal"].map((label) => (
                  <span key={label} className="rounded-full border border-border bg-background/90 px-3 py-1.5 text-[10px] font-bold uppercase text-foreground backdrop-blur">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-14 grid grid-cols-2 border-l border-t border-border md:grid-cols-3 lg:grid-cols-4">
              {capabilities.map(([Icon, title, text]) => (
                <div key={title} className="min-h-48 border-b border-r border-border p-5 transition-colors hover:bg-secondary">
                  <Icon className="size-6 text-tech-cyan" />
                  <h3 className="mt-8 font-sans text-base font-bold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {signalInputs.map(([Icon, label]) => (
                <span key={label} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold">
                  <Icon className="size-4 text-tech-green" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-card">
          <div className="section-shell">
            <SectionHead kicker="A clearer operating view" title="From periodic monitoring to connected mastitis risk intelligence." />
            <div className="mt-14 grid overflow-hidden rounded-lg border border-border md:grid-cols-2">
              <Comparison title="Traditional Monitoring" items={["Periodic observation", "Scattered records", "Manual prioritization", "Limited historical context", "Delayed awareness"]} />
              <Comparison accent title="GoDrishti" items={["Continuous screening", "Connected signals", "AI-assisted risk prioritization", "Historical context", "Targeted confirmation", "Animal + herd visibility"]} />
            </div>
          </div>
        </section>

        <section className="section-space bg-primary text-primary-foreground">
          <div className="section-shell grid gap-12 lg:grid-cols-2">
            <SectionHead kicker="System innovation" title="A screening-to-confirmation architecture—not AI for its own sake." text="GoDrishti combines continuous non-invasive monitoring with targeted diagnostic information for early-risk screening and decision support." />
            <div className="grid gap-px bg-primary-foreground/20 sm:grid-cols-2">
              {[
                "Continuous screening",
                "Early risk identification",
                "Targeted confirmation",
                "Farmer / professional action",
                "No automatic diagnosis",
              ].map((text) => (
                <div key={text} className="flex min-h-28 items-center gap-3 bg-primary p-5">
                  <ShieldCheck className="size-5 text-tech-green" />
                  <span className="font-bold">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="section-shell">
            <SectionHead center kicker="Combined evidence" title="Risk screening guides what to confirm next." text="The system organizes evidence; farmers, professionals and laboratory results remain central to confirmation and action." />
            <div className="mx-auto mt-16 grid max-w-6xl gap-3 md:grid-cols-4">
              {[
                ["Sensor signals + AI forecast", "Changing patterns"],
                ["Udder + CMT + milk / lab data", "Supporting evidence"],
                ["Targeted confirmation", "Focused assessment"],
                ["Farmer / professional action", "Human decision"],
              ].map(([title, label], index) => (
                <div key={title} className="relative border-t-2 border-tech-cyan bg-card p-6 text-center shadow-sm">
                  <span className="text-xs font-bold text-muted-foreground">{label}</span>
                  <h3 className="mt-5 font-sans text-base font-bold">{title}</h3>
                  {index < 3 && <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden size-6 text-tech-cyan md:block" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-space bg-muted">
          <div className="section-shell">
            <SectionHead kicker="Field-data context" title="Longitudinal learning grounded in real dairy environments." text="Five dairy farms are part of the current field-data work. These figures describe data collection context—not product-wide deployment or performance." />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["5", "Dairy farms in field-data work"],
                ["14", "Cows at Vaishanavi Dairy"],
                ["30", "Buffaloes at Vaishanavi Dairy"],
                ["44", "Total animals at Vaishanavi Dairy"],
              ].map(([value, label]) => (
                <div key={label} className="border-t border-tech-cyan pt-6">
                  <strong className="font-display text-4xl font-medium">{value}</strong>
                  <span className="mt-3 block text-sm text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section-space">
          <div className="section-shell">
            <SectionHead center kicker="How GoDrishti works" title="Sense. Screen. Prioritize. Confirm. Act." />
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {[
                ["01", "Sense & Screen", "Continuous signals, animal history and farm context reveal changing patterns."],
                ["02", "Prioritize", "Temporal analysis is designed to identify animals whose mastitis risk may be increasing."],
                ["03", "Confirm & Act", "Udder observations, CMT, milk or laboratory inputs support targeted human decisions."],
              ].map(([number, title, text]) => (
                <article key={number} className="border-t border-border pt-7">
                  <span className="font-display text-4xl text-tech-cyan">{number}</span>
                  <h3 className="mt-10 text-2xl">{title}</h3>
                  <p className="mt-4 leading-7 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <ButtonLink to="/login">Explore GoDrishti</ButtonLink>
            </div>
          </div>
        </section>

        <section className="section-space bg-surface-strong text-primary-foreground">
          <div className="section-shell grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <img src={farmerStory} alt="Indian dairy farmer working with livestock in a natural farm environment" loading="lazy" width={1280} height={960} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <div>
              <SectionHead kicker="Designed for Indian dairy deployment" title="Technology should work across different resource levels." text="Every data source is not mandatory. More available context can strengthen analysis while GoDrishti supports practical use in varied farm settings." />
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Deployment title="Low-resource farm" items={["Smartphone + sensor", "Animal history", "Manual observations", "Milk yield or CMT when available"]} />
                <Deployment title="Connected farm" items={["SCC, EC and pH when available", "Automated milk yield", "Farm software + lab records", "Additional sensors"]} />
              </div>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="section-shell">
            <SectionHead center kicker="Multimodal data" title="Connect the evidence that is available." text="Real-time, historical, manual and laboratory information can flow into multimodal AI / ML and become early-risk intelligence." />
            <div className="mx-auto mt-14 flex max-w-5xl flex-wrap justify-center gap-4">
              {dataSources.map(([Icon, label]) => (
                <div key={label} className="flex min-h-28 w-36 flex-col items-center justify-center gap-3 rounded-full border border-border bg-card px-3 text-center">
                  <Icon className="size-5 text-tech-cyan" />
                  <span className="text-xs font-bold">{label}</span>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 border-y border-border py-5 text-xs font-bold uppercase">
              <span>Multimodal AI / ML</span>
              <ArrowRight className="size-4 text-tech-cyan" />
              <span>Early-risk intelligence</span>
            </div>
          </div>
        </section>

        <section className="section-space bg-muted">
          <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHead kicker="Everyday dairy management" title="AI-Assisted Udder Assessment" text="A phone image can support image processing and AI-assisted visual analysis as one multimodal observation. It is not a standalone mastitis diagnosis and requires further confirmation." />
              <div className="mt-8 space-y-4">
                {assessmentFlows.map(([Icon, text]) => (
                  <div key={text} className="flex items-start gap-3 border-l-2 border-tech-cyan pl-5">
                    <Icon className="mt-1 size-5 shrink-0 text-tech-cyan" />
                    <p className="text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                ))}
                <p className="pt-2 text-sm leading-6 text-muted-foreground">
                  Available milk inputs may include yield, quality, temperature, pH, conductivity and SCC. GoDrishti does not automatically perform these tests or replace CMT.
                </p>
              </div>
            </div>
            <img src={udderAssessment} alt="Indian dairy farmer carrying out an udder-focused observation with a tablet" loading="lazy" width={1280} height={960} className="aspect-[4/3] w-full rounded-lg object-cover" />
          </div>
        </section>

        <section id="dashboard" className="section-space bg-surface-strong text-primary-foreground">
          <div className="section-shell">
            <SectionHead center kicker="Operational view" title="One view for the herd." text="Animal-level signals, risk indicators, alerts and supporting records in one operational view." />
            <div className="mx-auto mt-14 max-w-5xl rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 p-8 text-center md:p-14">
              <BarChart3 className="mx-auto size-12 text-tech-green" />
              <h3 className="mt-6 text-2xl">Actual GoDrishti dashboard preview</h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-primary-foreground/70">
                The existing product interface remains unchanged. Its original component or screenshot can be placed here when supplied; no substitute dashboard has been fabricated.
              </p>
              <div className="mt-8">
                <ButtonLink to="/login">Open Dashboard</ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="section-space">
          <div className="section-shell">
            <SectionHead kicker="Product-development journey" title="From problem identification to field validation." text="A capability progression based only on the verified project context—without invented dates, accuracy figures or outcomes." />
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Problem Identification", "Low-Cost Sensor Monitoring", "Multimodal Data Collection",
                "AI / ML Risk Modelling", "7–14 Day Forecasting Architecture", "Udder Image Assessment",
                "CMT + Manual / Laboratory Integration", "Animal-Level Risk Intelligence",
                "Herd-Level Decision Support", "Field Validation",
              ].map((title, index) => (
                <article key={title} className="rounded-lg border border-border bg-card p-7">
                  <span className="text-xs font-bold text-tech-cyan">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-8 text-2xl">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="final-cta" className="section-space bg-secondary">
          <div className="section-shell text-center">
            <SectionHead center kicker="GoDrishti" title="See the change. Prioritize what needs attention." text="Bring continuous livestock signals and supporting evidence into one mastitis early-risk screening and decision-support workflow." />
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/login">Get Started</ButtonLink>
              <ButtonLink to="/login" outline>Open Dashboard</ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Comparison({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <article className={`p-7 md:p-10 ${accent ? "bg-secondary" : "bg-muted"}`}>
      <h3 className="text-2xl">{title}</h3>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 border-t border-border pt-4">
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${accent ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
              {accent ? <Check className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Deployment({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-t border-primary-foreground/25 pt-5">
      <h3 className="font-sans text-sm font-bold uppercase text-tech-green">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
        {items.map((item) => (
          <li key={item}>— {item}</li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-surface-strong py-16 text-primary-foreground">
      <div className="section-shell grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-6 max-w-sm text-sm leading-7 text-primary-foreground/65">
            Multimodal early-risk screening and decision support for bovine mastitis. Risk intelligence—not diagnosis.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase text-tech-green">Navigate</h2>
          <div className="mt-5 grid gap-3 text-sm text-primary-foreground/70">
            {[
              ["Overview", "#overview"],
              ["How It Works", "#how-it-works"],
              ["Technology", "#technology"],
              ["Forecasting", "#forecasting"],
              ["Dashboard", "#dashboard"],
            ].map(([name, href]) => (
              <a key={name} href={href} className="hover:text-primary-foreground">
                {name}
              </a>
            ))}
            <Link to="/login" className="hover:text-primary-foreground">Login</Link>
          </div>
        </div>
        <div>
          <h2 className="font-sans text-xs font-bold uppercase text-tech-green">Trust & legal</h2>
          <p className="mt-5 text-sm font-semibold">Early-risk screening—not a diagnosis.</p>
          <div className="mt-6 flex gap-5 text-sm text-primary-foreground/60">
            <a href="#overview">Privacy Policy</a>
            <a href="#overview">Terms</a>
          </div>
        </div>
      </div>
      <div className="section-shell mt-14 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/50">
        © 2026 GoDrishti. Livestock mastitis early-risk intelligence.
      </div>
    </footer>
  );
}
