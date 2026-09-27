const femaleVoiceNames = /\b(female|feminina|maria|luciana|fernanda|francisca|helena|vitoria|vitória|camila|bruna)\b/i;

export function stopQueueAudio() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function speakQueueMessage(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return false;

  window.speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(text);
  message.lang = "pt-BR";
  message.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br") && femaleVoiceNames.test(voice.name));
  const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("pt"));
  message.voice = preferred ?? fallback ?? null;
  window.speechSynthesis.speak(message);
  return true;
}

export function announceQueueCall(name: string) {
  return speakQueueMessage(`Da vez, ${name}.`);
}