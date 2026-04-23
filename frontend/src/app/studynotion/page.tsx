"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Code, GraduationCap, Users, Play, Star, ChevronRight, Zap, CheckCircle, BarChart2, ShieldCheck, CreditCard, Layout, Globe, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function StudyNotionPage() {
  const EXTERNAL_LINK = "https://study-notion-git-main-yashpawaras-projects.vercel.app/";

  const revealUp = {
    initial: { opacity: 0, y: 100 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  const maskReveal = {
    initial: { clipPath: "inset(100% 0% 0% 0%)" },
    whileInView: { clipPath: "inset(0% 0% 0% 0%)" },
    viewport: { once: true },
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-[#000814] text-[#F1F2FF] selection:bg-[#FFD60A] selection:text-[#000814] overflow-x-hidden">
      <Navbar />

      {/* ── FLOATING LAUNCH BUTTON ── */}
      <motion.a
        href={EXTERNAL_LINK}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 100 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 px-6 py-4 bg-[#FFD60A] text-[#000814] font-bold rounded-full shadow-[0_0_30px_rgba(255,214,10,0.3)] hover:shadow-[0_0_40px_rgba(255,214,10,0.5)] transition-all duration-300"
      >
        <span>Launch StudyNotion</span>
        <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      </motion.a>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161D29] border border-[#2C333F] text-[#999DAA] hover:text-[#FFD60A] hover:border-[#FFD60A]/50 transition-all duration-300 mb-8 group">
              <span className="text-sm font-medium">Become an Instructor & Start Selling</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <div className="overflow-hidden mb-8">
            <motion.h1 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-8xl font-black leading-[1.1] tracking-tighter"
            >
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FA2FF] via-[#12D8FA] to-[#A6FFCB] animate-gradient-x">
                Collaborative Learning
              </span>
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-3xl mx-auto text-[#838894] text-xl mb-12 leading-relaxed"
          >
            StudyNotion is a premier Ed-Tech ecosystem where <span className="text-white font-semibold">Learners</span> acquire industry-standard skills and <span className="text-[#FFD60A] font-semibold">Instructors</span> monetize their expertise.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="group relative px-8 py-4 bg-[#FFD60A] text-[#000814] font-bold rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,214,10,0.2)] transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">
                Visit StudyNotion Site <ArrowUpRight className="w-5 h-5" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </a>
          </motion.div>
        </div>

        {/* Video Section with Reveal */}
        <motion.div 
          variants={maskReveal}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mt-24 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-[#1FA2FF] to-[#A6FFCB] opacity-20 blur-3xl rounded-[2rem]" />
          <div className="relative aspect-video bg-[#000814] border border-[#2C333F] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/banner.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Optional tint overlay to make text pop if needed */}
            <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-overlay"></div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS SECTION with Staggered Reveal ── */}
      <section className="py-20 border-y border-[#161D29] bg-[#000814]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: "Active Students", value: "50K+" },
              { label: "Expert Instructors", value: "1.2K+" },
              { label: "Courses Published", value: "3.5K+" },
              { label: "Success Stories", value: "10K+" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD60A] to-[#FFAA0A] mb-2">{stat.value}</div>
                <div className="text-[#838894] text-xs font-bold uppercase tracking-[0.3em]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DUAL ECOSYSTEM SECTION ── */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={revealUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">
              One Platform, <br />
              <span className="text-[#1FA2FF]">Two Journeys</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#1FA2FF] to-[#A6FFCB] mx-auto rounded-full mb-8" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* LEARNER JOURNEY with Slide Reveal */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="group relative p-12 bg-[#161D29]/40 backdrop-blur-sm rounded-[3rem] border border-[#2C333F] hover:border-[#1FA2FF]/50 transition-colors overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#1FA2FF]/20 rounded-2xl flex items-center justify-center text-[#1FA2FF] mb-8 group-hover:rotate-12 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-bold mb-6">The Learner Experience</h3>
                <p className="text-[#838894] mb-10 text-lg leading-relaxed">
                  Access a global marketplace of premium courses. Buy once, own forever, and learn from industry veterans.
                </p>
                <motion.a 
                  href={EXTERNAL_LINK}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1FA2FF] text-[#000814] font-bold hover:gap-4 transition-all"
                >
                  Start Learning <ArrowRight className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>

            {/* INSTRUCTOR JOURNEY with Slide Reveal */}
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="group relative p-12 bg-[#161D29]/40 backdrop-blur-sm rounded-[3rem] border border-[#2C333F] hover:border-[#FFD60A]/50 transition-colors overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#FFD60A]/20 rounded-2xl flex items-center justify-center text-[#FFD60A] mb-8 group-hover:-rotate-12 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-bold mb-6 text-[#FFD60A]">The Instructor Engine</h3>
                <p className="text-[#838894] mb-10 text-lg leading-relaxed">
                  Turn your expertise into a sustainable income. Create complex courses and manage your students.
                </p>
                <motion.a 
                  href={EXTERNAL_LINK}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFD60A] text-[#000814] font-bold hover:gap-4 transition-all"
                >
                  Start Selling <ArrowRight className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID with 3D Perspective Reveal ── */}
      <section className="py-32 px-6 bg-[#000814]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={revealUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-3xl md:text-5xl font-bold">Platform Powerhouse</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Instructor Dashboard", desc: "Manage courses and track student enrollment with real-time insights.", icon: <Users className="w-8 h-8 text-[#FFD60A]" /> },
              { title: "Razorpay Integration", desc: "Secure and seamless payment processing for course purchases.", icon: <Zap className="w-8 h-8 text-[#1FA2FF]" /> },
              { title: "Media Management", desc: "High-quality video hosting powered by Cloudinary.", icon: <Play className="w-8 h-8 text-[#EF476F]" /> },
              { title: "Course Progress", desc: "Dynamic tracking of student progress and course completion.", icon: <ChevronRight className="w-8 h-8 text-[#06D6A0]" /> },
              { title: "Ratings & Reviews", desc: "Transparent feedback system for students to share experiences.", icon: <Star className="w-8 h-8 text-[#FFD60A]" /> },
              { title: "Secure Auth", desc: "JWT-based authentication with OTP verification for safety.", icon: <ShieldCheck className="w-8 h-8 text-[#1FA2FF]" /> },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, rotateY: 30, z: -100 }}
                whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="p-10 bg-[#161D29]/50 backdrop-blur-sm border border-[#2C333F] rounded-[2.5rem] hover:bg-[#1C222D] hover:border-[#1FA2FF]/30 transition-all duration-500 group"
                style={{ perspective: "1000px" }}
              >
                <div className="mb-6 p-4 w-fit bg-[#000814] rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-xl">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-[#838894] text-base leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CALL TO ACTION with Zoom Reveal ── */}
      <section className="py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="max-w-5xl mx-auto p-20 rounded-[4rem] bg-gradient-to-br from-[#1FA2FF] to-[#A6FFCB] text-[#000814] text-center relative overflow-hidden shadow-[0_40px_100px_rgba(31,162,255,0.3)]"
        >
          <div className="relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Join the Revolution.</h2>
            <p className="text-[#000814]/70 text-2xl mb-12 max-w-2xl mx-auto font-medium">
              Experience the next generation of Ed-Tech.
            </p>
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="px-12 py-6 bg-[#000814] text-white font-black text-xl rounded-2xl hover:scale-110 hover:rotate-2 transition-all duration-300 shadow-2xl flex items-center gap-4 mx-auto w-fit">
              Get Started Now <ArrowUpRight className="w-8 h-8" />
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="py-12 border-t border-[#161D29] text-center text-[#838894] text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 StudyNotion Ecosystem. Powered by TalentIQ Architecture.</p>
        </div>
      </footer>
    </div>
  );
}
