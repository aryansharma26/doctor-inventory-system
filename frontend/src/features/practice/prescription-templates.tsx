import {
  Activity,
  Droplets,
  Flame,
  Heart,
  Pill,
  Shield,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
}

interface PrescriptionTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (medicines: Medicine[]) => void;
}

interface Template {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  medicines: Medicine[];
}

const templates: Template[] = [
  {
    id: "fever-flu",
    name: "Fever & Flu Protocol",
    icon: Flame,
    description: "Standard treatment for common flu and fever symptoms.",
    medicines: [
      {
        name: "Biogesic",
        dosage: "500mg",
        frequency: "Every 4 hours",
        timing: "As needed for fever",
        duration: "3 days",
      },
      {
        name: "Neozep Forte",
        dosage: "1 tab",
        frequency: "Every 6 hours",
        timing: "After meals",
        duration: "3-5 days",
      },
      {
        name: "Solmux",
        dosage: "500mg",
        frequency: "Every 8 hours",
        timing: "After meals",
        duration: "7 days",
      },
    ],
  },
  {
    id: "htn-std",
    name: "Hypertension Standard",
    icon: Heart,
    description: "Maintenance combination for uncomplicated hypertension.",
    medicines: [
      {
        name: "Losartan",
        dosage: "50mg",
        frequency: "Once daily",
        timing: "Morning",
        duration: "30 days",
      },
      {
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        timing: "Bedtime",
        duration: "30 days",
      },
    ],
  },
  {
    id: "dm2",
    name: "Diabetes Type 2",
    icon: Activity,
    description: "First-line combination therapy for Type 2 Diabetes.",
    medicines: [
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        timing: "With meals",
        duration: "30 days",
      },
      {
        name: "Glimepiride",
        dosage: "2mg",
        frequency: "Once daily",
        timing: "Before breakfast",
        duration: "30 days",
      },
    ],
  },
  {
    id: "uti",
    name: "UTI Treatment",
    icon: Droplets,
    description:
      "Antibiotic therapy with adjunct for urinary tract infections.",
    medicines: [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "Every 8 hours",
        timing: "After meals",
        duration: "7 days",
      },
      {
        name: "Cranberry Extract",
        dosage: "1 cap",
        frequency: "Twice daily",
        timing: "With meals",
        duration: "14 days",
      },
    ],
  },
  {
    id: "gerd",
    name: "Gastric/GERD Relief",
    icon: Zap,
    description: "PPI plus antacid for hyperacidity and GERD management.",
    medicines: [
      {
        name: "Omeprazole",
        dosage: "20mg",
        frequency: "Once daily",
        timing: "30 mins before breakfast",
        duration: "14 days",
      },
      {
        name: "Kremil-S",
        dosage: "1 tab",
        frequency: "As needed",
        timing: "After meals or at bedtime",
        duration: "As needed",
      },
    ],
  },
  {
    id: "pain",
    name: "Pain & Inflammation",
    icon: Pill,
    description: "NSAID and analgesic for moderate to severe pain.",
    medicines: [
      {
        name: "Alaxan FR",
        dosage: "1 cap",
        frequency: "Every 8 hours",
        timing: "After meals",
        duration: "5 days",
      },
      {
        name: "Tramadol",
        dosage: "50mg",
        frequency: "Every 6 hours",
        timing: "As needed for severe pain",
        duration: "3 days",
      },
    ],
  },
  {
    id: "allergy",
    name: "Allergy Relief",
    icon: Shield,
    description: "Antihistamine combo for allergic rhinitis or skin allergies.",
    medicines: [
      {
        name: "Cetirizine",
        dosage: "10mg",
        frequency: "Once daily",
        timing: "Bedtime",
        duration: "7 days",
      },
      {
        name: "Iterax",
        dosage: "25mg",
        frequency: "As needed",
        timing: "For severe itching",
        duration: "3 days",
      },
    ],
  },
  {
    id: "respiratory",
    name: "Respiratory Infection",
    icon: Wind,
    description:
      "Macrolide antibiotic with bronchodilator for respiratory issues.",
    medicines: [
      {
        name: "Azithromycin",
        dosage: "500mg",
        frequency: "Once daily",
        timing: "1 hour before or 2 hours after meal",
        duration: "3 days",
      },
      {
        name: "Salbutamol",
        dosage: "2mg",
        frequency: "Every 6-8 hours",
        timing: "As needed for wheezing",
        duration: "5 days",
      },
    ],
  },
];

export function PrescriptionTemplatesModal({
  isOpen,
  onClose,
  onApplyTemplate,
}: PrescriptionTemplatesModalProps) {
  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const handleApply = (medicines: Medicine[]) => {
    onApplyTemplate(medicines);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Prescription Templates
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Quickly apply standard treatment protocols
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50 hover:bg-white group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <template.icon size={24} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                    {template.medicines.length} Meds
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 h-10">
                  {template.description}
                </p>
                <div className="space-y-1 mb-5 h-16 overflow-hidden">
                  {template.medicines.slice(0, 2).map((med, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-500 flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {med.name} {med.dosage}
                    </div>
                  ))}
                  {template.medicines.length > 2 && (
                    <div className="text-xs text-gray-400 italic pl-3.5">
                      + {template.medicines.length - 2} more
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleApply(template.medicines)}
                  className="w-full py-2 px-4 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Apply Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce z-50">
          <Zap size={20} />
          <span className="font-medium">Template applied!</span>
        </div>
      )}
    </div>
  );
}
