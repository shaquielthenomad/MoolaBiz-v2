import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function apiUrl(path: string) { return `${BASE_URL}/${PHONE_NUMBER_ID}${path}`; }
function authHeaders() { return { Authorization: `Bearer ${ACCESS_TOKEN}` }; }

export async function sendMessage(to: string, text: string): Promise<void> {
  await axios.post(apiUrl("/messages"), {
    messaging_product: "whatsapp", to, type: "text", text: { body: text },
  }, { headers: authHeaders() });
}

export interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
}

export async function sendTemplate(to: string, templateName: string, languageCode: string, components: TemplateComponent[] = []): Promise<void> {
  await axios.post(apiUrl("/messages"), {
    messaging_product: "whatsapp", to, type: "template",
    template: { name: templateName, language: { code: languageCode }, components },
  }, { headers: authHeaders() });
}
