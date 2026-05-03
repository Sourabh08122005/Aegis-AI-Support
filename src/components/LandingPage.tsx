import { motion } from 'motion/react';
import { Shield, Lock, Activity, Zap, MessageSquare, BarChart3, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { signIn } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider"
        >
          <Shield className="w-3.5 h-3.5" />
          Secure AI Support Infrastructure
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900"
        >
          Intelligent Support, <br />
          <span className="text-indigo-600">Guarded by Safety.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
        >
          Aegis AI provides context-aware customer support with integrated safety guards, 
          RAG-enhanced knowledge retrieval, and real-time observability.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg rounded-xl" onClick={signIn}>
            Get Started <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl border-slate-200">
            View Documentation
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: Lock,
            title: "Safety Guard",
            description: "Advanced input/output moderation filters toxicity and harmful intent in real-time.",
            color: "text-red-600",
            bg: "bg-red-50"
          },
          {
            icon: Activity,
            title: "Observability",
            description: "Full transparency into AI decisions, latency metrics, and safety score tracking.",
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            icon: Zap,
            title: "Context Aware",
            description: "Retrieval Augmented Generation (RAG) ensures answers are accurate and specialized.",
            color: "text-amber-600",
            bg: "bg-amber-50"
          }
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-3xl bg-white border border-slate-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <feature.icon className={`w-6 h-6 ${feature.color}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
