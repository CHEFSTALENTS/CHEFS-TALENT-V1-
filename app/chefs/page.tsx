'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

export default function ChefsPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', background: '', destinations: '' });
  const [sent, setSent] = useState(false);

  const faqs = [
    { q: "Do I need private residence experience?", a: "Not necessarily. If you have 5-star hotel or high-end restaurant background, we have an integration programme to get you mission-ready. If you already have private residence experience, you can apply directly." },
    { q: "How quickly can I get my first mission?", a: "After validation, most chefs receive their first mission within 2-4 weeks depending on destination and availability." },
    { q: "What destinations do you cover?", a: "Ibiza, Saint-Tropez, Monaco, Mykonos, Courchevel, Sardinia, Cap Ferrat and 50+ destinations across Europe." },
    { q: "Is this a job board?", a: "No. Chefs Talents is a curated network — not an open marketplace. Every chef is reviewed individually before being accepted." },
  ];

  return (
    <div className="bg-[#f4efe8] min-h-screen text-[#161616]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#f4efe8]/90 backdrop-blur-sm border-b border-[#d8d1c7]">
        <Link href="/" style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-sm tracking-[0.3em] uppercase text-[#161616]">
          Chefs Talents
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/chef/login" className="text-xs tracking-[0.15em] uppercase text-[#8a7f73] hover:text-[#161616] transition">
            Member login
          </Link>
          <Link href="/chef/signup" className="inline-flex items-center gap-2 bg-[#161616] text-white text-xs tracking-[0.15em] uppercase px-5 py-2.5 rounded-full hover:bg-black transition">
            Join the network
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-6">Chefs Talents — Professional Network</p>
        <h1 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-[3.5rem] md:text-[5.5rem] leading-[0.95] font-bold text-[#161616] max-w-4xl mb-8">
          PRIVATE CHEF<br />NETWORK FOR<br /><em className="font-normal italic">Europe's finest</em><br />VILLAS & YACHTS
        </h1>
        <p className="text-lg text-[#59544d] font-light max-w-xl leading-8 mb-12">
          We place selected private chefs in luxury villas, yachts and private residences across Europe. Ibiza, Saint-Tropez, Monaco, Mykonos and beyond.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/chef/signup" className="inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-sm tracking-[0.15em] uppercase px-8 py-4 rounded-full hover:bg-black transition">
            I have private experience <ArrowUpRight className="w-4 h-4" />
          </Link>
          <a href="#new-to-private" className="inline-flex items-center justify-center gap-2 border border-[#d8d1c7] text-[#161616] text-sm tracking-[0.15em] uppercase px-8 py-4 rounded-full hover:bg-white transition">
            New to private service
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#161616] px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { v: "400+", l: "Chefs in network" },
            { v: "50+", l: "Destinations" },
            { v: "400+", l: "Missions placed" },
            { v: "< 6h", l: "Response to clients" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-5xl text-white font-bold">{s.v}</p>
              <p className="text-xs tracking-[0.2em] uppercase text-[#8a7f73] mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-7xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">How to join</p>
        <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl md:text-5xl font-bold text-[#161616] mb-16">Two paths into<br /><em className="font-normal italic">the network</em></h2>
        <div className="grid md:grid-cols-2 gap-6">

          {/* Path 1 */}
          <div className="bg-white border border-[#d8d1c7] rounded-3xl p-8 md:p-10 flex flex-col">
            <div className="inline-block bg-[#161616] text-white text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full mb-6 self-start">
              Private experience
            </div>
            <h3 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl font-bold mb-4">Direct<br /><em className="font-normal italic">application</em></h3>
            <p className="text-sm text-[#59544d] leading-7 mb-8">
              You have private residence, villa or yacht experience. Apply directly — our team reviews your profile within 48 hours.
            </p>
            <ul className="space-y-3 mb-10">
              {["Private villa or yacht experience", "Autonomous kitchen management", "UHNW client experience", "Discretion & confidentiality"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#59544d]">
                  <Check className="w-4 h-4 text-[#B08D57] shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/chef/signup" className="mt-auto inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-xs tracking-[0.2em] uppercase px-6 py-4 rounded-full hover:bg-black transition">
              Apply now <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Path 2 */}
          <div id="new-to-private" className="bg-[#161616] rounded-3xl p-8 md:p-10 flex flex-col">
            <div className="inline-block bg-[#B08D57] text-white text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full mb-6 self-start">
              Hotel · Restaurant background
            </div>
            <h3 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl font-bold text-white mb-4">Integration<br /><em className="font-normal italic">programme</em></h3>
            <p className="text-sm text-[#a09890] leading-7 mb-8">
              You come from 5-star hotels or fine dining and want to transition into private residences. We have a dedicated programme to get you placed this summer.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                "Tailored for hotel & restaurant chefs",
                "Private villa kitchen management",
                "Working with UHNW clients",
                "Market runs & meal planning",
                "Direct entry into active roster after completion",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#a09890]">
                  <Check className="w-4 h-4 text-[#B08D57] shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <a href="#contact-form" className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-[#161616] text-xs tracking-[0.2em] uppercase px-6 py-4 rounded-full hover:bg-[#f4efe8] transition">
              Find out more <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="bg-white px-6 md:px-16 lg:px-24 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">Where we operate</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl md:text-5xl font-bold text-[#161616] mb-12">Summer 2025<br /><em className="font-normal italic">active destinations</em></h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: "Ibiza", flag: "🇪🇸", status: "High demand" },
              { name: "Saint-Tropez", flag: "🇫🇷", status: "High demand" },
              { name: "Monaco", flag: "🇲🇨", status: "Active" },
              { name: "Mykonos", flag: "🇬🇷", status: "High demand" },
              { name: "Courchevel", flag: "🇫🇷", status: "Active" },
              { name: "Sardinia", flag: "🇮🇹", status: "Active" },
              { name: "Cap Ferrat", flag: "🇫🇷", status: "Active" },
              { name: "Cannes", flag: "🇫🇷", status: "Active" },
            ].map((d, i) => (
              <div key={i} className="border border-[#d8d1c7] rounded-2xl p-4">
                <p className="text-2xl mb-2">{d.flag}</p>
                <p className="text-sm font-medium text-[#161616]">{d.name}</p>
                <p className={`text-[10px] tracking-[0.15em] uppercase mt-1 ${d.status === 'High demand' ? 'text-[#B08D57]' : 'text-[#8a7f73]'}`}>{d.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM — New to private */}
      <section id="contact-form" className="px-6 md:px-16 lg:px-24 py-24 max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">Integration programme</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl font-bold text-[#161616] mb-4">
            Transitioning into<br /><em className="font-normal italic">private service?</em>
          </h2>
          <p className="text-sm text-[#59544d] leading-7 mb-10">
            Tell us about your background. We'll come back to you within 24 hours to explain how we can get you placed this summer.
          </p>
          {sent ? (
            <div className="bg-[#161616] rounded-3xl p-10 text-center">
              <p style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl text-white font-bold mb-3">Message received.</p>
              <p className="text-sm text-[#8a7f73]">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input required type="text" placeholder="Full name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
                <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              </div>
              <input type="text" placeholder="Your background — 5-star hotel, Michelin, restaurant..." value={form.background} onChange={e => setForm({...form, background: e.target.value})}
                className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              <input type="text" placeholder="Preferred destinations this summer" value={form.destinations} onChange={e => setForm({...form, destinations: e.target.value})}
                className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              <button type="submit" className="inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-black transition w-full sm:w-auto">
                Send my details <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-6 md:px-16 lg:px-24 py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">FAQ</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl font-bold text-[#161616] mb-12">Questions from<br /><em className="font-normal italic">chefs like you</em></h2>
          <div className="border-t border-[#d8d1c7]">
            {faqs.map((f, i) => (
              <div key={i} className="border-b border-[#d8d1c7]">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left">
                  <span className="text-base font-medium text-[#161616] pr-8">{f.q}</span>
                  <span className={`text-2xl text-[#8a7f73] transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {open === i && <p className="text-sm text-[#59544d] leading-7 pb-6">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#161616] px-6 md:px-16 lg:px-24 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-6">Ready?</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-5xl font-bold text-white mb-6">
            JOIN THE NETWORK.<br /><em className="font-normal italic">Start this summer.</em>
          </h2>
          <p className="text-sm text-[#8a7f73] leading-7 mb-12">
            Missions are coming in for Ibiza, Saint-Tropez and Mykonos.<br />The best profiles get placed first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chef/signup" className="inline-flex items-center justify-center gap-2 bg-white text-[#161616] text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-[#f4efe8] transition">
              Apply — private experience <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a href="#contact-form" className="inline-flex items-center justify-center gap-2 border border-[#2a2a2a] text-white text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-white/5 transition">
              New to private service
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
