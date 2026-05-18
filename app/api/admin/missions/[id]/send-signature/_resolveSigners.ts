// app/api/admin/missions/[id]/send-signature/_resolveSigners.ts
//
// Helper partagé entre GET preview et POST send-signature.
// Résout :
//   - le contract snapshot (mêmes defaults + spread que ContractsPanel)
//   - la liste des signataires selon le kind (avec validation)
//   - le HTML rendu (utilisé pour PDF côté POST et iframe preview côté UI)
//
// Garantit que ce que l'admin voit dans le modal de confirmation correspond
// EXACTEMENT à ce que la route POST enverra à YouSign.

import {
  type EssaiData,
  type ChefContractData,
  type ClientContractData,
  buildEssaiDefaults,
  buildChefDefaults,
  buildClientDefaults,
  renderEssai,
  renderChef,
  renderClient,
} from '@/app/admin/missions/[id]/_lib/contracts';
import type { YousignSignerInput } from '@/lib/yousign/client';

export type ContractKind = 'essai' | 'chef' | 'client';

export type ResolvedSigner = YousignSignerInput & {
  /** Validations détectées côté serveur, pour affichage UI dans le modal. */
  warnings: string[];
};

export type ResolvedContract = {
  kind: ContractKind;
  html: string;
  contractSnapshot: any;
  docName: string;
  filename: string;
  signers: ResolvedSigner[];
  /**
   * Champs absents qui empêchent l'envoi (full_name client, email chef…).
   * Si non-vide → /api/.../send-signature renvoie 400 MISSING_SIGNER_DATA.
   */
  missingFields: string[];
};

type MissionRow = any;
type ChefRow = { email: string; profile: any } | null;
type ClientRequestRow = {
  full_name?: string | null;
  first_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
} | null;

function splitName(full: string | null | undefined): { first: string; last: string } {
  const s = String(full || '').trim();
  if (!s) return { first: '—', last: '—' };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '—' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function validateEmail(email: string | null | undefined, expectedRole: string, hasCompany?: boolean): string[] {
  const warnings: string[] = [];
  const e = String(email || '').trim().toLowerCase();
  if (!e) {
    warnings.push('Email manquant');
    return warnings;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    warnings.push('Format email invalide');
  }
  // Heuristique : si role client + société renseignée + email personnel → warning soft
  if (expectedRole === 'client' && hasCompany) {
    const personalDomains = ['gmail.com', 'yahoo.fr', 'yahoo.com', 'hotmail.fr', 'hotmail.com', 'orange.fr', 'wanadoo.fr', 'free.fr', 'icloud.com', 'outlook.com', 'me.com'];
    const domain = e.split('@')[1];
    if (domain && personalDomains.includes(domain)) {
      warnings.push('Email perso alors qu\'une société est renseignée');
    }
  }
  return warnings;
}

export function resolveContract(args: {
  kind: ContractKind;
  mission: MissionRow;
  chef: ChefRow;
  clientRequest: ClientRequestRow;
}): ResolvedContract {
  const { kind, mission, chef, clientRequest } = args;

  const contractsData = (mission.contracts_data || {}) as {
    essai?: Partial<EssaiData>;
    chef?: Partial<ChefContractData>;
    client?: Partial<ClientContractData>;
  };

  const missionLike = {
    chef_name: mission.chef_name,
    chef_email: mission.chef_email,
    location: mission.location,
    start_date: mission.start_date,
    end_date: mission.end_date,
    guest_count: mission.guest_count,
    service_level: mission.service_level,
    chef_amount: mission.chef_amount,
    client_amount: mission.client_amount,
  };
  const clientLike = {
    fullName: clientRequest?.full_name ?? clientRequest?.first_name ?? null,
    companyName: clientRequest?.company_name ?? null,
    email: clientRequest?.email ?? null,
    phone: clientRequest?.phone ?? null,
  };

  // ── Build HTML + snapshot
  let html: string;
  let contractSnapshot: any;
  let docName: string;
  // Données client/chef finales (form data en priorité, sinon DB)
  let resolvedClient: { fullName: string; email: string; phone: string; company: string };
  let resolvedChefFromForm: { name: string; email: string; phone: string };
  if (kind === 'essai') {
    const data = { ...buildEssaiDefaults(missionLike, clientLike), ...(contractsData.essai ?? {}) } as EssaiData;
    html = renderEssai(data);
    contractSnapshot = data;
    docName = `essai_${data.trialDate || mission.start_date || ''}`;
    resolvedClient = {
      fullName: data.clientName || clientLike.fullName || '',
      email: data.clientEmail || clientLike.email || '',
      phone: data.clientPhone || clientLike.phone || '',
      company: data.clientCompany || clientLike.companyName || '',
    };
    resolvedChefFromForm = {
      name: data.chefName || mission.chef_name || '',
      email: data.chefEmail || mission.chef_email || '',
      phone: data.chefPhone || '',
    };
  } else if (kind === 'chef') {
    const data = { ...buildChefDefaults(missionLike), ...(contractsData.chef ?? {}) } as ChefContractData;
    html = renderChef(data);
    contractSnapshot = data;
    docName = `chef_${data.chefName || mission.chef_name || ''}`;
    resolvedClient = { fullName: '', email: '', phone: '', company: '' }; // pas utilisé pour chef
    resolvedChefFromForm = {
      name: data.chefName || mission.chef_name || '',
      email: mission.chef_email || '',  // chefContract n'a pas chefEmail dans le snapshot — on prend la mission
      phone: '',
    };
  } else {
    const data = { ...buildClientDefaults(missionLike, clientLike), ...(contractsData.client ?? {}) } as ClientContractData;
    html = renderClient(data);
    contractSnapshot = data;
    docName = `client_${data.clientName || clientLike.fullName || ''}`;
    resolvedClient = {
      fullName: data.clientName || clientLike.fullName || '',
      email: data.clientEmail || clientLike.email || '',
      phone: data.clientPhone || clientLike.phone || '',
      company: data.clientCompany || clientLike.companyName || '',
    };
    resolvedChefFromForm = { name: '', email: '', phone: '' }; // pas utilisé pour client
  }

  const filename = `Contrat_${kind}_${docName.replace(/[^a-zA-Z0-9_]/g, '_')}.pdf`;

  // ── Build signataires
  const signers: ResolvedSigner[] = [];
  const missingFields: string[] = [];

  const chefProfile = chef
    ? {
        firstName: chef.profile?.firstName || splitName(chef.profile?.name || resolvedChefFromForm.name || mission.chef_name).first,
        lastName: chef.profile?.lastName || splitName(chef.profile?.name || resolvedChefFromForm.name || mission.chef_name).last,
        email: chef.email,
        phone: chef.profile?.phone || chef.profile?.phoneNumber || undefined,
      }
    : null;

  // Client signataire (essai + client) — form data prioritaire, request en fallback
  if (kind === 'essai' || kind === 'client') {
    const fullName = resolvedClient.fullName;
    const email = resolvedClient.email;
    if (!email || !fullName) {
      const lacks: string[] = [];
      if (!fullName) lacks.push('nom');
      if (!email) lacks.push('email');
      missingFields.push(`client (${lacks.join(' + ')})`);
    } else {
      const sn = splitName(fullName);
      signers.push({
        firstName: sn.first,
        lastName: sn.last,
        email,
        phoneNumber: resolvedClient.phone || undefined,
        role: 'client',
        warnings: validateEmail(email, 'client', !!resolvedClient.company),
      });
    }
  }

  // Chef signataire (essai + chef) — form prioritaire, profile DB en fallback
  if (kind === 'essai' || kind === 'chef') {
    // Pour essai : chefEmail vient du contract snapshot (data.chefEmail). Si vide → fallback profile DB.
    // Pour chef  : on prend prioritairement le profile DB (le snapshot chef n'a pas chefEmail).
    const finalChefEmail = resolvedChefFromForm.email || chefProfile?.email || '';
    const finalChefName = resolvedChefFromForm.name || (chefProfile ? `${chefProfile.firstName} ${chefProfile.lastName}`.trim() : '') || mission.chef_name || '';
    if (!finalChefEmail || !finalChefName) {
      const lacks: string[] = [];
      if (!finalChefName) lacks.push('nom');
      if (!finalChefEmail) lacks.push('email');
      missingFields.push(`chef (${lacks.join(' + ')})`);
    } else {
      const sn = splitName(finalChefName);
      signers.push({
        firstName: chefProfile?.firstName || sn.first,
        lastName: chefProfile?.lastName || sn.last,
        email: finalChefEmail,
        phoneNumber: resolvedChefFromForm.phone || chefProfile?.phone || undefined,
        role: 'chef',
        warnings: validateEmail(finalChefEmail, 'chef'),
      });
    }
  }

  // Agence — Thomas par défaut + override env
  const agencyEmail = process.env.YOUSIGN_AGENCY_EMAIL || 'contact@chefstalents.com';
  signers.push({
    firstName: process.env.YOUSIGN_AGENCY_FIRST_NAME || 'Thomas',
    lastName: process.env.YOUSIGN_AGENCY_LAST_NAME || 'Delcroix',
    email: agencyEmail,
    role: 'agency',
    warnings: validateEmail(agencyEmail, 'agency'),
  });

  return {
    kind,
    html,
    contractSnapshot,
    docName,
    filename,
    signers,
    missingFields,
  };
}
