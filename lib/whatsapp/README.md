# WhatsApp Cloud API — Chefs Talents

Wrapper autour de l'API WhatsApp Cloud (Meta) pour les notifications
automatiques, rappels de mission, et broadcasts ciblés.

## Stratégie deux numéros

- **Numéro WhatsApp Business standard** (app, conversations directes) :
  `+33 7 56 82 76 12` — utilisé par Thomas en humain. Reste inchangé.
- **Numéro WhatsApp Cloud API** (à enregistrer dans Meta) : numéro
  dédié aux envois automatiques. Les chefs / clients qui répondent à
  ce numéro reçoivent une auto-réponse les redirigeant vers le numéro
  standard.

## Variables d'environnement (Vercel)

```
WHATSAPP_TOKEN=<long-lived access token from Meta>
WHATSAPP_PHONE_NUMBER_ID=<phone number id from Meta>
WHATSAPP_VERIFY_TOKEN=<random string you invent, used during webhook setup>
WHATSAPP_API_VERSION=v21.0       # optionnel, par défaut v21.0
WHATSAPP_DIRECT_CONTACT=+33 7 56 82 76 12  # optionnel, par défaut hardcoded
WHATSAPP_MOCK=1                  # optionnel, force le mode mock même avec token
```

**Mode mock** : si `WHATSAPP_TOKEN` ou `WHATSAPP_PHONE_NUMBER_ID` est
manquant, ou si `WHATSAPP_MOCK=1`, les envois sont loggés sans appel
réseau. Permet de coder + tester sans dépendre de l'approbation Meta.

## Setup côté Meta (Thomas)

1. Aller sur https://business.facebook.com → créer Business Manager
2. Aller sur https://developers.facebook.com → Mes apps → Créer une
   app de type **Business**
3. Ajouter le produit **WhatsApp** → notez `PHONE_NUMBER_ID` et
   générer un `ACCESS_TOKEN` long-lived (System User recommandé)
4. Ajouter le nouveau numéro dédié (eSIM/SIM physique non WA actif)
5. Configurer le webhook :
   - URL : `https://chefstalents.com/api/whatsapp/webhook`
   - Verify Token : la même valeur que `WHATSAPP_VERIFY_TOKEN`
   - Subscriptions : `messages` minimum
6. Soumettre les templates pour approbation (PR #2)

## Usage

```ts
import { sendText, sendTemplate, bodyVars } from '@/lib/whatsapp/send';

// Message libre (uniquement dans la fenêtre de 24h après dernier message reçu)
await sendText('+33612345678', 'Bonjour Thomas !');

// Template approuvé Meta (ne nécessite pas la fenêtre 24h)
await sendTemplate(
  '+33612345678',
  'mission_reminder_30d',
  'fr',
  bodyVars(['Jean Dupont', '15 juin 2026', 'Saint-Tropez']),
);
```

## Numéro → format

Le wrapper normalise automatiquement les numéros FR :
- `0612345678` → `33612345678`
- `+33 6 12 34 56 78` → `33612345678`
- `+33612345678` → `33612345678`

Tout autre format est passé tel quel (sans le `+`).
