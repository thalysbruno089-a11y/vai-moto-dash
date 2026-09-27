const femaleVoiceNames = /\b(female|feminina|maria|luciana|fernanda|francisca|helena|vitoria|vitória|camila|bruna)\b/i;
let pendingVoiceTimer: number | undefined;
let pendingVoiceHandler: (() => void) | undefined;

function clearPendingVoice() {
  if (pendingVoiceTimer !== undefined) window.clearTimeout(pendingVoiceTimer);
  if (pendingVoiceHandler) window.speechSynthesis.removeEventListener("voiceschanged", pendingVoiceHandler);
  pendingVoiceTimer = undefined;
  pendingVoiceHandler = undefined;
}

export function stopQueueAudio() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    clearPendingVoice();
    window.speechSynthesis.cancel();
  }
}

export function speakQueueMessage(text: string, waitForVoices = false): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return false;

  stopQueueAudio();
  const speak = () => {
    clearPendingVoice();
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "pt-BR";
    message.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br") && femaleVoiceNames.test(voice.name));
    const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"))
      ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
    message.voice = preferred ?? fallback ?? null;
    window.speechSynthesis.speak(message);
  };
  // The activation confirmation speaks immediately within the user's tap.
  // Later queue calls can wait briefly for mobile browsers to load installed voices.
  if (waitForVoices && window.speechSynthesis.getVoices().length === 0) {
    pendingVoiceHandler = speak;
    window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true });
    pendingVoiceTimer = window.setTimeout(speak, 800);
  } else {
    speak();
  }
  return true;
}

export function announceQueueCall(name: string) {
  return speakQueueMessage(`Da vez, ${name}.`, true);
}