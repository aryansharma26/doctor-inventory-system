import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
  Pill,
  Shield,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

interface PatientHistoryPanelProps {
  patientName: string;
  patientId: string;
  phone: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientHistoryPanel({
  patientName,
  patientId,
  phone,
  isOpen,
  onClose,
}: PatientHistoryPanelProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    visits: true,
    allergies: true,
    conditions: false,
    prescriptions: false,
    vitals: false,
    insurance: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-900 text-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div>
            <h2 className="text-xl font-semibold">{patientName}</h2>
            <p className="text-sm text-gray-400">
              ID: {patientId} | {phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Allergies */}
          <Section
            title="Active Allergies"
            icon={<AlertTriangle size={18} className="text-yellow-500" />}
            isExpanded={expandedSections.allergies}
            onToggle={() => toggleSection("allergies")}
          >
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900/50 text-red-400 border border-red-800">
                Penicillin (Severe)
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-900/50 text-yellow-400 border border-yellow-800">
                Peanuts (Moderate)
              </span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900/50 text-blue-400 border border-blue-800">
                Dust (Mild)
              </span>
            </div>
          </Section>

          {/* Visit Timeline */}
          <Section
            title="Visit Timeline"
            icon={<Clock size={18} className="text-blue-400" />}
            isExpanded={expandedSections.visits}
            onToggle={() => toggleSection("visits")}
          >
            <div className="space-y-4 border-l-2 border-gray-700 ml-2 pl-4">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <p className="text-sm font-medium">Oct 15, 2023</p>
                <p className="text-xs text-gray-400">Dr. Sarah Jenkins</p>
                <p className="text-sm mt-1 text-gray-300">
                  Routine Checkup, Hypertension Follow-up
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                <p className="text-sm font-medium">May 22, 2023</p>
                <p className="text-xs text-gray-400">Dr. Sarah Jenkins</p>
                <p className="text-sm mt-1 text-gray-300">
                  Viral Fever, Prescribed Paracetamol
                </p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
                <p className="text-sm font-medium">Jan 10, 2023</p>
                <p className="text-xs text-gray-400">Dr. Mike Ross</p>
                <p className="text-sm mt-1 text-gray-300">
                  Initial Consultation
                </p>
              </div>
            </div>
          </Section>

          {/* Chronic Conditions */}
          <Section
            title="Chronic Conditions"
            icon={<Heart size={18} className="text-red-400" />}
            isExpanded={expandedSections.conditions}
            onToggle={() => toggleSection("conditions")}
          >
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li>Hypertension (Diagnosed 2021)</li>
              <li>Type 2 Diabetes (Diagnosed 2022)</li>
            </ul>
          </Section>

          {/* Past Prescriptions */}
          <Section
            title="Past Prescriptions"
            icon={<Pill size={18} className="text-green-400" />}
            isExpanded={expandedSections.prescriptions}
            onToggle={() => toggleSection("prescriptions")}
          >
            <div className="space-y-3">
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <p className="text-sm font-medium">Amlodipine 5mg</p>
                <p className="text-xs text-gray-400">
                  1 tablet daily (Oct 15, 2023)
                </p>
              </div>
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <p className="text-sm font-medium">Metformin 500mg</p>
                <p className="text-xs text-gray-400">
                  Twice a day with meals (Oct 15, 2023)
                </p>
              </div>
              <div className="bg-gray-800 p-2 rounded border border-gray-700">
                <p className="text-sm font-medium">Paracetamol 500mg</p>
                <p className="text-xs text-gray-400">
                  As needed for fever (May 22, 2023)
                </p>
              </div>
            </div>
          </Section>

          {/* Vitals Trend */}
          <Section
            title="Vitals Trend"
            icon={<Activity size={18} className="text-purple-400" />}
            isExpanded={expandedSections.vitals}
            onToggle={() => toggleSection("vitals")}
          >
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between border-b border-gray-700 pb-1">
                <span>Oct 15, 2023</span>
                <span className="font-medium text-yellow-400">135/85 mmHg</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-1">
                <span>May 22, 2023</span>
                <span className="font-medium">120/80 mmHg</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-1">
                <span>Jan 10, 2023</span>
                <span className="font-medium text-red-400">145/90 mmHg</span>
              </div>
            </div>
          </Section>

          {/* Insurance Info */}
          <Section
            title="Insurance Info"
            icon={<Shield size={18} className="text-indigo-400" />}
            isExpanded={expandedSections.insurance}
            onToggle={() => toggleSection("insurance")}
          >
            <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
              <p className="text-gray-400">
                Provider: <span className="text-gray-200">PhilHealth</span>
              </p>
              <p className="text-gray-400">
                Member ID: <span className="text-gray-200">12-3456789-0</span>
              </p>
              <p className="text-gray-400 mt-2">
                Status:{" "}
                <span className="text-green-400 font-medium">Active</span>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-sm text-gray-200">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="p-3 bg-gray-800/30">{children}</div>}
    </div>
  );
}
