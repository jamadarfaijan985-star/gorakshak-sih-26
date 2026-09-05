import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { animalService } from '../../services/animalService';
import { animalApiService } from '../../services/animalApiService';
import { milkService } from '../../services/milkService';
import { cmtService } from '../../services/cmtService';
import { healthService } from '../../services/healthService';
import { ingestService } from '../../services/ingestService';
import { env } from '../../config/env';
import { Species, CMTQuarterResult } from '../../types';
import type { AnimalResponse } from '../../types/api';
import { X, Check, Loader2, WifiOff } from 'lucide-react';

// ─── Valid backend data_source values (ManualLabDataSourceEnum) ───────────────
// Backend enum: field_kit | lab_submission | farmer_observation | veterinary_clinic
type BackendDataSource = 'field_kit' | 'lab_submission' | 'farmer_observation' | 'veterinary_clinic';

const DATA_SOURCE_LABELS: Record<BackendDataSource, string> = {
  farmer_observation: 'Farmer Observation',
  field_kit:          'Field Kit / Paddle',
  lab_submission:     'Lab Submission',
  veterinary_clinic:  'Veterinary Clinic',
};

// ─── AnimalOption: works for both local (demo) and backend (live) animals ────
interface AnimalOption {
  id: string;       // backend UUID or local demo ID
  tag: string;      // tag_id (backend) or tag (local)
  name: string;     // name (local) or tag_id fallback (live)
  species: string;
}

export const GlobalModals: React.FC<{ onDataChanged?: () => void }> = ({ onDataChanged }) => {
  const { activeModal, closeModal, modalAnimalId, showToast, t, farmMode } = useApp();
  const { activeFarmId, user } = useAuth();
  const isLive = !env.DEMO_MODE && !!activeFarmId;
  const [submitting, setSubmitting] = useState(false);

  // ── Animal options: demo animals (always) + live backend animals ─────────
  const demoAnimals = animalService.getAll();
  const [liveAnimals, setLiveAnimals] = useState<AnimalResponse[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  useEffect(() => {
    if (!isLive || activeModal === 'none') return;
    setLoadingAnimals(true);
    animalApiService
      .list({ farm_id: activeFarmId!, limit: 200 })
      .then((page) => setLiveAnimals(page.data))
      .catch(() => setLiveAnimals([]))
      .finally(() => setLoadingAnimals(false));
  }, [isLive, activeFarmId, activeModal]);

  // Unified animal options list
  const animalOptions: AnimalOption[] = isLive
    ? liveAnimals.map((a) => ({
        id: a.id,            // Real backend UUID
        tag: a.tag_id,
        name: a.tag_id,      // Backend has no "name" field
        species: a.species,
      }))
    : demoAnimals.map((a) => ({
        id: a.id,
        tag: a.tag,
        name: a.name,
        species: a.species,
      }));

  // Default animal selection
  const defaultAnimalId =
    modalAnimalId ||
    (isLive ? (liveAnimals[0]?.id ?? '') : (demoAnimals[0]?.id ?? ''));

  // ── Add Animal State ──────────────────────────────────────────────────────
  const [animalForm, setAnimalForm] = useState({
    tag: '',
    name: '',
    species: 'cow' as Species,
    breed: 'Gir (गीर)',
    ageYears: 4,
    lactationNumber: 2,
    daysInMilk: 60,
    avgDailyYieldLiters: 12,
    farm: 'Anand Demo Dairy Cluster',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
    collarId: 'DEV-COL-07',
  });

  // ── Add Milk State ────────────────────────────────────────────────────────
  const [milkForm, setMilkForm] = useState({
    animalId: defaultAnimalId,
    date: new Date().toISOString().split('T')[0],
    milkYield: 12.5,
    milkTemperature: 36.4,
    electricalConductivity: 5.2,
    pH: 6.68,
    scc: 150,
    notes: '',
    dataSource: 'farmer_observation' as BackendDataSource,
  });

  // ── Add CMT State ─────────────────────────────────────────────────────────
  const [cmtForm, setCmtForm] = useState<{
    animalId: string;
    date: string;
    lf: CMTQuarterResult;
    rf: CMTQuarterResult;
    lr: CMTQuarterResult;
    rr: CMTQuarterResult;
    testerName: string;
    notes: string;
    dataSource: BackendDataSource;
  }>({
    animalId: defaultAnimalId,
    date: new Date().toISOString().split('T')[0],
    lf: 'negative',
    rf: 'negative',
    lr: 'negative',
    rr: 'negative',
    testerName: 'Field Para-vet',
    notes: '',
    dataSource: 'field_kit',
  });

  // ── Add Health State ──────────────────────────────────────────────────────
  const [healthForm, setHealthForm] = useState({
    animalId: defaultAnimalId,
    date: new Date().toISOString().split('T')[0],
    observation: '',
    condition: 'Routine Health & Teat Inspection',
    treatment: 'Post-milking herbal teat barrier dip',
    veterinaryNotes: '',
    followUpDate: '',
    veterinarianName: 'Dr. Sharma (BVSc)',
    udderTempC: '',
    dataSource: 'farmer_observation' as BackendDataSource,
  });

  // Update default animal when live animals load
  useEffect(() => {
    if (isLive && liveAnimals.length > 0 && !modalAnimalId) {
      const firstId = liveAnimals[0].id;
      setMilkForm((prev) => ({ ...prev, animalId: firstId }));
      setCmtForm((prev) => ({ ...prev, animalId: firstId }));
      setHealthForm((prev) => ({ ...prev, animalId: firstId }));
    }
  }, [liveAnimals, isLive, modalAnimalId]);

  // Update animal when modalAnimalId changes
  useEffect(() => {
    if (modalAnimalId) {
      setMilkForm((prev) => ({ ...prev, animalId: modalAnimalId }));
      setCmtForm((prev) => ({ ...prev, animalId: modalAnimalId }));
      setHealthForm((prev) => ({ ...prev, animalId: modalAnimalId }));
    }
  }, [modalAnimalId]);

  if (activeModal === 'none') return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getLocalAnimalByDemoId = (id: string) => demoAnimals.find((a) => a.id === id);

  // ── Handle Animal Submit ──────────────────────────────────────────────────
  const handleAnimalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalForm.tag || !animalForm.name) {
      showToast('Please provide Animal Tag and Name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      // Always save locally for demo/immediate display
      animalService.create({
        tag: animalForm.tag,
        name: animalForm.name,
        species: animalForm.species,
        breed: animalForm.breed,
        ageYears: Number(animalForm.ageYears),
        sex: 'Female',
        lactationNumber: Number(animalForm.lactationNumber),
        daysInMilk: Number(animalForm.daysInMilk),
        avgDailyYieldLiters: Number(animalForm.avgDailyYieldLiters),
        farm: animalForm.farm,
        image: animalForm.image,
        riskScore: 15,
        riskLevel: 'no_risk',
        riskTrend: 'stable',
        healthStatus: 'healthy',
        collarId: animalForm.collarId,
        riskFactors: ['Newly enrolled animal — baseline calibration active'],
        baselineSurfaceTemp: animalForm.species === 'cow' ? 34.2 : 33.8,
        baselineRuminationMinutes: 460,
        baselineActivityScore: 65,
        currentSensors: {
          timestamp: 'Just now',
          surfaceTemp: animalForm.species === 'cow' ? 34.2 : 33.8,
          surfaceTempLabel: 'Measured',
          activityScore: 65,
          movementLabel: 'Measured',
          ruminationMinutes: 460,
          ruminationLabel: 'AI-Inferred',
          chewingIntensity: 75,
          ambientTemp: 30.2,
          humidity: 62,
          thi: 78.4,
          thiLabel: 'Estimated',
        },
      });

      // POST to backend in live mode
      if (isLive && activeFarmId) {
        await animalApiService.create({
          farm_id: activeFarmId,
          tag_id: animalForm.tag,
          species: animalForm.species,
          breed: animalForm.breed || undefined,
          age_months: Math.round(Number(animalForm.ageYears) * 12),
          lactation_number: Number(animalForm.lactationNumber),
          status: 'active',
        });
      }

      showToast(`Livestock ${animalForm.tag} registered!`, 'success');
      closeModal();
      onDataChanged?.();
    } catch (err: any) {
      showToast(err?.detail || 'Failed to register animal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Milk Submit ────────────────────────────────────────────────────
  const handleMilkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localAnimal = getLocalAnimalByDemoId(milkForm.animalId);
    setSubmitting(true);
    try {
      // Save locally (demo display)
      milkService.create({
        animalId: milkForm.animalId,
        animalTag: localAnimal?.tag ?? milkForm.animalId,
        date: milkForm.date,
        milkYield: Number(milkForm.milkYield),
        milkTemperature: Number(milkForm.milkTemperature),
        electricalConductivity: farmMode === 'connected' ? Number(milkForm.electricalConductivity) : undefined,
        pH: farmMode === 'connected' ? Number(milkForm.pH) : undefined,
        scc: milkForm.scc ? Number(milkForm.scc) : undefined,
        notes: milkForm.notes,
        source: 'manual',
      });

      // POST to backend in live mode
      // GAP 1 FIX: use valid BackendDataSource enum value
      // GAP 2 FIX: milkForm.animalId is already the backend UUID when isLive
      if (isLive) {
        await ingestService.ingestManualLab({
          animal_id: milkForm.animalId,           // real backend UUID
          recorded_at: new Date(`${milkForm.date}T12:00:00Z`).toISOString(),
          milk_yield_l: Number(milkForm.milkYield),
          milk_temp_c: milkForm.milkTemperature ? Number(milkForm.milkTemperature) : undefined,
          milk_ec: farmMode === 'connected' ? Number(milkForm.electricalConductivity) : undefined,
          milk_ph: farmMode === 'connected' ? Number(milkForm.pH) : undefined,
          scc_value: milkForm.scc ? Number(milkForm.scc) : undefined,
          scc_unit: milkForm.scc ? '10^3/ml' : undefined,
          data_source: milkForm.dataSource,        // valid enum: 'farmer_observation' etc.
        });
      }

      const displayName = isLive
        ? (liveAnimals.find((a) => a.id === milkForm.animalId)?.tag_id ?? milkForm.animalId)
        : (localAnimal?.name ?? localAnimal?.tag);
      showToast(`Milk record logged for ${displayName}!`, 'success');
      closeModal();
      onDataChanged?.();
    } catch (err: any) {
      showToast(err?.detail || 'Failed to save milk data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle CMT Submit ─────────────────────────────────────────────────────
  const handleCmtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localAnimal = getLocalAnimalByDemoId(cmtForm.animalId);
    setSubmitting(true);
    try {
      // Save locally
      cmtService.create({
        animalId: cmtForm.animalId,
        animalTag: localAnimal?.tag ?? cmtForm.animalId,
        date: cmtForm.date,
        leftFront: cmtForm.lf,
        rightFront: cmtForm.rf,
        leftRear: cmtForm.lr,
        rightRear: cmtForm.rr,
        testerName: cmtForm.testerName,
        notes: cmtForm.notes,
      });

      // POST to backend in live mode
      // GAP 1 FIX: valid data_source enum
      // GAP 2 FIX: cmtForm.animalId is backend UUID when isLive
      // GAP 3 FIX: pack all 4 quarter results into cmt_result as a structured string
      //            Format: "LF:{lf}|RF:{rf}|LR:{lr}|RR:{rr}" — human-readable, parseable
      if (isLive) {
        const cmtResultPacked = `LF:${cmtForm.lf}|RF:${cmtForm.rf}|LR:${cmtForm.lr}|RR:${cmtForm.rr}`;
        await ingestService.ingestManualLab({
          animal_id: cmtForm.animalId,
          recorded_at: new Date(`${cmtForm.date}T12:00:00Z`).toISOString(),
          cmt_result: cmtResultPacked,            // all 4 quarters preserved
          data_source: cmtForm.dataSource,        // valid enum
        });
      }

      const displayName = isLive
        ? (liveAnimals.find((a) => a.id === cmtForm.animalId)?.tag_id ?? cmtForm.animalId)
        : (localAnimal?.name ?? localAnimal?.tag);
      showToast(`CMT test saved for ${displayName}!`, 'success');
      closeModal();
      onDataChanged?.();
    } catch (err: any) {
      showToast(err?.detail || 'Failed to save CMT record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Health Submit ──────────────────────────────────────────────────
  // GAP 4 FIX: now also POSTs to backend in live mode
  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localAnimal = getLocalAnimalByDemoId(healthForm.animalId);
    setSubmitting(true);
    try {
      // Save locally
      healthService.create({
        animalId: healthForm.animalId,
        animalTag: localAnimal?.tag ?? healthForm.animalId,
        date: healthForm.date,
        observation: healthForm.observation,
        condition: healthForm.condition,
        treatment: healthForm.treatment,
        veterinaryNotes: healthForm.veterinaryNotes,
        followUpDate: healthForm.followUpDate,
        veterinarianName: healthForm.veterinarianName,
      });

      // POST to backend via manual-lab endpoint
      // We use udder_temp_c if provided, and encode clinical notes into the cmt_result field
      if (isLive) {
        const clinicalNote = [
          healthForm.condition,
          healthForm.observation,
          `Tx: ${healthForm.treatment}`,
          healthForm.veterinaryNotes ? `Vet: ${healthForm.veterinaryNotes}` : '',
        ]
          .filter(Boolean)
          .join(' | ')
          .slice(0, 255); // keep within reasonable length

        await ingestService.ingestManualLab({
          animal_id: healthForm.animalId,
          recorded_at: new Date(`${healthForm.date}T12:00:00Z`).toISOString(),
          udder_temp_c: healthForm.udderTempC ? Number(healthForm.udderTempC) : undefined,
          cmt_result: clinicalNote || undefined,   // repurpose as clinical note field
          data_source: healthForm.dataSource,
        });
      }

      const displayName = isLive
        ? (liveAnimals.find((a) => a.id === healthForm.animalId)?.tag_id ?? healthForm.animalId)
        : (localAnimal?.tag ?? healthForm.animalId);
      showToast(`Health record logged for ${displayName}!`, 'success');
      closeModal();
      onDataChanged?.();
    } catch (err: any) {
      showToast(err?.detail || 'Failed to save health record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedOverallCMT = cmtService.calculateOverallResult({
    lf: cmtForm.lf,
    rf: cmtForm.rf,
    lr: cmtForm.lr,
    rr: cmtForm.rr,
  });

  const quarterOptions: CMTQuarterResult[] = ['negative', 'trace', '1+', '2+', '3+'];

  // ── Animal selector shared render helper ───────────────────────────────────
  const renderAnimalSelector = (
    value: string,
    onChange: (id: string) => void,
  ) => (
    <div>
      <label className="block font-semibold text-[#403129] mb-1">
        Select Animal *{isLive && <span className="text-[#8A5B3D] ml-1">(Backend)</span>}
      </label>
      {loadingAnimals ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F9F8F6] border border-[#D9CFC7] rounded-xl text-[#746E68]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading animals…</span>
        </div>
      ) : isLive && animalOptions.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <WifiOff className="w-3.5 h-3.5" />
          <span className="text-[11px]">No backend animals found. Check farm assignment.</span>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
        >
          {animalOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tag}{a.name !== a.tag ? ` — ${a.name}` : ''} ({a.species})
            </option>
          ))}
        </select>
      )}
    </div>
  );

  // ── Data source selector ──────────────────────────────────────────────────
  const renderDataSourceSelector = (
    value: BackendDataSource,
    onChange: (v: BackendDataSource) => void,
  ) => (
    <div>
      <label className="block font-semibold text-[#403129] mb-1">
        Data Source <span className="text-[10px] font-normal text-[#746E68]">(for backend record)</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BackendDataSource)}
        className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
      >
        {(Object.entries(DATA_SOURCE_LABELS) as [BackendDataSource, string][]).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#D9CFC7] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#EFE9E3] border-b border-[#D9CFC7] flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base text-[#403129]">
              {activeModal === 'add_animal' && 'Register New Livestock'}
              {activeModal === 'add_milk'   && 'Record Milking & Milk Quality'}
              {activeModal === 'add_cmt'    && 'California Mastitis Test (CMT) 4-Quarter Log'}
              {activeModal === 'add_health' && 'Log Veterinary Observation & Treatment'}
            </h3>
            <span className="text-[11px] text-[#746E68]">
              GoDrishti · {isLive ? '🟢 Saves to Backend' : '🟡 Demo Mode (localStorage)'}
            </span>
          </div>
          <button onClick={closeModal} className="p-1 rounded-lg text-[#746E68] hover:bg-[#D9CFC7]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">

          {/* ─── 1. ADD ANIMAL FORM ─────────────────────────────────────────── */}
          {activeModal === 'add_animal' && (
            <form onSubmit={handleAnimalSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Tag / RFID *</label>
                  <input type="text" required value={animalForm.tag}
                    onChange={(e) => setAnimalForm({ ...animalForm, tag: e.target.value })}
                    placeholder="e.g. F01_COW_015"
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl focus:border-[#8A5B3D] outline-hidden bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Name / Identifier *</label>
                  <input type="text" required value={animalForm.name}
                    onChange={(e) => setAnimalForm({ ...animalForm, name: e.target.value })}
                    placeholder="e.g. Yashoda (यशोदा)"
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl focus:border-[#8A5B3D] outline-hidden bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Species *</label>
                  <select value={animalForm.species}
                    onChange={(e) => {
                      const sp = e.target.value as Species;
                      setAnimalForm({ ...animalForm, species: sp, breed: sp === 'cow' ? 'Gir (गीर)' : 'Murrah (मुर्राह)' });
                    }}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  >
                    <option value="cow">Cow (गाय)</option>
                    <option value="buffalo">Buffalo (भैंस)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Breed *</label>
                  <input type="text" required value={animalForm.breed}
                    onChange={(e) => setAnimalForm({ ...animalForm, breed: e.target.value })}
                    placeholder="e.g. Sahiwal / Murrah"
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Age (Years)</label>
                  <input type="number" step="0.5" value={animalForm.ageYears}
                    onChange={(e) => setAnimalForm({ ...animalForm, ageYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Lactation #</label>
                  <input type="number" value={animalForm.lactationNumber}
                    onChange={(e) => setAnimalForm({ ...animalForm, lactationNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Days In Milk</label>
                  <input type="number" value={animalForm.daysInMilk}
                    onChange={(e) => setAnimalForm({ ...animalForm, daysInMilk: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Avg Yield (L/day)</label>
                  <input type="number" step="0.1" value={animalForm.avgDailyYieldLiters}
                    onChange={(e) => setAnimalForm({ ...animalForm, avgDailyYieldLiters: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Smart Collar ID</label>
                  <input type="text" value={animalForm.collarId}
                    onChange={(e) => setAnimalForm({ ...animalForm, collarId: e.target.value })}
                    placeholder="e.g. DEV-COL-08"
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              {!isLive && (
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Farm / Shed Cluster</label>
                  <input type="text" value={animalForm.farm}
                    onChange={(e) => setAnimalForm({ ...animalForm, farm: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              )}

              {isLive && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                  Farm: <strong>{activeFarmId?.slice(0, 8)}…</strong> · Animal will be created in backend and linked to this farm.
                </div>
              )}

              <div className="p-3 bg-[#EFE9E3]/70 rounded-xl text-[11px] text-[#746E68]">
                <strong>Notice:</strong> Baseline values for DS18B20 skin temperature and MAX9814 acoustic rumination will calibrate across the first 7 days.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Register Animal</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── 2. ADD MILK FORM ────────────────────────────────────────────── */}
          {activeModal === 'add_milk' && (
            <form onSubmit={handleMilkSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {renderAnimalSelector(milkForm.animalId, (id) => setMilkForm({ ...milkForm, animalId: id }))}
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Milking Date</label>
                  <input type="date" value={milkForm.date}
                    onChange={(e) => setMilkForm({ ...milkForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Milk Yield (Liters) *</label>
                  <input type="number" step="0.1" required value={milkForm.milkYield}
                    onChange={(e) => setMilkForm({ ...milkForm, milkYield: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Milk Temp (°C)</label>
                  <input type="number" step="0.1" value={milkForm.milkTemperature}
                    onChange={(e) => setMilkForm({ ...milkForm, milkTemperature: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              {farmMode === 'connected' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Electrical Cond. (mS/cm)</label>
                    <input type="number" step="0.1" value={milkForm.electricalConductivity}
                      onChange={(e) => setMilkForm({ ...milkForm, electricalConductivity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white"
                    />
                    <span className="text-[10px] text-emerald-700">Healthy: 5.0 – 5.5</span>
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Milk pH</label>
                    <input type="number" step="0.01" value={milkForm.pH}
                      onChange={(e) => setMilkForm({ ...milkForm, pH: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl bg-white"
                    />
                    <span className="text-[10px] text-emerald-700">Healthy: 6.6 – 6.8</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-[#EFE9E3]/70 rounded-xl text-[11px] text-[#746E68]">
                  <em>Low-Resource Mode:</em> Inline EC & pH omitted. Relying on yield deviations & visual observation.
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#403129] mb-1">SCC (×10³ cells/mL)</label>
                <input type="number" value={milkForm.scc}
                  onChange={(e) => setMilkForm({ ...milkForm, scc: Number(e.target.value) })}
                  placeholder="e.g. 180"
                  className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                />
                <span className="text-[10px] text-[#746E68]">Not measured by collars — enter lab/rapid test result.</span>
              </div>

              <div>
                <label className="block font-semibold text-[#403129] mb-1">Visual Observations / Notes</label>
                <textarea rows={2} value={milkForm.notes}
                  onChange={(e) => setMilkForm({ ...milkForm, notes: e.target.value })}
                  placeholder="e.g. Clear milk, no flakes, normal letdown"
                  className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                />
              </div>

              {isLive && renderDataSourceSelector(milkForm.dataSource, (v) => setMilkForm({ ...milkForm, dataSource: v }))}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting || (isLive && animalOptions.length === 0)}
                  className="px-5 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Milk Data</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── 3. ADD CMT FORM ─────────────────────────────────────────────── */}
          {activeModal === 'add_cmt' && (
            <form onSubmit={handleCmtSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {renderAnimalSelector(cmtForm.animalId, (id) => setCmtForm({ ...cmtForm, animalId: id }))}
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Test Date</label>
                  <input type="date" value={cmtForm.date}
                    onChange={(e) => setCmtForm({ ...cmtForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#403129] mb-1.5">CMT 4-Quarter Paddle Readings:</label>
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#EFE9E3]/70 border border-[#D9CFC7] rounded-2xl">
                  {([['lf', t.leftFront], ['rf', t.rightFront], ['lr', t.leftRear], ['rr', t.rightRear]] as [keyof typeof cmtForm, string][]).map(([key, label]) => (
                    <div key={key} className="bg-white p-2.5 rounded-xl border border-[#D9CFC7]">
                      <div className="font-bold text-[#403129] mb-1 text-[11px]">{label}</div>
                      <select
                        value={cmtForm[key] as string}
                        onChange={(e) => setCmtForm({ ...cmtForm, [key]: e.target.value as CMTQuarterResult })}
                        className="w-full p-1.5 border border-[#D9CFC7] rounded-lg bg-[#F9F8F6] text-xs font-semibold"
                      >
                        {quarterOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.toUpperCase()} {opt === 'negative' ? '(Clear)' : opt === 'trace' ? '(Precipitate)' : '(Gel)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall result badge */}
              <div className="p-3 bg-white border-2 border-[#8A5B3D]/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#746E68] uppercase font-bold tracking-wider">{t.overallResult}</span>
                  <div className="text-sm font-extrabold text-[#403129]">{calculatedOverallCMT}</div>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                  calculatedOverallCMT === 'Negative' ? 'bg-emerald-100 text-emerald-800' :
                  calculatedOverallCMT === 'Trace' ? 'bg-blue-100 text-blue-800' :
                  calculatedOverallCMT.includes('Subclinical') ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {calculatedOverallCMT === 'Negative' ? 'Healthy' : 'Investigate'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Tester Name / Role</label>
                  <input type="text" value={cmtForm.testerName}
                    onChange={(e) => setCmtForm({ ...cmtForm, testerName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Field Notes</label>
                  <input type="text" value={cmtForm.notes}
                    onChange={(e) => setCmtForm({ ...cmtForm, notes: e.target.value })}
                    placeholder="e.g. Swirl 20s per paddle"
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              {isLive && (
                <>
                  {renderDataSourceSelector(cmtForm.dataSource, (v) => setCmtForm({ ...cmtForm, dataSource: v }))}
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                    All 4 quarter results will be saved to backend as: <code className="font-mono">LF:{cmtForm.lf}|RF:{cmtForm.rf}|LR:{cmtForm.lr}|RR:{cmtForm.rr}</code>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting || (isLive && animalOptions.length === 0)}
                  className="px-5 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save CMT Record</span>
                </button>
              </div>
            </form>
          )}

          {/* ─── 4. ADD HEALTH FORM ──────────────────────────────────────────── */}
          {activeModal === 'add_health' && (
            <form onSubmit={handleHealthSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {renderAnimalSelector(healthForm.animalId, (id) => setHealthForm({ ...healthForm, animalId: id }))}
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Date</label>
                  <input type="date" value={healthForm.date}
                    onChange={(e) => setHealthForm({ ...healthForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#403129] mb-1">Physical Observation *</label>
                <textarea required rows={2} value={healthForm.observation}
                  onChange={(e) => setHealthForm({ ...healthForm, observation: e.target.value })}
                  placeholder="e.g. Swollen LR quarter, warm to touch, reluctant letdown"
                  className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Suspected Condition</label>
                  <input type="text" value={healthForm.condition}
                    onChange={(e) => setHealthForm({ ...healthForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Treatment / Intervention</label>
                  <input type="text" value={healthForm.treatment}
                    onChange={(e) => setHealthForm({ ...healthForm, treatment: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#403129] mb-1">Veterinary Notes</label>
                <textarea rows={2} value={healthForm.veterinaryNotes}
                  onChange={(e) => setHealthForm({ ...healthForm, veterinaryNotes: e.target.value })}
                  placeholder="e.g. Disinfect milking cups; re-screen in 48 hours."
                  className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Veterinarian / Para-vet</label>
                  <input type="text" value={healthForm.veterinarianName}
                    onChange={(e) => setHealthForm({ ...healthForm, veterinarianName: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#403129] mb-1">Follow-Up Date</label>
                  <input type="date" value={healthForm.followUpDate}
                    onChange={(e) => setHealthForm({ ...healthForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                  />
                </div>
              </div>

              {isLive && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#403129] mb-1">Udder Temp (°C) <span className="text-[#746E68] font-normal">(if measured)</span></label>
                    <input type="number" step="0.1" value={healthForm.udderTempC}
                      onChange={(e) => setHealthForm({ ...healthForm, udderTempC: e.target.value })}
                      placeholder="e.g. 38.5"
                      className="w-full px-3 py-2 border border-[#D9CFC7] rounded-xl bg-[#F9F8F6]"
                    />
                  </div>
                  <div className="flex items-end pb-0.5">
                    {renderDataSourceSelector(healthForm.dataSource, (v) => setHealthForm({ ...healthForm, dataSource: v }))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 bg-[#EFE9E3] hover:bg-[#D9CFC7] text-[#403129] rounded-xl font-semibold">
                  {t.cancel}
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[#8A5B3D] hover:bg-[#403129] disabled:bg-[#C9B59C] text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Health Record</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
