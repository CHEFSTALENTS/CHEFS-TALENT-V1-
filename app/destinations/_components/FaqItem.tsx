'use client';

import { useState } from 'react';

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e2db]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-6 text-left"
      >
        <span className="pr-6 font-serif text-[1.2rem] leading-snug text-[#161616]">{question}</span>
        <span className={`text-xl text-[#8a7f73] transition-transform shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="pb-6 pr-8 text-[16px] font-light leading-8 text-[#59544d]">
          {answer}
        </div>
      )}
    </div>
  );
}
