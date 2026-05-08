'use client';

// components/PhoneField.tsx
// Champ téléphone international avec sélecteur de pays (drapeau + indicatif).
// Format E.164 (+33612345678). Affiche une erreur si le numéro est mal formé.
//
// Wrappe react-phone-number-input. Le style baseline est appliqué via le
// CSS global de la lib, surchargé par le bloc <style jsx> ci-dessous pour
// rester cohérent avec le design du projet (border stone-200, focus stone-900).

import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** ISO country code par défaut (ex: 'FR', 'GB', 'ES'). Default 'FR'. */
  defaultCountry?: Country;
  placeholder?: string;
  errorText?: string;
  className?: string;
};

export function PhoneField({
  value,
  onChange,
  defaultCountry = 'FR',
  placeholder,
  errorText,
  className,
}: Props) {
  const isInvalid = !!value && !isValidPhoneNumber(value);

  return (
    <div className={`phone-field-wrap ${className || ''}`}>
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value}
        onChange={(v) => onChange(v || '')}
        placeholder={placeholder}
        countryCallingCodeEditable={false}
        className="phone-field-root"
      />
      {isInvalid && (
        <p className="text-xs text-red-700 mt-1.5">
          {errorText || 'Numéro invalide pour ce pays.'}
        </p>
      )}

      <style jsx global>{`
        .phone-field-root.PhoneInput {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e7e5e4;
          background: #ffffff;
          padding: 10px 14px;
          font-size: 14px;
          color: #1c1917;
          transition: border-color 0.15s;
        }
        .phone-field-root.PhoneInput:focus-within {
          border-color: #1c1917;
          outline: none;
        }
        .phone-field-root .PhoneInputCountry {
          margin-right: 4px;
          gap: 6px;
        }
        .phone-field-root .PhoneInputCountrySelect {
          font-size: 14px;
          color: #1c1917;
        }
        .phone-field-root .PhoneInputCountryIcon {
          width: 22px;
          height: 16px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
        }
        .phone-field-root .PhoneInputInput {
          flex: 1;
          border: 0;
          outline: none;
          padding: 0;
          background: transparent;
          font-size: 14px;
          color: #1c1917;
        }
        .phone-field-root .PhoneInputInput::placeholder {
          color: #a8a29e;
        }
      `}</style>
    </div>
  );
}

/** Helper réutilisable côté client pour valider un numéro. */
export function isValidPhone(value: string): boolean {
  if (!value) return false;
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}
