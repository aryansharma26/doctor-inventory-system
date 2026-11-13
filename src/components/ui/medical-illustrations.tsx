import React from "react";

/**
 * Handcrafted clinical SVG sketches and line illustrations
 * with gentle pastel watercolor-like fills for a soothing, premium healthcare feel.
 */

export function DoctorDeskSketch({ className = "w-48 h-48" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Pastel Glow Blobs */}
      <ellipse cx="120" cy="110" rx="90" ry="70" fill="#f0fdfa" />
      <ellipse cx="150" cy="85" rx="50" ry="40" fill="#ecfdf5" opacity="0.8" />
      <circle cx="80" cy="130" r="35" fill="#f0f9ff" opacity="0.9" />

      {/* Medical Clipboard / Case File */}
      <rect
        x="60"
        y="35"
        width="115"
        height="140"
        rx="10"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Clip top */}
      <rect
        x="95"
        y="25"
        width="45"
        height="18"
        rx="4"
        fill="#e6fffa"
        stroke="#0d9488"
        strokeWidth="2"
      />
      <circle cx="117.5" cy="30" r="3" fill="#0d9488" />

      {/* Case Sheet Lines */}
      <line x1="80" y1="65" x2="155" y2="65" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80" y1="82" x2="140" y2="82" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="98" x2="160" y2="98" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

      {/* Rx Prescription Symbol */}
      <path
        d="M80 120 V145 M80 120 H92 C97 120 100 124 100 128 C100 132 97 135 92 135 H80 M88 132 L99 146"
        stroke="#0f766e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="108" y1="126" x2="155" y2="126" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" />
      <line x1="108" y1="138" x2="145" y2="138" stroke="#99f6e4" strokeWidth="2.5" strokeLinecap="round" />

      {/* Stethoscope gracefully draped */}
      {/* Binaural earpieces */}
      <path
        d="M140 40 C145 20 175 20 178 45 C180 65 170 85 155 105"
        stroke="#334155"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="140" cy="40" r="3.5" fill="#0f766e" />
      <circle cx="178" cy="45" r="3.5" fill="#0f766e" />

      {/* Flexible Tubing down and around */}
      <path
        d="M155 105 C145 125 150 160 175 165 C195 170 210 150 205 130 C200 115 185 118 185 125"
        stroke="#0d9488"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Chestpiece / Bell & Diaphragm */}
      <circle cx="185" cy="125" r="14" fill="#ffffff" stroke="#0f766e" strokeWidth="2.5" />
      <circle cx="185" cy="125" r="8" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" />
      <circle cx="185" cy="125" r="3" fill="#0f766e" />

      {/* Gentle Floating Plus Crosses */}
      <path d="M45 60 H55 M50 55 V65" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
      <path d="M195 40 H203 M199 36 V44" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 150 H58 M54 146 V154" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ReceptionDeskSketch({ className = "w-48 h-48" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft Pastel Background Blobs */}
      <ellipse cx="120" cy="115" rx="85" ry="65" fill="#f0f9ff" />
      <circle cx="75" cy="80" r="45" fill="#f0fdfa" opacity="0.8" />
      <circle cx="170" cy="130" r="40" fill="#ecfdf5" opacity="0.7" />

      {/* Front Desk Surface */}
      <path
        d="M30 145 C30 145 70 140 120 140 C170 140 210 145 210 145 L200 165 H40 L30 145 Z"
        fill="#ffffff"
        stroke="#0284c7"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Front Panel */}
      <rect
        x="42"
        y="165"
        width="156"
        height="22"
        rx="4"
        fill="#e0f2fe"
        stroke="#0284c7"
        strokeWidth="2"
      />
      <line x1="70" y1="176" x2="170" y2="176" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />

      {/* Receptionist Computer / All-in-One Monitor */}
      <rect
        x="95"
        y="80"
        width="65"
        height="48"
        rx="5"
        fill="#ffffff"
        stroke="#334155"
        strokeWidth="2.2"
      />
      <rect x="101" y="86" width="53" height="36" rx="2" fill="#f8fafc" />
      {/* Screen contents - Queue table preview */}
      <rect x="106" y="91" width="30" height="4" rx="1" fill="#0284c7" />
      <rect x="106" y="99" width="43" height="3" rx="1" fill="#94a3b8" />
      <rect x="106" y="105" width="38" height="3" rx="1" fill="#cbd5e1" />
      <rect x="106" y="111" width="28" height="3" rx="1" fill="#10b981" />

      {/* Monitor Stand */}
      <path d="M127 128 V140 M118 140 H136" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

      {/* Token Ticket Dispenser / Check-in Pad */}
      <rect
        x="55"
        y="110"
        width="28"
        height="32"
        rx="4"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2"
      />
      {/* Ticket sliding out */}
      <path
        d="M62 104 H76 V114 H62 Z"
        fill="#ccfbf1"
        stroke="#0f766e"
        strokeWidth="1.5"
      />
      <text x="64" y="111" fontSize="5" fontWeight="bold" fill="#0f766e" fontFamily="monospace">
        #101
      </text>

      {/* Desk Plant for soothing warmth */}
      <path d="M175 140 L183 140 L181 128 L177 128 Z" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
      <path d="M179 128 C172 120 170 110 178 105 C184 112 182 122 179 128 Z" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" />
      <path d="M179 128 C185 120 192 115 190 108 C182 113 181 122 179 128 Z" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" />

      {/* Floating Reception Bell */}
      <circle cx="50" cy="65" r="16" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.8" />
      <path d="M42 72 H58 M44 72 C44 65 47 62 50 62 C53 62 56 65 56 72 M50 62 V59" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PrescriptionSketch({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="100" cy="95" rx="75" ry="60" fill="#f0fdf4" />
      <circle cx="140" cy="70" r="35" fill="#fef3c7" opacity="0.7" />

      {/* Medicine Bottle */}
      <rect
        x="50"
        y="50"
        width="45"
        height="75"
        rx="8"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2.5"
      />
      {/* Bottle Cap */}
      <rect
        x="56"
        y="40"
        width="33"
        height="12"
        rx="3"
        fill="#ccfbf1"
        stroke="#0d9488"
        strokeWidth="2"
      />
      {/* Label */}
      <rect
        x="54"
        y="65"
        width="37"
        height="45"
        rx="3"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1.2"
      />
      {/* Rx Symbol on Label */}
      <text x="60" y="85" fontSize="13" fontWeight="bold" fill="#0f766e" fontFamily="serif">
        Rx
      </text>
      <line x1="60" y1="94" x2="84" y2="94" stroke="#99f6e4" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="101" x2="78" y2="101" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

      {/* Blister Pack / Tablet Strip */}
      <rect
        x="110"
        y="60"
        width="46"
        height="70"
        rx="6"
        fill="#ffffff"
        stroke="#334155"
        strokeWidth="2"
      />
      {/* Foil Pills */}
      <circle cx="123" cy="76" r="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="143" cy="76" r="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="123" cy="95" r="6" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="143" cy="95" r="6" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="123" cy="114" r="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="143" cy="114" r="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />

      {/* Capsule floating */}
      <g transform="rotate(35 85 140)">
        <rect x="75" y="135" width="22" height="10" rx="5" fill="#f43f5e" stroke="#e11d48" strokeWidth="1.5" />
        <rect x="86" y="135" width="11" height="10" rx="0" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function MedicalVaultSketch({ className = "w-44 h-44" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="90" r="70" fill="#f0fdfa" />
      <ellipse cx="100" cy="110" rx="50" ry="20" fill="#ccfbf1" opacity="0.6" />

      {/* Security Medical Shield */}
      <path
        d="M100 35 C125 45 145 42 145 65 C145 105 118 135 100 145 C82 135 55 105 55 65 C55 42 75 45 100 35 Z"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Stethoscope lock arch */}
      <path
        d="M86 85 V72 C86 64 92 58 100 58 C108 58 114 64 114 72 V85"
        stroke="#0f766e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Padlock Body */}
      <rect
        x="80"
        y="85"
        width="40"
        height="32"
        rx="6"
        fill="#e6fffa"
        stroke="#0f766e"
        strokeWidth="2.2"
      />
      {/* Keyhole */}
      <circle cx="100" cy="98" r="3.5" fill="#0f766e" />
      <path d="M99 101 L97 108 H103 L101 101 Z" fill="#0f766e" />

      {/* Caduceus / Plus accents */}
      <path d="M100 24 V30 M97 27 H103" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function ECGHeartbeatSketch({ className = "w-36 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft pulse background ribbon */}
      <rect width="160" height="50" rx="8" fill="#f0fdf4" />
      <path
        d="M10 25 H45 L52 14 L58 36 L66 8 L74 42 L82 22 L88 28 L94 25 H150"
        stroke="#10b981"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="66" cy="8" r="3" fill="#059669" />
    </svg>
  );
}

export function QueueWaitingSketch({ className = "w-44 h-44" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <ellipse cx="100" cy="95" rx="75" ry="55" fill="#f0f9ff" />
      <circle cx="60" cy="70" r="30" fill="#ecfdf5" opacity="0.8" />
      <circle cx="145" cy="110" r="35" fill="#fef3c7" opacity="0.6" />

      {/* Digital Clinic Queue Display Screen */}
      <rect
        x="55"
        y="45"
        width="90"
        height="55"
        rx="8"
        fill="#ffffff"
        stroke="#0284c7"
        strokeWidth="2.5"
      />
      <rect x="62" y="52" width="76" height="41" rx="4" fill="#0f172a" />
      <text x="70" y="66" fontSize="7" fontWeight="bold" fill="#38bdf8" fontFamily="sans-serif">
        NOW SERVING
      </text>
      <text x="70" y="85" fontSize="16" fontWeight="bold" fill="#4ade80" fontFamily="monospace">
        OPD-101
      </text>

      {/* Screen mount */}
      <path d="M100 100 V115 M85 115 H115" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

      {/* Audio Soundwaves emitting announcement */}
      <path d="M155 60 C162 65 162 80 155 85" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M163 54 C173 63 173 87 163 96" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

      {/* Waiting lounge chairs */}
      <rect x="40" y="130" width="35" height="24" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
      <line x1="45" y1="154" x2="45" y2="162" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="154" x2="70" y2="162" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

      <rect x="85" y="130" width="35" height="24" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
      <line x1="90" y1="154" x2="90" y2="162" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <line x1="115" y1="154" x2="115" y2="162" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

      <rect x="130" y="130" width="35" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
      <line x1="135" y1="154" x2="135" y2="162" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="154" x2="160" y2="162" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyChairSketch({ className = "w-44 h-44" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="100" cy="90" r="65" fill="#f0fdfa" />
      <ellipse cx="100" cy="125" rx="50" ry="18" fill="#ccfbf1" opacity="0.6" />

      {/* Modern Clinical Armchair */}
      <path
        d="M75 75 C75 60 85 50 100 50 C115 50 125 60 125 75 V110 H75 V75 Z"
        fill="#ffffff"
        stroke="#0d9488"
        strokeWidth="2.5"
      />
      {/* Cushions */}
      <rect x="68" y="105" width="64" height="15" rx="5" fill="#e6fffa" stroke="#0f766e" strokeWidth="2" />
      {/* Armrests */}
      <rect x="62" y="85" width="10" height="25" rx="4" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
      <rect x="128" y="85" width="10" height="25" rx="4" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
      {/* Chair legs */}
      <line x1="75" y1="120" x2="70" y2="145" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="125" y1="120" x2="130" y2="145" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />

      {/* Gentle checkmark flower */}
      <circle cx="145" cy="55" r="14" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.8" />
      <path d="M139 55 L143 59 L151 51" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
