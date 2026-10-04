// Tarayıcının kendi ses motoru: İtalyanca seslendirme (TTS) ve konuşma tanıma (STT).

// Şimdilik kapalı: telefonlarda güvenilir çalışmadı, uygulama sadece yazıyla ilerliyor.
// true yapılınca dinle/yavaş dinle düğmeleri ve mikrofon geri gelir.
export const AUDIO_ENABLED = false;

let voice = null;

function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'it-IT' && /google|natural|premium|enhanced/i.test(v.name))
    || voices.find((v) => v.lang === 'it-IT')
    || voices.find((v) => v.lang?.startsWith('it'))
    || null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  voice = pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', () => { voice = pickVoice(); });
}

export const canSpeak = () => AUDIO_ENABLED && typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text, { slow = false } = {}) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[«»"]/g, ''));
  u.lang = 'it-IT';
  if (voice) u.voice = voice;
  u.rate = slow ? 0.75 : 0.95;
  speechSynthesis.speak(u);
}

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const canListen = () => AUDIO_ENABLED && Boolean(Recognition);

/**
 * Bir kez dinler. onText(metin) tanıma bitince, onEnd() her durumda çağrılır.
 * @returns {() => void} dinlemeyi durdurur
 */
export function listen({ onText, onError, onEnd }) {
  if (!Recognition) {
    onError?.('unsupported');
    onEnd?.();
    return () => {};
  }
  const r = new Recognition();
  r.lang = 'it-IT';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => onText?.(e.results[0][0].transcript);
  r.onerror = (e) => onError?.(e.error);
  r.onend = () => onEnd?.();
  r.start();
  return () => r.stop();
}
