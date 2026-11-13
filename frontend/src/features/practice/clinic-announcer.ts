// Web Audio API synthesized clinic chime + Native Text-to-Speech announcer
// Zero external dependencies, works offline and in all modern browsers

export function playClinicChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2: C5 (523.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, now + 0.32);
    gain2.gain.setValueAtTime(0.3, now + 0.32);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.32);
    osc2.stop(now + 1.1);
  } catch (e) {
    console.warn("Audio chime failed to play:", e);
  }
}

export function announcePatientCall(
  tokenNo: string,
  patientName: string,
  room = "Doctor's Consultation Room",
) {
  playClinicChime();

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Stop any pending speech
    setTimeout(() => {
      // Clear token name: OPD-101 -> OPD 101 for better speech pronunciation
      const speakableToken = tokenNo.replace("-", " ");
      const text = `Token ${speakableToken}, ${patientName}, please proceed to ${room}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }, 650);
  }
}
