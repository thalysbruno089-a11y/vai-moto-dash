const femaleVoiceNames = /\b(female|feminina|maria|luciana|fernanda|francisca|helena|vitoria|vitória|camila|bruna)\b/i;
let pendingVoiceTimer: number | undefined;
let pendingVoiceHandler: (() => void) | undefined;
let pendingSpeakTimer: number | undefined;
let audioGeneration = 0;

function clearPendingVoice() {
  if (pendingVoiceTimer !== undefined) window.clearTimeout(pendingVoiceTimer);
  if (pendingVoiceHandler) window.speechSynthesis.removeEventListener("voiceschanged", pendingVoiceHandler);
  pendingVoiceTimer = undefined;
  pendingVoiceHandler = undefined;
}

export function stopQueueAudio() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    audioGeneration += 1;
    clearPendingVoice();
    if (pendingSpeakTimer !== undefined) window.clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = undefined;
    window.speechSynthesis.cancel();
  }
}

export function speakQueueMessage(text: string, waitForVoices = false): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return false;

  const synth = window.speechSynthesis;
  const interrupted = synth.speaking || synth.pending || synth.paused;
  if (interrupted || pendingSpeakTimer !== undefined || pendingVoiceTimer !== undefined) stopQueueAudio();
  const generation = ++audioGeneration;
  const speak = () => {
    if (generation !== audioGeneration) return;
    clearPendingVoice();
    pendingSpeakTimer = undefined;
    synth.resume();
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "pt-BR";
    message.rate = 0.9;
    const voices = synth.getVoices();
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br") && femaleVoiceNames.test(voice.name));
    const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
    message.voice = preferred ?? fallback ?? null;
    synth.speak(message);
  };
  // The activation confirmation speaks immediately within the user's tap.
  // Later queue calls can wait briefly for mobile browsers to load installed voices.
  const begin = () => {
    if (generation !== audioGeneration) return;
    if (waitForVoices && synth.getVoices().length === 0) {
      pendingVoiceHandler = speak;
      synth.addEventListener("voiceschanged", speak, { once: true });
      pendingVoiceTimer = window.setTimeout(speak, 800);
    } else speak();
  };
  // Keep first activation inside the user's tap; only defer after interrupting an active utterance.
  if (interrupted) pendingSpeakTimer = window.setTimeout(begin, 120);
  else begin();
  return true;
}

export function announceQueueCall(name: string) {
  return speakQueueMessage(`Da vez, ${name}.`, true);
}