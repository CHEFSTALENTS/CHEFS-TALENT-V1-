<section className="relative h-[88vh] min-h-[680px] w-full overflow-hidden">
  <motion.img
    src="/images/editorial/hero-chef-talents.jpg"
    alt="Chef privé"
    className="absolute inset-0 h-full w-full object-cover object-[68%_center] md:object-center"
    initial={{ scale: 1.06, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
  />

  <motion.div
    className="absolute inset-0 bg-black/62"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2, ease: 'easeOut' }}
  />
  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
  <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-black/10" />

  <div className="relative z-10 flex h-full items-end px-6 pb-14 md:px-12 md:pb-16 lg:px-20 lg:pb-20">
    <motion.div
      className="max-w-[880px] text-white"
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-white/80 md:mb-6">
        Chefs Talents
      </p>

      <h1 className="max-w-[900px] text-[2.55rem] leading-[0.96] tracking-tight text-white md:text-6xl lg:text-[5rem]">
        Des chefs privés,
        <br />
        pour des missions
        <br />
        <span className="italic text-white">d’exception.</span>
      </h1>

      <p className="mt-6 max-w-[34rem] text-[17px] leading-8 text-white/92 md:max-w-[620px] md:text-lg md:leading-relaxed">
        Un réseau de chefs sélectionnés pour des clients exigeants.
        Villas, yachts, résidences privées.
        Une exécution sans friction, partout en Europe.
      </p>

      <div className="mt-9 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/request"
          className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition hover:bg-white/85 sm:w-auto"
        >
          Décrire mon besoin
        </Link>

        <Link
          href="/conciergeries"
          className="inline-flex min-h-[56px] w-full items-center justify-center rounded-full border border-white/45 bg-black/10 px-8 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
        >
          Je suis une conciergerie
        </Link>
      </div>
    </motion.div>
  </div>
</section>
