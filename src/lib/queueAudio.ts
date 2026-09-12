export function announceQueueCall(name: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const message = new SpeechSynthesisUtterance(`Da vez, ${name}.`);
  message.lang = "pt-BR";
  message.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br") && /female|feminina|maria|luciana|google português/i.test(voice.name));
  const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br"));
  message.voice = preferred ?? fallback ?? null;
  window.speechSynthesis.speak(message);
}