import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Users,
  Search,
  UserPlus,
  HeartPulse,
  AlertTriangle,
  Calendar,
  FileText,
  IndianRupee,
  Phone,
  Send,
  Plus,
  CheckCircle,
  Receipt,
  Clock,
  Sparkles,
  CreditCard,
  Building
} from 'lucide-react';
import { Patient, PrescriptionRecord } from '../types/pharmacy';

export const PatientManagement: React.FC = () => {
  const {
    patients,
    addPatient,
    updatePatient,
    addPrescription,
    settleCredit,
    sendRefillAlert,
    setActiveTab
  } = usePharma();

  // Search and selected patient state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [showAddRxModal, setShowAddRxModal] = useState<boolean>(false);
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleNote, setSettleNote] = useState<string>('Counter Cash Settlement');

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    age: 45,
    gender: 'Male' as Patient['gender'],
    bloodGroup: 'B+' as Patient['bloodGroup'],
    address: '',
    knownAllergies: '',
    chronicConditions: '',
    creditLimit: 5000
  });

  // New Prescription Form State
  const [newRx, setNewRx] = useState({
    doctorName: '',
    clinicHospital: '',
    doctorRegNo: '',
    diagnosis: '',
    nextRefillDate: '',
    medicineName: '',
    dosage: '1 Tab daily after meals',
    durationDays: 30
  });

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.chronicConditions.some((c) => c.toLowerCase().includes(q))
    );
  });

  const activePatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim() || !newPatient.phone.trim()) return;

    const created = await addPatient({
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email || undefined,
      age: Number(newPatient.age),
      gender: newPatient.gender,
      bloodGroup: newPatient.bloodGroup,
      address: newPatient.address || 'Local Resident',
      knownAllergies: newPatient.knownAllergies
        ? newPatient.knownAllergies.split(',').map((s) => s.trim())
        : [],
      chronicConditions: newPatient.chronicConditions
        ? newPatient.chronicConditions.split(',').map((s) => s.trim())
        : [],
      creditBalance: 0,
      creditLimit: Number(newPatient.creditLimit)
    });

    setSelectedPatientId(created.id);
    setShowAddPatientModal(false);
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newRx.doctorName.trim() || !newRx.medicineName.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];

    addPrescription(activePatient.id, {
      date: todayStr,
      doctorName: newRx.doctorName,
      clinicHospital: newRx.clinicHospital || 'Consulting Clinic',
      doctorRegNo: newRx.doctorRegNo || 'REG-PENDING',
      diagnosis: newRx.diagnosis || 'General Consultation',
      nextRefillDate: newRx.nextRefillDate || undefined,
      medicines: [
        {
          medicineName: newRx.medicineName,
          dosage: newRx.dosage,
          durationDays: Number(newRx.durationDays),
          refillRemaining: 3
        }
      ]
    });

    setShowAddRxModal(false);
    setNewRx({
      doctorName: '',
      clinicHospital: '',
      doctorRegNo: '',
      diagnosis: '',
      nextRefillDate: '',
      medicineName: '',
      dosage: '1 Tab daily after meals',
      durationDays: 30
    });
  };

  const handleSettleKhata = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || settleAmount <= 0) return;
    settleCredit(activePatient.id, settleAmount, settleNote);
    setShowSettleModal(false);
    setSettleAmount(0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Patient CRM, Khata Ledger & Chronic Care Refills
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
              {patients.length} Registered Patients
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prescription history, drug allergy warnings, chronic dosage refill tracking, and customer credit ledger.
          </p>
        </div>

        <button
          onClick={() => setShowAddPatientModal(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (4 cols): Patient Master List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col h-[700px]">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Mobile, UHID, Disease..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Patient Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 pr-1">
            {filteredPatients.map((patient) => {
              const isSelected = activePatient?.id === patient.id;
              const hasDue = patient.creditBalance > 0;

              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`p-3 rounded-lg cursor-pointer transition select-none my-1 ${
                    isSelected
                      ? 'bg-teal-950/60 border border-teal-500/80 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                        <span>{patient.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({patient.age}y/{patient.gender[0]})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {patient.phone}
                      </div>
                    </div>

                    <span className="text-[10px] text-teal-400 font-mono font-medium">
                      {patient.uhid}
                    </span>
                  </div>

                  {/* Conditions & Dues Badges */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {patient.chronicConditions.slice(0, 2).map((c, i) => (
                        <span
                          key={i}
                          className="bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded border border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    {hasDue ? (
                      <span className="font-mono font-bold text-amber-400">
                        Due: ₹{patient.creditBalance.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-mono">No Dues</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Selected Patient Dossier */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          {activePatient ? (
            <div className="space-y-5">
              {/* Patient Top Overview Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {activePatient.name}
                    </h3>
                    <span className="bg-teal-950 text-teal-300 border border-teal-800 text-xs px-2 py-0.5 rounded font-mono">
                      {activePatient.uhid}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      {activePatient.phone}
                    </span>
                    <span>•</span>
                    <span>Age: <strong className="text-slate-200">{activePatient.age} Yrs</strong> ({activePatient.gender})</span>
                    <span>•</span>
                    <span>Blood Group: <strong className="text-rose-400">{activePatient.bloodGroup}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    Address: {activePatient.address}
                  </div>
                </div>

                {/* Khata Balance Box */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-right min-w-[180px]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Khata Credit Balance
                  </div>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${
                    activePatient.creditBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    ₹{activePatient.creditBalance.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Limit: ₹{activePatient.creditLimit.toFixed(0)}
                  </div>

                  {activePatient.creditBalance > 0 && (
                    <button
                      onClick={() => {
                        setSettleAmount(activePatient.creditBalance);
                        setShowSettleModal(true);
                      }}
                      className="mt-2 w-full py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] rounded transition cursor-pointer"
                    >
                      Collect Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Medical Warnings: Allergies & Chronic Conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Allergies Box */}
                <div className="p-3 bg-rose-950/20 border border-rose-900/60 rounded-xl text-xs">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Known Drug Allergies (Safety Alert)</span>
                  </div>
                  {activePatient.knownAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.knownAllergies.map((allergy, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-900/80 text-rose-100 font-semibold px-2 py-0.5 rounded text-[11px] border border-rose-700"
                        >
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No known drug contraindications recorded.</span>
                  )}
                </div>

                {/* Chronic Conditions Box */}
                <div className="p-3 bg-cyan-950/20 border border-cyan-900/60 rounded-xl text-xs">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                    <HeartPulse className="w-4 h-4 text-cyan-400" />
                    <span>Chronic Health Conditions</span>
                  </div>
                  {activePatient.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activePatient.chronicConditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="bg-cyan-900/60 text-cyan-200 font-medium px-2 py-0.5 rounded text-[11px] border border-cyan-700"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No active chronic illness registered.</span>
                  )}
                </div>
              </div>

              {/* Prescription History & Chronic Refill Alert Engine */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Prescription History & Repeat Refill Tracker
                    </h4>
                  </div>

                  <button
                    onClick={() => setShowAddRxModal(true)}
                    className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Log Prescription</span>
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {activePatient.prescriptions.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No prescriptions on record. Click "+ Log Prescription" to add doctor notes.
                    </div>
                  ) : (
                    activePatient.prescriptions.map((rx) => (
                      <div
                        key={rx.id}
                        className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-bold text-white text-xs">{rx.doctorName}</span>
                            <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                              {rx.clinicHospital} • Reg: {rx.doctorRegNo}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Rx Date: {rx.date}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800/80">
                          <span className="text-teal-400 font-medium">Diagnosis:</span> {rx.diagnosis}
                        </div>

                        {/* Prescribed Medicines Grid */}
                        <div className="space-y-1.5">
                          {rx.medicines.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded bg-slate-900 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                            >
                              <div>
                                <span className="font-bold text-white">{m.medicineName}</span>
                                <span className="text-[11px] text-cyan-300 ml-2">({m.dosage})</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {m.durationDays} Days Dose
                                </span>

                                <button
                                  onClick={() => sendRefillAlert(activePatient.id, m.medicineName)}
                                  className="flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[10px] px-2 py-1 rounded transition cursor-pointer"
                                  title="Send WhatsApp dosage refill reminder"
                                >
                                  <Send className="w-3 h-3 text-emerald-400" />
                                  <span>WhatsApp Refill Alert</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {rx.nextRefillDate && (
                          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                            <span>Next Refill Estimated: <strong className="text-amber-400 font-mono">{rx.nextRefillDate}</strong></span>
                            <span className="text-emerald-400">Marg Automated Refill Alert Ready</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500">
              Select or register a patient on the left panel.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Register New Patient */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-xs text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                Register New Patient Master Record
              </h3>
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98111 22334"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Gender
                  </label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, gender: e.target.value as Patient['gender'] })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                    Blood Group
                  </label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        bloodGroup: e.target.value as Patient['bloodGroup']
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Flat / Locality"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-rose-300 uppercase block mb-1">
                  Known Drug Allergies (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  value={newPatient.knownAllergies}
                  onChange={(e) => setNewPatient({ ...newPatient, knownAllergies: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-rose-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-cyan-300 uppercase block mb-1">
                  Chronic Health Conditions (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  value={newPatient.chronicConditions}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, chronicConditions: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-cyan-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  Khata Credit Limit (₹)
                </label>
                <input
                  type="number"
                  value={newPatient.creditLimit}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, creditLimit: Number(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Log Prescription */}
      {showAddRxModal && activePatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Log Prescription for {activePatient.name}
              </h3>
              <button
                onClick={() => setShowAddRxModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Doctor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. S. K. Gupta, MD"
                    value={newRx.doctorName}
                    onChange={(e) => setNewRx({ ...newRx, doctorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Doctor Reg No (Mandatory)
                  </label>
                  <input
                    type="text"
                    placeholder="DMC-98124"
                    value={newRx.doctorRegNo}
                    onChange={(e) => setNewRx({ ...newRx, doctorRegNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Diagnosis / Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uncontrolled Fasting Sugar, BP 150/95"
                  value={newRx.diagnosis}
                  onChange={(e) => setNewRx({ ...newRx, diagnosis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-semibold text-teal-400 block">
                  Primary Medicine & Dosage Regimen
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Glycomet GP 2"
                      value={newRx.medicineName}
                      onChange={(e) => setNewRx({ ...newRx, medicineName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Daily Dosage</label>
                    <input
                      type="text"
                      placeholder="1-0-1 after food"
                      value={newRx.dosage}
                      onChange={(e) => setNewRx({ ...newRx, dosage: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Supply Duration (Days)</label>
                    <input
                      type="number"
                      value={newRx.durationDays}
                      onChange={(e) => setNewRx({ ...newRx, durationDays: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Next Refill Expected</label>
                    <input
                      type="date"
                      value={newRx.nextRefillDate}
                      onChange={(e) => setNewRx({ ...newRx, nextRefillDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRxModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Settle Khata Credit */}
      {showSettleModal && activePatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                Collect Khata Due Payment
              </h3>
              <button
                onClick={() => setShowSettleModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleKhata} className="space-y-3 mt-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <div className="text-slate-400">Total Outstanding Balance:</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  ₹{activePatient.creditBalance.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={activePatient.creditBalance}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Payment Mode / Note
                </label>
                <input
                  type="text"
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
