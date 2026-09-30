const femaleVoiceNames = /\b(female|feminina|maria|luciana|fernanda|francisca|helena|vitoria|vitória|camila|bruna)\b/i;

export function stopQueueAudio() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakQueueMessage(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return false;

  const synth = window.speechSynthesis;
  const message = new SpeechSynthesisUtterance(text);
  message.lang = "pt-BR";
  message.rate = 0.9;
  const voices = synth.getVoices();
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br") && femaleVoiceNames.test(voice.name));
  const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
  message.voice = preferred ?? fallback ?? null;
  // Queue the new call behind the activation confirmation instead of cancelling it.
  // Android Chrome can stay silent when cancel() is followed by a delayed speak().
  synth.speak(message);
  if (synth.paused) synth.resume();
  return true;
}

export function announceQueueCall(name: string) {
  return speakQueueMessage(`Da vez, ${name}.`);
}