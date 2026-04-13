"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Code, GraduationCap, Users, Play, Star, ChevronRight, Zap, CheckCircle, BarChart2 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function StudyNotionPage() {
  const EXTERNAL_LINK = "https://study-notion-git-main-yashpawaras-projects.vercel.app/";

  return (
    <div style={{ background: "#000814", minHeight: "100vh", color: "#F1F2FF", fontFamily: "Inter, sans-serif" }}>
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#000814] rounded-full blur-[120px] opacity-50" style={{ background: "radial-gradient(circle, #118ab2 0%, transparent 70%)" }} />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#000814] rounded-full blur-[120px] opacity-30" style={{ background: "radial-gradient(circle, #ffd60a 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161D29] border border-[#2C333F] text-[#999DAA] hover:scale-95 transition-all duration-200 mb-8">
            <span className="text-sm font-medium">Become an Instructor</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Empower Your Future with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1FA2FF] via-[#12D8FA] to-[#A6FFCB]">
              Coding Skills
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-[#838894] text-lg mb-10 leading-relaxed">
            With our online coding courses, you can learn at your own pace, from anywhere in the world, and get access to a wealth of resources, including hands-on projects, quizzes, and personalized feedback from instructors.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-[#FFD60A] text-[#000814] font-bold rounded-lg hover:scale-95 transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.18)]">
              Learn More
            </a>
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-[#161D29] text-white font-bold rounded-lg hover:scale-95 transition-all duration-200 border-b-2 border-r-2 border-[#2C333F]">
              Book a Demo
            </a>
          </div>
        </div>

        {/* Video Placeholder Section */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#1FA2FF] to-[#A6FFCB] opacity-20 blur-2xl rounded-3xl" />
          <div className="relative aspect-video bg-[#000814] border border-[#2C333F] rounded-xl overflow-hidden shadow-2xl flex items-center justify-center group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
            {/* Visual representation of code */}
            <div className="absolute inset-0 opacity-10 pointer-events-none font-mono text-xs p-8">
              {`import React from 'react';\nfunction StudyNotion() {\n  return (\n    <div>Learning coding is fun!</div>\n  );\n}`}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT SECTION (What is StudyNotion?) ── */}
      <section className="py-24 px-6 bg-[#000814]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                What is <span className="text-[#1FA2FF]">StudyNotion?</span>
              </h2>
              <p className="text-[#838894] text-lg leading-relaxed">
                StudyNotion is a fully functional Ed-Tech platform that enables users to create, consume, and rate educational content. The platform is built using the MERN stack, which includes MongoDB, ExpressJS, ReactJS, and NodeJS.
              </p>
              <p className="text-[#838894] leading-relaxed">
                It aims to provide a seamless interactive experience for students and a powerful content management system for instructors, making quality education accessible to everyone.
              </p>
              <div className="flex gap-4">
                <CheckCircle className="text-[#06D6A0] w-6 h-6 flex-shrink-0" />
                <span className="text-[#F1F2FF]">Comprehensive Course Management</span>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="text-[#06D6A0] w-6 h-6 flex-shrink-0" />
                <span className="text-[#F1F2FF]">Interactive Learning Environment</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-[#ffd60a] to-[#1FA2FF] opacity-10 blur-xl rounded-2xl" />
              <div className="relative p-8 bg-[#161D29] border border-[#2C333F] rounded-2xl">
                <h3 className="text-2xl font-bold mb-6 text-[#FFD60A]">Platform Pillars</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#000814] rounded-lg text-[#1FA2FF]"><BookOpen className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-bold">Education First</h4>
                      <p className="text-sm text-[#838894]">Prioritizing deep learning over surface-level content.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-[#000814] rounded-lg text-[#EF476F]"><Users className="w-5 h-5" /></div>
                    <div>
                      <h4 className="font-bold">Community Driven</h4>
                      <p className="text-sm text-[#838894]">A thriving ecosystem of students and expert mentors.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUPPORT & TECH SECTION (What it supports) ── */}
      <section className="py-24 px-6 bg-[#000814] border-t border-[#161D29]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">What <span className="text-[#1FA2FF]">StudyNotion Supports</span></h2>
            <p className="text-[#838894] max-w-2xl mx-auto">A robust technology stack and feature set designed for modern digital education.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Instructor Dashboard", desc: "Manage courses, track student enrollment, and monitor earnings with real-time insights.", icon: <Users className="w-8 h-8 text-[#FFD60A]" /> },
              { title: "Razorpay Integration", desc: "Secure and seamless payment processing for course purchases with instant access.", icon: <Zap className="w-8 h-8 text-[#1FA2FF]" /> },
              { title: "Media Management", desc: "High-quality video hosting and image management powered by Cloudinary for fast delivery.", icon: <Play className="w-8 h-8 text-[#EF476F]" /> },
              { title: "Course Progress", desc: "Dynamic tracking of student progress, allowing learners to pick up exactly where they left off.", icon: <ChevronRight className="w-8 h-8 text-[#06D6A0]" /> },
              { title: "Ratings & Reviews", desc: "Transparent feedback system for students to share their learning experiences and rate content.", icon: <Star className="w-8 h-8 text-[#FFD60A]" /> },
              { title: "Authentication", desc: "Secure JWT-based authentication with OTP verification for a safe and reliable user experience.", icon: <CheckCircle className="w-8 h-8 text-[#1FA2FF]" /> },
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-[#161D29] border border-[#2C333F] rounded-2xl hover:bg-[#1C222D] transition-all duration-300">
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#838894] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT'S USED SECTION ── */}
      <section className="py-24 px-6 bg-[#F9F9F9] text-[#2C333F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-bold">How to use <span className="text-[#1FA2FF]">StudyNotion?</span></h2>
            <p className="text-[#838894]">Two tailored experiences for learners and educators.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Student Flow */}
            <div className="p-10 bg-white rounded-3xl shadow-xl border border-gray-100">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl"><GraduationCap className="text-[#1FA2FF]" /></div>
                For Students
              </h3>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Sign Up & Verify", desc: "Create your account and verify your email via OTP." },
                  { step: "02", title: "Browse Courses", desc: "Explore our vast library of coding and tech courses." },
                  { step: "03", title: "Enroll & Pay", desc: "Securely purchase courses via Razorpay integration." },
                  { step: "04", title: "Learn & Track", desc: "Watch videos, solve quizzes, and track your progress." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-3xl font-black text-gray-100">{s.step}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{s.title}</h4>
                      <p className="text-gray-500 text-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor Flow */}
            <div className="p-10 bg-[#161D29] text-white rounded-3xl shadow-2xl border border-[#2C333F]">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-[#FFD60A]">
                <div className="p-3 bg-white/5 rounded-xl"><Users /></div>
                For Instructors
              </h3>
              <div className="space-y-8">
                {[
                  { step: "01", title: "Instructor Sign Up", desc: "Register as an instructor and set up your professional profile." },
                  { step: "02", title: "Create Content", desc: "Upload videos, create sections, and add course descriptions." },
                  { step: "03", title: "Publish & Earn", desc: "Set pricing and publish your courses to the marketplace." },
                  { step: "04", title: "Manage Dashboard", desc: "View enrollment stats and manage your educational content." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-3xl font-black text-white/5">{s.step}</div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{s.title}</h4>
                      <p className="text-[#838894] text-sm">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER PROMO ── */}
      <section className="py-24 px-6 bg-[#000814] border-t border-[#2C333F]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to start your <span className="text-[#FFD60A]">coding journey?</span></h2>
          <p className="text-[#838894]">Join thousands of students learning to code and building amazing projects every day on StudyNotion.</p>
          <div className="flex justify-center gap-6">
            <a href={EXTERNAL_LINK} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-[#FFD60A] text-[#000814] font-bold rounded-lg hover:scale-95 transition-all duration-200">
              Explore Courses
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
