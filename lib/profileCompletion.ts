export function isProfileCompleteForValidation(p: any) {
  const name = String(p?.name ?? '').trim();
  const phone = String(p?.phone ?? '').trim();

  const baseCity =
    String(p?.location?.baseCity ?? p?.baseCity ?? p?.city ?? '').trim();

  const bio = String(p?.bio ?? '').trim();
  const years = Number(p?.yearsExperience ?? p?.experienceYears ?? 0) || 0;

  const images = Array.isArray(p?.images) ? p.images : Array.isArray(p?.photos) ? p.photos : [];
  const photoUrl = String(p?.photoUrl ?? p?.avatarUrl ?? '').trim();
  const portfolioUrl = String(p?.portfolioUrl ?? '').trim();
  const instagram = String(p?.instagram ?? '').trim();
  const website = String(p?.website ?? '').trim();

  const cuisines = Array.isArray(p?.cuisines) ? p.cuisines : [];
  const languages = Array.isArray(p?.languages) ? p.languages : [];

  const mobilityOk =
    !!baseCity ||
    p?.location?.internationalMobility === true ||
    (Array.isArray(p?.location?.coverageZones) && p.location.coverageZones.length > 0) ||
    (Array.isArray(p?.coverageZones) && p.coverageZones.length > 0);

  // ✅ Portfolio : une preuve suffit (photo OU lien)
  const portfolioOk =
    (images.filter(Boolean).length > 0) ||
    !!photoUrl ||
    !!portfolioUrl ||
    !!instagram ||
    !!website;

  const identityOk = !!name && !!phone && !!baseCity;
  const experienceOk = years > 0 || bio.length >= 80;
  const preferencesOk = cuisines.length >= 1 && languages.length >= 1;

  // ✅ PRICING obligatoire
  const pricing = p?.pricing;
  const dailyRate = pricing?.residence?.dailyRate ?? null;
  const pricePerPerson = pricing?.event?.pricePerPerson ?? null;

  const hasAnyPrice = Number(dailyRate) > 0 || Number(pricePerPerson) > 0;

  // règles “min” selon type
  const profileType = String(p?.profileType ?? '').toLowerCase(); // residence / events / yacht etc
  const minDays = pricing?.residence?.minDays ?? null;
  const minGuests = pricing?.event?.minGuests ?? null;

  const needsResidenceMinDays = ['residence', 'private', 'chalet', 'yacht'].includes(profileType);
  const needsEventMinGuests = ['events', 'event'].includes(profileType);

  const pricingOk =
    hasAnyPrice &&
    (!needsResidenceMinDays || Number(minDays) >= 1) &&
    (!needsEventMinGuests || Number(minGuests) >= 1);

  return {
    ok: identityOk && experienceOk && portfolioOk && mobilityOk && preferencesOk && pricingOk,
    details: {
      identityOk,
      experienceOk,
      portfolioOk,
      mobilityOk,
      preferencesOk,
      pricingOk,
    },
  };
}
