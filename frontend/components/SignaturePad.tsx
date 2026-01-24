'use client';

import { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigRef.current?.clear();
    onClear();
  };

  const handleSave = () => {
    if (sigRef.current?.isEmpty()) {
      alert('서명을 입력해주세요.');
      return;
    }
    const dataUrl = sigRef.current?.toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="border border-gray-300 rounded mb-3">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: 'w-full h-40',
            style: { width: '100%', height: '160px' },
          }}
          backgroundColor="white"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          지우기
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          서명 저장
        </button>
      </div>
    </div>
  );
}
