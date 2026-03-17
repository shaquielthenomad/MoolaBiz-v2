import axios from "axios";

const BASE_URL = "https://vulavula.lelapa.ai/api/v1";
const headers = () => ({
  "X-CLIENT-TOKEN": process.env.LELAPA_API_KEY ?? "",
  "Content-Type": "application/json",
});

export type SupportedLanguage = "eng_Latn" | "zul_Latn" | "xho_Latn" | "afr_Latn" | "sot_Latn";

const DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  eng_Latn: "English", zul_Latn: "Zulu", xho_Latn: "Xhosa", afr_Latn: "Afrikaans", sot_Latn: "Sesotho",
};

export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  try {
    const { data } = await axios.post(`${BASE_URL}/classify/language`, { text }, { headers: headers() });
    const detected = data?.language_code as SupportedLanguage | undefined;
    return detected && detected in DISPLAY_NAMES ? detected : "eng_Latn";
  } catch { return "eng_Latn"; }
}

export async function translateToEnglish(text: string, sourceLang: SupportedLanguage): Promise<string> {
  if (sourceLang === "eng_Latn") return text;
  try {
    const { data } = await axios.post(`${BASE_URL}/translate`, { input_text: text, source_lang: sourceLang, target_lang: "eng_Latn" }, { headers: headers() });
    return (data?.translation as string) || text;
  } catch { return text; }
}

export async function translateFromEnglish(text: string, targetLang: SupportedLanguage): Promise<string> {
  if (targetLang === "eng_Latn") return text;
  try {
    const { data } = await axios.post(`${BASE_URL}/translate`, { input_text: text, source_lang: "eng_Latn", target_lang: targetLang }, { headers: headers() });
    return (data?.translation as string) || text;
  } catch { return text; }
}

export function getDisplayName(lang: SupportedLanguage): string { return DISPLAY_NAMES[lang]; }
