import React from 'react';
import { X, Activity, Heart, Building2, Banknote } from 'lucide-react';
import { QRFType } from '../types';

interface CreateQRFModalProps {
  onClose: () => void;
  onSelect: (type: QRFType) => void;
}

const CreateQRFModal: React.FC<CreateQRFModalProps> = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-down">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Select eQRF Type</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Medical Card */}
            <button onClick={() => onSelect(QRFType.MEDICAL)} className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Medi-Life</h3>
                <p className="text-sm text-gray-500 text-center">Comprehensive medical insurance.</p>
                <span className="mt-3 text-xs font-semibold text-brand-600 bg-brand-100 px-2 py-1 rounded">+ Includes Life Form</span>
            </button>

            {/* Life Card */}
            <button onClick={() => onSelect(QRFType.LIFE)} className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Life</h3>
                <p className="text-sm text-gray-500 text-center">Life insurance and coverage details.</p>
            </button>

            {/* Pension Card */}
            <button onClick={() => onSelect(QRFType.PENSION)} className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Pension</h3>
                <p className="text-sm text-gray-500 text-center">Defined contribution & benefit plans.</p>
            </button>

            {/* Credit Card */}
            <button onClick={() => onSelect(QRFType.CREDIT)} className="flex flex-col items-center p-6 border-2 border-gray-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Banknote size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Credit</h3>
                <p className="text-sm text-gray-500 text-center">Credit life policy and schemes.</p>
            </button>
          </div>
      </div>
    </div>
  );
};

export default CreateQRFModal;