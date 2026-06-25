import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Wallet,
  BrainCircuit,
  BellRing,
  PieChart as PieIcon,
  FileBarChart,
  Check,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlowBudget AI — Prenez le contrôle de vos dépenses" },
      {
        name: "description",
        content:
          "Plateforme intelligente pour suivre, analyser et optimiser vos finances personnelles. Simple, premium, sécurisée.",
      },
      { property: "og:title", content: "FlowBudget AI" },
      {
        property: "og:description",
        content: "Suivi des dépenses, budgets intelligents, analytics IA.",
      },
    ],
  }),
  component: Landing,
});

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const donutData = [
  { name: "Logement", value: 920, color: "#111111" },
  { name: "Alimentation", value: 410, color: "#444444" },
  { name: "Transport", value: 230, color: "#777777" },
  { name: "Loisirs", value: 180, color: "#FFD600" },
  { name: "Autres", value: 140, color: "#bdbdbd" },
];

const areaData = Array.from({ length: 12 }).map((_, i) => ({
  m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i],
  v: 800 + Math.round(Math.sin(i / 1.6) * 220 + i * 30),
}));

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <div className="size-7 rounded-lg bg-foreground grid place-items-center">
            <Sparkles className="size-4 text-background" />
          </div>
          FlowBudget <span className="text-muted-foreground font-normal">AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#fonctionnalites" className="hover:text-foreground transition">
            Fonctionnalités
          </a>
          <a href="#dashboard" className="hover:text-foreground transition">
            Aperçu
          </a>
          <a href="#tarifs" className="hover:text-foreground transition">
            Tarifs
          </a>
          <a href="#faq" className="hover:text-foreground transition">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline"
          >
            Se connecter
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-4 py-2 text-sm font-semibold cta-glow hover:opacity-95 transition"
          >
            Commencer <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-cta/20 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 text-center relative">
        <motion.div
          {...fade}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6"
        >
          <span className="size-1.5 rounded-full bg-cta" /> Nouveau · IA financière intégrée
        </motion.div>
        <motion.h1
          {...fade}
          className="text-5xl md:text-7xl font-semibold max-w-4xl mx-auto leading-[1.05]"
        >
          Prenez le contrôle total
          <br />
          de vos dépenses.
        </motion.h1>
        <motion.p
          {...fade}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Une plateforme intelligente pour suivre, analyser et optimiser vos finances personnelles
          avec une simplicité absolue.
        </motion.p>
        <motion.div
          {...fade}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-6 py-3.5 text-base font-semibold cta-glow hover:translate-y-[-1px] transition"
          >
            Commencer gratuitement <ArrowRight className="size-4" />
          </Link>
          <a
            href="#dashboard"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
          >
            Voir une démo
          </a>
        </motion.div>

        {/* Dashboard mock floating */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative"
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="glass-card rounded-3xl p-4 md:p-6 max-w-5xl mx-auto text-left">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-2xl border border-border p-5 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dépenses · ce mois</p>
              <p className="text-3xl font-semibold mt-1">1 880 000 Ar</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-cta/30 text-foreground font-medium">
              −12% vs M-1
            </span>
          </div>
          <div className="h-44 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={10} stroke="#888" />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                />
                <Area type="monotone" dataKey="v" stroke="#111" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border p-5 bg-white">
          <p className="text-xs text-muted-foreground">Catégories</p>
          <div className="h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {donutData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Logos() {
  const items = ["NORDIC", "Helios", "FINEA", "Veracore", "Lumen", "Atlas Pay"];
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-6">
          Adopté par des équipes financières exigeantes
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {items.map((t) => (
            <span key={t} className="text-lg font-semibold tracking-tight text-foreground/70">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Wallet,
    title: "Suivi des dépenses",
    desc: "Enregistrez chaque transaction en quelques secondes, avec catégories et notes.",
  },
  {
    icon: TrendingUp,
    title: "Budgets intelligents",
    desc: "Définissez des limites mensuelles et restez aligné avec vos objectifs.",
  },
  {
    icon: PieIcon,
    title: "Analytics avancés",
    desc: "Visualisez vos flux financiers via des graphiques élégants et précis.",
  },
  {
    icon: BrainCircuit,
    title: "IA financière",
    desc: "Recevez des recommandations personnalisées pour optimiser vos finances.",
  },
  {
    icon: FileBarChart,
    title: "Rapports mensuels",
    desc: "Un résumé clair et actionnable, livré automatiquement chaque mois.",
  },
  {
    icon: BellRing,
    title: "Alertes en temps réel",
    desc: "Soyez notifié dès qu'une catégorie dépasse votre seuil défini.",
  },
];

function Features() {
  return (
    <section id="fonctionnalites" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fade} className="max-w-2xl">
          <p className="text-sm text-muted-foreground mb-3">Fonctionnalités</p>
          <h2 className="text-4xl md:text-5xl">
            Tout ce dont vous avez besoin pour gérer votre argent.
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fade}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group rounded-2xl border border-border p-7 bg-white hover:-translate-y-1 transition"
            >
              <div className="size-11 rounded-xl bg-foreground text-background grid place-items-center mb-5 group-hover:bg-cta group-hover:text-cta-foreground transition">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Preview() {
  return (
    <section id="dashboard" className="py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fade} className="text-center max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3">Aperçu</p>
          <h2 className="text-4xl md:text-5xl">Un tableau de bord pensé pour la clarté.</h2>
          <p className="mt-4 text-muted-foreground">
            Chaque donnée à sa place. Chaque décision plus simple.
          </p>
        </motion.div>
        <motion.div {...fade} transition={{ duration: 0.8, delay: 0.1 }} className="mt-14">
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Gratuit",
    price: "0 Ar",
    desc: "Pour débuter en douceur.",
    features: ["Jusqu'à 50 dépenses / mois", "1 budget", "Analytics de base"],
    cta: "Commencer",
  },
  {
    name: "Pro",
    price: "45 000 Ar",
    desc: "Pour les particuliers exigeants.",
    features: ["Dépenses illimitées", "Budgets illimités", "IA financière", "Rapports mensuels"],
    cta: "Essayer Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "145 000 Ar",
    desc: "Pour les équipes & familles.",
    features: ["Tout Pro", "Multi-utilisateurs", "Export comptable", "Support prioritaire"],
    cta: "Contacter",
  },
];

function Pricing() {
  return (
    <section id="tarifs" className="py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div {...fade} className="text-center max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-3">Tarifs</p>
          <h2 className="text-4xl md:text-5xl">Une tarification simple, sans surprise.</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4 mt-14 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              {...fade}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className={`rounded-2xl border p-8 bg-white relative ${p.highlight ? "border-foreground shadow-xl" : "border-border"}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-2.5 py-1 rounded-full bg-cta text-cta-foreground font-semibold">
                  Populaire
                </span>
              )}
              <p className="text-sm text-muted-foreground">{p.name}</p>
              <p className="mt-2 text-4xl font-semibold">
                {p.price}
                <span className="text-base text-muted-foreground font-normal">/mois</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-foreground" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-8 inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-cta text-cta-foreground cta-glow"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    name: "Camille R.",
    role: "Designer indépendante",
    text: "FlowBudget AI a remplacé 3 outils. C'est limpide et beau.",
  },
  {
    name: "Yacine M.",
    role: "Consultant",
    text: "Les recommandations IA m'ont fait économiser 280 000 Ar le premier mois.",
  },
  {
    name: "Léa T.",
    role: "Étudiante",
    text: "Enfin une app finance qui ne ressemble pas à un tableur.",
  },
];

function Testimonials() {
  return (
    <section className="py-28 bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2 {...fade} className="text-4xl md:text-5xl max-w-2xl">
          Ils ont repris le contrôle.
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              {...fade}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="rounded-2xl border border-border p-7 bg-white"
            >
              <p className="text-base leading-relaxed">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="size-9 rounded-full bg-foreground text-background grid place-items-center text-sm font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Chiffrement TLS, isolement strict par utilisateur et politiques d'accès au niveau de la base de données.",
  },
  {
    q: "Puis-je essayer sans payer ?",
    a: "Bien sûr. Le plan Gratuit est complet pour démarrer, sans carte bancaire requise.",
  },
  {
    q: "L'IA est-elle vraiment utile ?",
    a: "Elle détecte vos tendances, anomalies de dépense et propose des optimisations concrètes chaque mois.",
  },
  {
    q: "Puis-je exporter mes données ?",
    a: "Oui, en CSV depuis vos paramètres. Vos données vous appartiennent.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-4xl px-6">
        <motion.h2 {...fade} className="text-4xl md:text-5xl text-center">
          Questions fréquentes
        </motion.h2>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group py-6">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium">{f.q}</span>
                <span className="size-6 grid place-items-center rounded-full border border-border text-muted-foreground group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32">
      <motion.div {...fade} className="mx-auto max-w-4xl px-6 text-center">
        <ShieldCheck className="size-10 mx-auto mb-6" />
        <h2 className="text-4xl md:text-6xl leading-[1.05]">
          Vos finances méritent
          <br />
          de la clarté.
        </h2>
        <p className="mt-6 text-muted-foreground max-w-xl mx-auto">
          Rejoignez FlowBudget AI et reprenez le contrôle en moins de 2 minutes.
        </p>
        <Link
          to="/auth"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-cta text-cta-foreground px-7 py-4 text-base font-semibold cta-glow hover:translate-y-[-1px] transition"
        >
          Commencer gratuitement <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FlowBudget AI. Tous droits réservés.
        </p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">
            Confidentialité
          </a>
          <a href="#" className="hover:text-foreground">
            Conditions
          </a>
          <a href="#" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <Preview />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
