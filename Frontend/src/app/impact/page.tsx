'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Recycle,
  Package,
  CheckCircle,
  Flame,
  Building2,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { cn } from '@/lib/utils';

// Impact metrics
const impactMetrics = [
  { id: 'detected', label: 'Plastic Objects Detected', value: '12,842', icon: Recycle, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'removed', label: 'Estimated Waste Removed', value: '4,320 kg', icon: Package, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'cleanups', label: 'Cleanups Completed', value: '186', icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'hotspots', label: 'Hotspots Resolved', value: '74', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'ngos', label: 'NGO Teams Active', value: '28', icon: Building2, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'verification', label: 'Cleanup Verification Rate', value: '92%', icon: ShieldCheck, color: 'text-primary', bg: 'bg-primary/10' },
];

// Monthly progress data
const monthlyProgress = [
  { month: 'Mar', detections: 420, cleanups: 12, waste: 280 },
  { month: 'Apr', detections: 680, cleanups: 18, waste: 450 },
  { month: 'May', detections: 950, cleanups: 24, waste: 620 },
  { month: 'Jun', detections: 1240, cleanups: 32, waste: 780 },
  { month: 'Jul', detections: 1850, cleanups: 42, waste: 920 },
  { month: 'Aug', detections: 2100, cleanups: 58, waste: 1270 },
];

// Cleanup impact by category
const categoryImpact = [
  { category: 'PET Bottles', collected: 3842, percentage: 30 },
  { category: 'Plastic Bags', collected: 2856, percentage: 22 },
  { category: 'Food Packaging', collected: 2184, percentage: 17 },
  { category: 'Plastic Films', collected: 1548, percentage: 12 },
  { category: 'Cups/Containers', collected: 1284, percentage: 10 },
  { category: 'Other Plastic', collected: 1128, percentage: 9 },
];

export default function ImpactPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="size-7 text-primary" />
          Environmental Impact
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Measurable impact created by PlasticSense AI and NGO partner operations.
        </p>
      </div>

      {/* Hero message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 text-center bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5"
      >
        <p className="text-lg font-semibold text-foreground">
          PlasticSense AI has helped remove an estimated <span className="text-primary">4,320 kg</span> of waste across <span className="text-primary">186 cleanups</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Detecting pollution, locating hotspots, and coordinating NGO cleanups — from image to impact.
        </p>
      </motion.div>

      {/* Impact Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {impactMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="glass rounded-2xl p-4 text-center space-y-2"
            >
              <div className={cn('flex size-10 items-center justify-center rounded-xl mx-auto', metric.bg)}>
                <Icon className={cn('size-5', metric.color)} />
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{metric.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyProgress}>
              <defs>
                <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="detections" stroke="#06b6d4" fill="url(#colorDetections)" strokeWidth={2} name="Objects Detected" />
              <Area type="monotone" dataKey="waste" stroke="#10b981" fill="url(#colorWaste)" strokeWidth={2} name="Waste Removed (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Waste Collected by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryImpact} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="collected" fill="#16A34A" radius={[0, 6, 6, 0]} name="Items Collected" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6 text-center space-y-3"
      >
        <Target className="size-8 text-primary mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">Impact Report</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Generate a comprehensive impact report to share with government organizations, CSR partners, donors, and environmental organizations.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Generate PDF Report
          </button>
          <button className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            Export Data
          </button>
        </div>
      </motion.div>
    </div>
  );
}
