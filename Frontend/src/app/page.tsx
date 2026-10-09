"use client";
import { Suspense, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { InteractiveGlobe } from "@/components/3d/Globe";
import { YoloScanner } from "@/components/3d/Scanner";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Activity,
  MapPin,
  BarChart3,
  Users,
  Shield,
  Zap,
  Globe2,
  ScanLine,
  Leaf,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";

/* ─── Animated counter ─── */
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <span ref={ref} className="tabular-nums">
      {inView ? value.toLocaleString() : "0"}
      {suffix}
    </span>
  );
}

/* ─── Section fade-in wrapper ─── */
function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right";
}) {
  const yOffset = direction === "up" ? 40 : 0;
  const xOffset = direction === "left" ? -40 : direction === "right" ? 40 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Theme toggle ─── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 block dark:hidden" />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const globeY = useTransform(scrollY, [0, 1000], [0, 150]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-50 overflow-x-hidden selection:bg-emerald-500/30 transition-colors duration-500">
      {/* ───── Floating Navbar ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-7xl flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-lg shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Plastic<span className="text-emerald-600 dark:text-emerald-400">Sense</span> AI
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-emerald-500 after:transition-all hover:after:w-full">Features</a>
            <a href="#technology" className="hover:text-slate-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-emerald-500 after:transition-all hover:after:w-full">Technology</a>
            <a href="#impact" className="hover:text-slate-900 dark:hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-emerald-500 after:transition-all hover:after:w-full">Impact</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 px-5 py-2.5 text-sm font-semibold transition-all hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] active:scale-95"
            >
              <span className="hidden sm:inline">Launch App</span>
              <span className="inline sm:hidden">Launch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[150px]" 
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left – Copy */}
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold tracking-wide shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              AI Environmental Intelligence Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8"
            >
              <span className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-500 dark:from-emerald-400 dark:via-cyan-400 dark:to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
                See the Unseen.
              </span>
              <br />
              <span className="text-slate-800 dark:text-slate-50 drop-shadow-sm">Clean the Unclean.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl leading-relaxed font-medium"
            >
              Empowering communities and organizations with AI-driven waste
              detection. Track, analyze, and eliminate pollution hotspots
              globally in real-time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/dashboard"
                className="group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 dark:from-emerald-500 dark:to-cyan-500 dark:hover:from-emerald-400 dark:hover:to-cyan-400 text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/map"
                className="flex items-center gap-2.5 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white px-8 py-4 rounded-2xl font-bold text-base transition-all border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <Globe2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Live Hotspot Map
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="mt-14 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" /> Open Source
              </span>
              <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Real-time AI
              </span>
              <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" /> Community Driven
              </span>
            </motion.div>
          </motion.div>

          {/* Right – 3D Globe */}
          <motion.div
            style={{ y: globeY }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[500px] lg:h-[650px] xl:h-[700px] w-full cursor-grab active:cursor-grabbing flex items-center justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[800px] aspect-square">
              <Canvas
                camera={{ position: [-0.5, 0, 5.5], fov: 45 }}
                dpr={[1, 2]}
                gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
                className="w-full h-full"
              >
                <Suspense fallback={null}>
                  <InteractiveGlobe />
                  <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={(2 * Math.PI) / 3}
                  />
                </Suspense>
              </Canvas>
              {/* Soft vignette – gently fades the extreme edges into the background */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_65%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(2,6,23,0)_65%,#020617_100%)] transition-colors duration-500" />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: heroOpacity }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-semibold tracking-widest uppercase"
        >
          <span>Scroll to explore</span>
          <ChevronRight className="w-4 h-4 rotate-90 opacity-50" />
        </motion.div>
      </section>

      {/* ───── FEATURES BENTO GRID ───── */}
      <section id="features" className="relative py-32 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm tracking-widest uppercase mb-4">
              Platform Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                fight pollution
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              A comprehensive platform combining AI computer vision, geospatial
              analytics, and community coordination to make environmental
              cleanup measurably impactful.
            </p>
          </FadeIn>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: ScanLine,
                title: "AI Waste Detection",
                desc: "YOLOv11 model trained on TACO dataset detects dozens of waste categories instantly from images or live feeds.",
                gradient: "from-emerald-500/10 dark:from-emerald-500/20 to-emerald-500/0 dark:to-emerald-500/5",
                iconBg: "bg-emerald-100 dark:bg-slate-800/80",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                span: "lg:col-span-2",
              },
              {
                icon: Globe2,
                title: "Interactive Mapping",
                desc: "React-Leaflet heatmaps and cluster markers to visualize pollution hotspots globally.",
                gradient: "from-cyan-500/10 dark:from-cyan-500/20 to-cyan-500/0 dark:to-cyan-500/5",
                iconBg: "bg-cyan-100 dark:bg-slate-800/80",
                iconColor: "text-cyan-600 dark:text-cyan-400",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Track cleanup performance, waste distribution, and environmental trends over time with rich Recharts visualizations.",
                gradient: "from-violet-500/10 dark:from-violet-500/20 to-violet-500/0 dark:to-violet-500/5",
                iconBg: "bg-violet-100 dark:bg-slate-800/80",
                iconColor: "text-violet-600 dark:text-violet-400",
              },
              {
                icon: Users,
                title: "Team Coordination",
                desc: "Assign, track, and manage cleanup operations for volunteer teams and environmental organizations.",
                gradient: "from-amber-500/10 dark:from-amber-500/20 to-amber-500/0 dark:to-amber-500/5",
                iconBg: "bg-amber-100 dark:bg-slate-800/80",
                iconColor: "text-amber-600 dark:text-amber-400",
              },
              {
                icon: Activity,
                title: "Real-time Processing",
                desc: "FastAPI backend with native YOLO inference, image caching, and seamless data pipelines.",
                gradient: "from-rose-500/10 dark:from-rose-500/20 to-rose-500/0 dark:to-rose-500/5",
                iconBg: "bg-rose-100 dark:bg-slate-800/80",
                iconColor: "text-rose-600 dark:text-rose-400",
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.1} className={feature.span || ""}>
                <div
                  className={`group relative h-full rounded-3xl border border-slate-200 dark:border-slate-800/60 bg-gradient-to-br ${feature.gradient} p-8 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 ${feature.iconColor}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="py-32 px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-sm tracking-widest uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Three steps to a{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                cleaner world
              </span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Capture & Upload",
                desc: "Users or stationary cameras capture images of polluted areas. Upload them through the dashboard or integrate via API.",
                color: "text-emerald-600 dark:text-emerald-400",
                border: "border-emerald-500/20",
                bg: "bg-emerald-50/50 dark:bg-slate-900/40",
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "PlasticSense AI instantly processes the image, categorizing and counting every piece of waste with bounding-box evidence.",
                color: "text-cyan-600 dark:text-cyan-400",
                border: "border-cyan-500/20",
                bg: "bg-cyan-50/50 dark:bg-slate-900/40",
              },
              {
                step: "03",
                title: "Map & Act",
                desc: "Detection data populates the global heatmap, automatically generating cleanup tasks for volunteers in the area.",
                color: "text-blue-600 dark:text-blue-400",
                border: "border-blue-500/20",
                bg: "bg-blue-50/50 dark:bg-slate-900/40",
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.15}>
                <div className={`relative rounded-3xl border ${item.border} ${item.bg} p-8 h-full`}>
                  <span className={`text-6xl font-black ${item.color} opacity-10 dark:opacity-20 absolute top-6 right-8`}>
                    {item.step}
                  </span>
                  <div className={`text-sm font-semibold ${item.color} mb-4`}>Step {item.step}</div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── TECHNOLOGY / YOLO SCANNER ───── */}
      <section id="technology" className="py-32 px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 3D Scanner */}
          <FadeIn>
            <div className="relative h-[520px] rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 overflow-hidden group">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-100/40 dark:from-cyan-900/15 via-slate-100 dark:via-slate-950 to-slate-100 dark:to-slate-950 transition-all duration-700 group-hover:from-emerald-100/50 dark:group-hover:from-emerald-900/20" />
              {/* Grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <Canvas camera={{ position: [3, 1, 5], fov: 40 }} dpr={[1, 2]} className="z-10">
                <Suspense fallback={null}>
                  <YoloScanner />
                  <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
                </Suspense>
              </Canvas>
            </div>
          </FadeIn>

          {/* Text content */}
          <FadeIn delay={0.2}>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm tracking-widest uppercase mb-4">
              Core Technology
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              State-of-the-Art{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
                YOLOv11
              </span>{" "}
              Detection
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
              Powered by the latest Ultralytics models and trained on the TACO
              dataset, PlasticSense AI instantly categorizes dozens of waste
              types — plastics, metals, glass, bio-waste, and more — with
              industry-leading accuracy.
            </p>
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Inference</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Process live camera feeds or batch images instantly through
                    our robust FastAPI backend with native YOLO support.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Geospatial Tagging</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Every detection is automatically tagged with GPS coordinates,
                    clustered by density, and pushed to the global heatmap.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ───── IMPACT METRICS ───── */}
      <section id="impact" className="py-32 px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-amber-600 dark:text-amber-400 font-semibold text-sm tracking-widest uppercase mb-4">
              Measurable Impact
            </p>
            <h2 className="text-4xl md:text-5xl font-bold">
              Numbers that{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                speak volumes
              </span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 450000, suffix: "+", label: "Waste Items Detected", color: "text-emerald-600 dark:text-emerald-400" },
              { value: 120, suffix: "+", label: "Hotspots Identified", color: "text-cyan-600 dark:text-cyan-400" },
              { value: 5000, suffix: "+", label: "Volunteer Hours", color: "text-amber-600 dark:text-amber-400" },
              { value: 32, suffix: "", label: "Cleanups Coordinated", color: "text-violet-600 dark:text-violet-400" },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 p-8 text-center hover:border-slate-300 dark:hover:border-slate-700/60 transition-colors hover:shadow-md dark:hover:shadow-none">
                  <div className={`text-4xl md:text-5xl font-bold mb-3 ${stat.color}`}>
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="py-32 px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/40">
        <FadeIn className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to make a{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
              measurable impact
            </span>
            ?
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl mx-auto">
            Join the growing community of environmental heroes using AI to clean
            up our planet — one detection at a time.
          </p>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white dark:text-slate-950 px-10 py-5 rounded-2xl font-semibold text-lg transition-all shadow-[0_0_60px_-12px_rgba(16,185,129,0.5)]"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeIn>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/40 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white dark:text-slate-950" />
            </div>
            <span>PlasticSense AI &copy; 2026</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">Dashboard</Link>
            <Link href="/map" className="hover:text-slate-900 dark:hover:text-white transition-colors">Map</Link>
            <Link href="/analytics" className="hover:text-slate-900 dark:hover:text-white transition-colors">Analytics</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
