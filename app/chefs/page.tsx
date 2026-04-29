'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';

type Lang = 'en' | 'fr' | 'es';

const T = {
  en: {
    nav_login: 'Member login',
    nav_join: 'Join the network',
    tag_hero: 'Chefs Talents — Professional Network',
    h1a: 'PRIVATE CHEF', h1b: 'NETWORK FOR', h1c: "Europe's finest", h1d: 'VILLAS & YACHTS',
    hero_sub: 'We place selected private chefs in luxury villas, yachts and private residences across Europe. Ibiza, Saint-Tropez, Monaco, Mykonos and beyond.',
    cta_exp: 'I have private experience',
    cta_new: 'New to private service',
    stats: [{ v: '400+', l: 'Chefs in network' }, { v: '50+', l: 'Destinations' }, { v: '400+', l: 'Missions placed' }, { v: '< 6h', l: 'Response to clients' }],
    paths_tag: 'How to join',
    paths_title: 'Two paths into', paths_title_em: 'the network',
    p1_badge: 'Private experience', p1_title: 'Direct', p1_title_em: 'application',
    p1_sub: 'You have private residence, villa or yacht experience. Apply directly — our team reviews your profile within 48 hours.',
    p1_items: ['Private villa or yacht experience', 'Autonomous kitchen management', 'UHNW client experience', 'Discretion & confidentiality'],
    p1_cta: 'Apply now',
    p2_badge: 'Hotel · Restaurant background', p2_title: 'Integration', p2_title_em: 'programme',
    p2_sub: 'You come from 5-star hotels or fine dining and want to transition into private residences. We have a dedicated programme to get you placed this summer.',
    p2_items: ['Tailored for hotel & restaurant chefs', 'Private villa kitchen management', 'Working with UHNW clients', 'Market runs & meal planning', 'Direct entry into active roster after completion'],
    p2_cta: 'Find out more',
    dest_tag: 'Where we operate', dest_title: 'Summer 2026', dest_title_em: 'active destinations',
    dest_list: [
      { name: 'Ibiza', flag: '🇪🇸', status: 'High demand' }, { name: 'Saint-Tropez', flag: '🇫🇷', status: 'High demand' },
      { name: 'Monaco', flag: '🇲🇨', status: 'Active' }, { name: 'Mykonos', flag: '🇬🇷', status: 'High demand' },
      { name: 'Courchevel', flag: '🇫🇷', status: 'Active' }, { name: 'Sardinia', flag: '🇮🇹', status: 'Active' },
      { name: 'Cap Ferrat', flag: '🇫🇷', status: 'Active' }, { name: 'Cannes', flag: '🇫🇷', status: 'Active' },
    ],
    form_tag: 'Integration programme', form_title: 'Transitioning into', form_title_em: 'private service?',
    form_sub: "Tell us about your background. We'll come back to you within 24 hours to explain how we can get you placed this summer.",
    f_name: 'Full name *', f_email: 'Email *', f_bg: 'Your background — 5-star hotel, Michelin, restaurant...', f_dest: 'Preferred destinations this summer',
    f_cta: 'Send my details', sent_title: 'Message received.', sent_sub: "We'll get back to you within 24 hours.",
    faq_tag: 'FAQ', faq_title: 'Questions from', faq_title_em: 'chefs like you',
    faqs: [
      { q: 'Do I need private residence experience?', a: "Not necessarily. If you have 5-star hotel or high-end restaurant background, we have an integration programme to get you mission-ready. If you already have private residence experience, you can apply directly." },
      { q: 'How quickly can I get my first mission?', a: 'After validation, most chefs receive their first mission within 2-4 weeks depending on destination and availability.' },
      { q: 'What destinations do you cover?', a: 'Ibiza, Saint-Tropez, Monaco, Mykonos, Courchevel, Sardinia, Cap Ferrat and 50+ destinations across Europe.' },
      { q: 'Is this a job board?', a: 'No. Chefs Talents is a curated network — not an open marketplace. Every chef is reviewed individually before being accepted.' },
    ],
    cta_tag: 'Ready?', cta_title: 'JOIN THE NETWORK.', cta_title_em: 'Start this summer.',
    cta_sub: 'Missions are coming in for Ibiza, Saint-Tropez and Mykonos.\nThe best profiles get placed first.',
    cta1: 'Apply — private experience', cta2: 'New to private service',
  },
  fr: {
    nav_login: 'Connexion membre',
    nav_join: 'Rejoindre le réseau',
    tag_hero: 'Chefs Talents — Réseau Professionnel',
    h1a: 'RÉSEAU DE', h1b: 'CHEFS PRIVÉS', h1c: 'villas & yachts', h1d: "D'EXCEPTION",
    hero_sub: 'Nous plaçons des chefs privés sélectionnés dans des villas de luxe, yachts et résidences privées à travers l\'Europe. Ibiza, Saint-Tropez, Monaco, Mykonos et bien plus.',
    cta_exp: 'J\'ai de l\'expérience en résidence privée',
    cta_new: 'Je débute en service privé',
    stats: [{ v: '400+', l: 'Chefs dans le réseau' }, { v: '50+', l: 'Destinations' }, { v: '400+', l: 'Missions réalisées' }, { v: '< 6h', l: 'Réponse aux clients' }],
    paths_tag: 'Comment rejoindre',
    paths_title: 'Deux voies pour intégrer', paths_title_em: 'le réseau',
    p1_badge: 'Expérience privée', p1_title: 'Candidature', p1_title_em: 'directe',
    p1_sub: 'Vous avez de l\'expérience en résidence privée, villa ou yacht. Postulez directement — notre équipe examine votre profil sous 48 heures.',
    p1_items: ['Expérience villa ou yacht', 'Autonomie en cuisine', 'Expérience clients UHNW', 'Discrétion & confidentialité'],
    p1_cta: 'Postuler maintenant',
    p2_badge: 'Hôtellerie · Restauration', p2_title: 'Programme', p2_title_em: 'd\'intégration',
    p2_sub: 'Vous venez de l\'hôtellerie 5 étoiles ou de la fine cuisine et souhaitez passer au service privé. Nous avons un programme dédié pour vous placer cet été.',
    p2_items: ['Conçu pour les chefs d\'hôtels & restaurants', 'Gestion d\'une cuisine de villa privée', 'Travailler avec des clients UHNW', 'Marché, planning de repas', 'Intégration directe au réseau après validation'],
    p2_cta: 'En savoir plus',
    dest_tag: 'Où nous opérons', dest_title: 'Été 2026', dest_title_em: 'destinations actives',
    dest_list: [
      { name: 'Ibiza', flag: '🇪🇸', status: 'Forte demande' }, { name: 'Saint-Tropez', flag: '🇫🇷', status: 'Forte demande' },
      { name: 'Monaco', flag: '🇲🇨', status: 'Actif' }, { name: 'Mykonos', flag: '🇬🇷', status: 'Forte demande' },
      { name: 'Courchevel', flag: '🇫🇷', status: 'Actif' }, { name: 'Sardaigne', flag: '🇮🇹', status: 'Actif' },
      { name: 'Cap Ferrat', flag: '🇫🇷', status: 'Actif' }, { name: 'Cannes', flag: '🇫🇷', status: 'Actif' },
    ],
    form_tag: 'Programme d\'intégration', form_title: 'Vous souhaitez passer en', form_title_em: 'service privé ?',
    form_sub: 'Parlez-nous de votre parcours. Nous vous recontactons sous 24 heures pour vous expliquer comment vous placer cet été.',
    f_name: 'Nom complet *', f_email: 'Email *', f_bg: 'Votre parcours — hôtel 5*, Michelin, restaurant...', f_dest: 'Destinations souhaitées cet été',
    f_cta: 'Envoyer ma candidature', sent_title: 'Message reçu.', sent_sub: 'Nous vous répondons sous 24 heures.',
    faq_tag: 'FAQ', faq_title: 'Questions de', faq_title_em: 'chefs comme vous',
    faqs: [
      { q: 'Ai-je besoin d\'expérience en résidence privée ?', a: 'Pas forcément. Si vous avez une expérience en hôtellerie 5* ou en gastronomie, notre programme d\'intégration vous permet d\'être opérationnel rapidement. Si vous avez déjà de l\'expérience en résidence privée, vous pouvez postuler directement.' },
      { q: 'Comment puis-je obtenir ma première mission ?', a: 'Après validation, la plupart des chefs reçoivent leur première mission dans les 2 à 4 semaines selon la destination et les disponibilités.' },
      { q: 'Quelles destinations couvrez-vous ?', a: 'Ibiza, Saint-Tropez, Monaco, Mykonos, Courchevel, Sardaigne, Cap Ferrat et 50+ destinations à travers l\'Europe.' },
      { q: 'Est-ce une plateforme d\'emploi ?', a: 'Non. Chefs Talents est un réseau sélectif — pas une place de marché ouverte. Chaque chef est examiné individuellement avant d\'être accepté.' },
    ],
    cta_tag: 'Prêt ?', cta_title: 'REJOIGNEZ LE RÉSEAU.', cta_title_em: 'Démarrez cet été.',
    cta_sub: 'Des missions arrivent pour Ibiza, Saint-Tropez et Mykonos.\nLes meilleurs profils sont placés en premier.',
    cta1: 'Postuler — expérience privée', cta2: 'Je débute en service privé',
  },
  es: {
    nav_login: 'Acceso miembro',
    nav_join: 'Unirse a la red',
    tag_hero: 'Chefs Talents — Red Profesional',
    h1a: 'RED DE', h1b: 'CHEFS PRIVADOS', h1c: 'villas & yates', h1d: 'DE EXCEPCIÓN',
    hero_sub: 'Colocamos chefs privados seleccionados en villas de lujo, yates y residencias privadas en toda Europa. Ibiza, Saint-Tropez, Mónaco, Mykonos y más.',
    cta_exp: 'Tengo experiencia en residencia privada',
    cta_new: 'Soy nuevo en el servicio privado',
    stats: [{ v: '400+', l: 'Chefs en la red' }, { v: '50+', l: 'Destinos' }, { v: '400+', l: 'Misiones realizadas' }, { v: '< 6h', l: 'Respuesta a clientes' }],
    paths_tag: 'Cómo unirse',
    paths_title: 'Dos caminos para entrar en', paths_title_em: 'la red',
    p1_badge: 'Experiencia privada', p1_title: 'Solicitud', p1_title_em: 'directa',
    p1_sub: 'Tiene experiencia en residencia privada, villa o yate. Solicite directamente — nuestro equipo revisa su perfil en 48 horas.',
    p1_items: ['Experiencia en villa o yate', 'Gestión autónoma de cocina', 'Experiencia con clientes UHNW', 'Discreción y confidencialidad'],
    p1_cta: 'Solicitar ahora',
    p2_badge: 'Hostelería · Restauración', p2_title: 'Programa de', p2_title_em: 'integración',
    p2_sub: 'Viene de hoteles 5 estrellas o alta gastronomía y quiere pasar al servicio privado. Tenemos un programa dedicado para colocarle este verano.',
    p2_items: ['Diseñado para chefs de hotel y restaurante', 'Gestión de cocina en villa privada', 'Trabajar con clientes UHNW', 'Mercado y planificación de menús', 'Incorporación directa al roster activo tras completarlo'],
    p2_cta: 'Más información',
    dest_tag: 'Dónde operamos', dest_title: 'Verano 2026', dest_title_em: 'destinos activos',
    dest_list: [
      { name: 'Ibiza', flag: '🇪🇸', status: 'Alta demanda' }, { name: 'Saint-Tropez', flag: '🇫🇷', status: 'Alta demanda' },
      { name: 'Mónaco', flag: '🇲🇨', status: 'Activo' }, { name: 'Mykonos', flag: '🇬🇷', status: 'Alta demanda' },
      { name: 'Courchevel', flag: '🇫🇷', status: 'Activo' }, { name: 'Cerdeña', flag: '🇮🇹', status: 'Activo' },
      { name: 'Cap Ferrat', flag: '🇫🇷', status: 'Activo' }, { name: 'Cannes', flag: '🇫🇷', status: 'Activo' },
    ],
    form_tag: 'Programa de integración', form_title: '¿Quiere pasarse al', form_title_em: 'servicio privado?',
    form_sub: 'Cuéntenos su trayectoria. Le responderemos en 24 horas para explicarle cómo podemos colocarle este verano.',
    f_name: 'Nombre completo *', f_email: 'Email *', f_bg: 'Su trayectoria — hotel 5*, Michelin, restaurante...', f_dest: 'Destinos preferidos este verano',
    f_cta: 'Enviar mis datos', sent_title: 'Mensaje recibido.', sent_sub: 'Le responderemos en 24 horas.',
    faq_tag: 'FAQ', faq_title: 'Preguntas de', faq_title_em: 'chefs como usted',
    faqs: [
      { q: '¿Necesito experiencia en residencia privada?', a: 'No necesariamente. Si tiene experiencia en hostelería 5* o alta gastronomía, nuestro programa de integración le prepara rápidamente. Si ya tiene experiencia en residencia privada, puede solicitar directamente.' },
      { q: '¿Con qué rapidez puedo obtener mi primera misión?', a: 'Tras la validación, la mayoría de los chefs reciben su primera misión en 2-4 semanas según el destino y disponibilidad.' },
      { q: '¿Qué destinos cubren?', a: 'Ibiza, Saint-Tropez, Mónaco, Mykonos, Courchevel, Cerdeña, Cap Ferrat y más de 50 destinos en toda Europa.' },
      { q: '¿Es una bolsa de trabajo?', a: 'No. Chefs Talents es una red selectiva — no un mercado abierto. Cada chef es revisado individualmente antes de ser aceptado.' },
    ],
    cta_tag: '¿Listo?', cta_title: 'ÚNASE A LA RED.', cta_title_em: 'Empiece este verano.',
    cta_sub: 'Llegan misiones para Ibiza, Saint-Tropez y Mykonos.\nLos mejores perfiles se colocan primero.',
    cta1: 'Solicitar — experiencia privada', cta2: 'Soy nuevo en servicio privado',
  },
} as const;

export default function ChefsPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [open, setOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', background: '', destinations: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = T[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/chef-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          email: form.email,
          background: form.background,
          destinations: form.destinations,
          type: 'integration_programme',
          lang,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="bg-[#f4efe8] min-h-screen text-[#161616]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-5 bg-[#f4efe8]/90 backdrop-blur-sm border-b border-[#d8d1c7]">
        <Link href="/" style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-sm tracking-[0.3em] uppercase text-[#161616]">
          Chefs Talents
        </Link>
        <div className="flex items-center gap-3 md:gap-6">
          {/* Switcher langue */}
          <div className="inline-flex items-center rounded-full border border-[#d8d1c7] overflow-hidden">
            {(['en', 'fr', 'es'] as Lang[]).map((l, i) => (
              <button key={l} onClick={() => setLang(l)}
                className={['px-3 py-1.5 text-[10px] font-medium tracking-wide transition', i > 0 ? 'border-l border-[#d8d1c7]' : '', lang === l ? 'bg-[#161616] text-white' : 'text-[#8a7f73] hover:text-[#161616]'].join(' ')}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/chef/login" className="hidden md:block text-xs tracking-[0.15em] uppercase text-[#8a7f73] hover:text-[#161616] transition">
            {t.nav_login}
          </Link>
          <Link href="/chef/signup" className="inline-flex items-center gap-2 bg-[#161616] text-white text-xs tracking-[0.15em] uppercase px-4 md:px-5 py-2.5 rounded-full hover:bg-black transition">
            {t.nav_join}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6 md:px-16 lg:px-24 max-w-7xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-6">{t.tag_hero}</p>
        <h1 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-[3.5rem] md:text-[5.5rem] leading-[0.95] font-bold text-[#161616] max-w-4xl mb-8">
          {t.h1a}<br />{t.h1b}<br /><em className="font-normal italic">{t.h1c}</em><br />{t.h1d}
        </h1>
        <p className="text-lg text-[#59544d] font-light max-w-xl leading-8 mb-12">{t.hero_sub}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/chef/signup" className="inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-sm tracking-[0.15em] uppercase px-8 py-4 rounded-full hover:bg-black transition">
            {t.cta_exp} <ArrowUpRight className="w-4 h-4" />
          </Link>
          <a href="#new-to-private" className="inline-flex items-center justify-center gap-2 border border-[#d8d1c7] text-[#161616] text-sm tracking-[0.15em] uppercase px-8 py-4 rounded-full hover:bg-white transition">
            {t.cta_new}
          </a>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#161616] px-6 md:px-16 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {t.stats.map((s, i) => (
            <div key={i} className="text-center">
              <p style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-5xl text-white font-bold">{s.v}</p>
              <p className="text-xs tracking-[0.2em] uppercase text-[#8a7f73] mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TWO PATHS */}
      <section className="px-6 md:px-16 lg:px-24 py-24 max-w-7xl mx-auto">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">{t.paths_tag}</p>
        <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl md:text-5xl font-bold text-[#161616] mb-16">
          {t.paths_title}<br /><em className="font-normal italic">{t.paths_title_em}</em>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#d8d1c7] rounded-3xl p-8 md:p-10 flex flex-col">
            <div className="inline-block bg-[#161616] text-white text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full mb-6 self-start">{t.p1_badge}</div>
            <h3 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl font-bold mb-4">{t.p1_title}<br /><em className="font-normal italic">{t.p1_title_em}</em></h3>
            <p className="text-sm text-[#59544d] leading-7 mb-8">{t.p1_sub}</p>
            <ul className="space-y-3 mb-10">
              {t.p1_items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#59544d]">
                  <Check className="w-4 h-4 text-[#B08D57] shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/chef/signup" className="mt-auto inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-xs tracking-[0.2em] uppercase px-6 py-4 rounded-full hover:bg-black transition">
              {t.p1_cta} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div id="new-to-private" className="bg-[#161616] rounded-3xl p-8 md:p-10 flex flex-col">
            <div className="inline-block bg-[#B08D57] text-white text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full mb-6 self-start">{t.p2_badge}</div>
            <h3 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl font-bold text-white mb-4">{t.p2_title}<br /><em className="font-normal italic">{t.p2_title_em}</em></h3>
            <p className="text-sm text-[#a09890] leading-7 mb-8">{t.p2_sub}</p>
            <ul className="space-y-3 mb-10">
              {t.p2_items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#a09890]">
                  <Check className="w-4 h-4 text-[#B08D57] shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <a href="#contact-form" className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-[#161616] text-xs tracking-[0.2em] uppercase px-6 py-4 rounded-full hover:bg-[#f4efe8] transition">
              {t.p2_cta} <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="bg-white px-6 md:px-16 lg:px-24 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">{t.dest_tag}</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl md:text-5xl font-bold text-[#161616] mb-12">
            {t.dest_title}<br /><em className="font-normal italic">{t.dest_title_em}</em>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {t.dest_list.map((d, i) => (
              <div key={i} className="border border-[#d8d1c7] rounded-2xl p-4">
                <p className="text-2xl mb-2">{d.flag}</p>
                <p className="text-sm font-medium text-[#161616]">{d.name}</p>
                <p className={`text-[10px] tracking-[0.15em] uppercase mt-1 ${d.status.includes('demand') || d.status.includes('demande') || d.status.includes('demanda') ? 'text-[#B08D57]' : 'text-[#8a7f73]'}`}>{d.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="contact-form" className="px-6 md:px-16 lg:px-24 py-24 max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">{t.form_tag}</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl font-bold text-[#161616] mb-4">
            {t.form_title}<br /><em className="font-normal italic">{t.form_title_em}</em>
          </h2>
          <p className="text-sm text-[#59544d] leading-7 mb-10">{t.form_sub}</p>
          {sent ? (
            <div className="bg-[#161616] rounded-3xl p-10 text-center">
              <p style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-3xl text-white font-bold mb-3">{t.sent_title}</p>
              <p className="text-sm text-[#8a7f73]">{t.sent_sub}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input required type="text" placeholder={t.f_name} value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
                <input required type="email" placeholder={t.f_email} value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              </div>
              <input type="text" placeholder={t.f_bg} value={form.background} onChange={e => setForm({...form, background: e.target.value})}
                className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              <input type="text" placeholder={t.f_dest} value={form.destinations} onChange={e => setForm({...form, destinations: e.target.value})}
                className="w-full px-5 py-4 border-2 border-[#d8d1c7] rounded-2xl bg-white focus:outline-none focus:border-[#161616] text-[#161616] placeholder-[#a09890] text-sm" />
              <button type="submit" disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-[#161616] text-white text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-black transition w-full sm:w-auto disabled:opacity-50">
                {loading ? '...' : t.f_cta} <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-6 md:px-16 lg:px-24 py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-4">{t.faq_tag}</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-4xl font-bold text-[#161616] mb-12">
            {t.faq_title}<br /><em className="font-normal italic">{t.faq_title_em}</em>
          </h2>
          <div className="border-t border-[#d8d1c7]">
            {t.faqs.map((f, i) => (
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

      {/* CTA */}
      <section className="bg-[#161616] px-6 md:px-16 lg:px-24 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8a7f73] mb-6">{t.cta_tag}</p>
          <h2 style={{ fontFamily: "'Bodoni Moda', serif" }} className="text-5xl font-bold text-white mb-6">
            {t.cta_title}<br /><em className="font-normal italic">{t.cta_title_em}</em>
          </h2>
          <p className="text-sm text-[#8a7f73] leading-7 mb-12">{t.cta_sub}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chef/signup" className="inline-flex items-center justify-center gap-2 bg-white text-[#161616] text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-[#f4efe8] transition">
              {t.cta1} <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a href="#contact-form" className="inline-flex items-center justify-center gap-2 border border-[#2a2a2a] text-white text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-full hover:bg-white/5 transition">
              {t.cta2}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
