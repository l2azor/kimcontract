'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsSaved(false);
    onClear();
  };

  const handleSave = () => {
    if (sigRef.current?.isEmpty()) {
      alert('서명을 입력해주세요.');
      return;
    }
    const dataUrl = sigRef.current?.toDataURL('image/png');
    if (dataUrl) {
      setIsSaved(true);
      onSave(dataUrl);
    }
  };

  return (
    <div className="relative">
      {/* Signature canvas container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-cyan-400 bg-white p-2 transition-all hover:border-cyan-500">
        {/* Canvas background grid */}
        <div className="absolute inset-2 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />

        {/* Signature line */}
        <div className="absolute bottom-14 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />

        {/* Label */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono text-gray-500 tracking-widest font-bold">
          DIGITAL SIGNATURE
        </div>

        {/* Canvas */}
        <div className="relative bg-white rounded-xl">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: 'w-full',
              style: {
                width: '100%',
                height: '200px',
                touchAction: 'none'
              },
            }}
            backgroundColor="white"
            penColor="#1E3A5F"
            minWidth={1.5}
            maxWidth={3}
          />
        </div>

        {/* Blockchain indicator */}
        {isSaved && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-500 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-emerald-700 font-bold">
              VERIFIED
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          지우기
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="crystal-btn flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold hover:shadow-xl hover:shadow-verification-cyan/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          서명 저장
        </button>
      </div>

      {/* Info text */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-700 flex items-center justify-center gap-2 font-semibold">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          서명은 SHA-256 해시로 암호화되어 Solana 블록체인에 기록됩니다
        </p>
      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 163, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 255, 163, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
