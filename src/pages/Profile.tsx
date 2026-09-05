import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Building, Phone, Mail, Award, CheckCircle2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { t, farmMode } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'IX';

  return (
    <div id="profile-page" className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D9CFC7] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#403129] text-[#F9F8F6] flex items-center justify-center font-black text-2xl shadow-sm">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#403129]">
                  {user?.name ?? t.goDrishtiUser}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8A5B3D]/15 text-[#8A5B3D] capitalize">
                  {user?.role ?? 'farmer'}
                </span>
              </div>
              <p className="text-xs text-[#746E68] mt-0.5">{t.profileSubtitle}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#746E68]">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#8A5B3D]" />
                    <span>{user.email}</span>
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#8A5B3D]" />
                    <span>{user.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="bg-[#F9F8F6] p-3 rounded-xl border border-[#D9CFC7] text-xs">
              <span className="text-[#746E68] block">{t.architectureLabel}:</span>
              <strong className="text-[#403129] uppercase">
                {farmMode === 'low_resource' ? t.lowResourceModeValue : t.connectedModeValue}
              </strong>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold rounded-xl transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOutBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Farm Details */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 text-[#403129] border-b border-[#EFE9E3] pb-2">
            <Building className="w-4 h-4 text-[#8A5B3D]" />
            <h3 className="font-bold text-sm">{t.dairyEnterpriseLabel}</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            {[
              [t.facilityNameLabel, 'Anand Model Dairy Co-operative Cluster'],
              [t.locationLabel, 'Anand District, Gujarat, India'],
              [t.herdCapacityLabel, '80 Heads (Cow & Buffalo Mixed)'],
              [t.supervisingVetLabel, 'Dr. Anita Sharma (BVSc & AH)'],
              [t.emergencyClinicLabel, '+91 2692 261800'],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between py-1 border-b border-[#EFE9E3] last:border-b-0">
                <span className="text-[#746E68]">{label}:</span>
                <span className="font-bold text-[#403129] text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Intelligence */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9CFC7] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 text-[#403129] border-b border-[#EFE9E3] pb-2">
            <Award className="w-4 h-4 text-[#8A5B3D]" />
            <h3 className="font-bold text-sm">{t.systemIntelligenceLabel}</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#EFE9E3]">
              <span className="text-[#746E68]">{t.platformArchLabel}:</span>
              <span className="font-bold text-[#403129]">Cloud & Edge IoT Multimodal AI</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#EFE9E3]">
              <span className="text-[#746E68]">{t.modelPipelineLabel}:</span>
              <span className="font-semibold text-[#8A5B3D] bg-[#8A5B3D]/10 px-2 py-0.5 rounded">
                Early Bovine Mastitis Forecasting
              </span>
            </div>
            <div className="py-1 border-b border-[#EFE9E3]">
              <span className="text-[#746E68] block mb-1">{t.clinicalScopeLabel}:</span>
              <p className="font-semibold text-[#403129] leading-relaxed">
                AI-Based Predictive Modelling for Early Forecasting of Bovine Mastitis in Indian Dairy Farms
              </p>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#746E68]">{t.scientificValidationLabel}:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.peerReviewedCompliant}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Verification */}
      <div className="p-5 bg-[#EFE9E3]/70 rounded-2xl border border-[#D9CFC7] space-y-2.5 text-xs text-[#403129]">
        <div className="flex items-center gap-2 font-bold text-sm text-[#8A5B3D]">
          <ShieldCheck className="w-4 h-4" />
          <span>{t.hardwareVerificationLabel}</span>
        </div>
        <p className="text-[#746E68] text-xs leading-relaxed">
          {t.appSubtitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <strong className="block text-[#403129] mb-1">{t.acousticRuminationLabel}</strong>
            <span className="text-[#746E68] text-[11px]">
              Chewing sound inference using MAX9814 microphone, validated against visual timer baselines.
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <strong className="block text-[#403129] mb-1">{t.skinTemperatureLabel}</strong>
            <span className="text-[#746E68] text-[11px]">
              Surface probe DS18B20 measuring exterior skin thermal shifts rather than internal core temp.
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#D9CFC7]">
            <strong className="block text-[#403129] mb-1">{t.affordableFieldScreeningLabel}</strong>
            <span className="text-[#746E68] text-[11px]">
              Empowers smallholders to intercept subclinical mastitis 7–14 days prior to clinical gland hardening.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
