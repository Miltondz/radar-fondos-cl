/**
 * Google Calendar API & Google Sign-In Service (Client-Side)
 * Provides direct calendar integration, custom alerts, and OAuth management.
 */

export interface CalendarEventPayload {
  name: string;
  deadlineISO: string;
  description: string;
  url: string;
  chileCode?: string;
  alertDaysBefore?: number[]; // custom alert reminders in days before deadline
}

// Global reference for GIS Client
let tokenClient: any = null;
let googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Custom event to notify React-land about auth/token state changes
const authStateCallbacks: Array<(token: string | null) => void> = [];

export function subscribeToTokenState(callback: (token: string | null) => void) {
  authStateCallbacks.push(callback);
  return () => {
    const idx = authStateCallbacks.indexOf(callback);
    if (idx !== -1) authStateCallbacks.splice(idx, 1);
  };
}

let activeToken: string | null = null;

export function getCachedToken(): string | null {
  return activeToken;
}

function notifyTokenChange(token: string | null) {
  activeToken = token;
  authStateCallbacks.forEach(cb => cb(token));
}

/**
 * Loads the Google Identity Services client script dynamically
 */
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
      } else {
        reject(new Error("GSI script loaded but object google.accounts.oauth2 not found."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script."));
    document.head.appendChild(script);
  });
}

/**
 * Initializes the OAuth2 Token Client
 */
export async function initializeTokenClient(onTokenReceived: (token: string) => void): Promise<any> {
  await loadGsiScript();
  if (!googleClientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured in environment variables.");
  }

  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: googleClientId,
    scope: "https://www.googleapis.com/auth/calendar.events",
    callback: async (response: any) => {
      if (response.error) {
        console.error("GSI token client authorization error:", response.error);
        return;
      }
      if (response.access_token) {
        notifyTokenChange(response.access_token);
        onTokenReceived(response.access_token);
      }
    },
  });

  return tokenClient;
}

/**
 * Request Google auth permissions via GIS popup
 */
export function requestAuthToken(onTokenReceived: (token: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!googleClientId) {
      reject(new Error("VITE_GOOGLE_CLIENT_ID is required"));
      return;
    }

    const triggerPopup = () => {
      try {
        if (!tokenClient) {
          initializeTokenClient(onTokenReceived).then(() => {
            tokenClient.requestAccessToken({ prompt: "consent" });
            resolve();
          }).catch(reject);
        } else {
          tokenClient.requestAccessToken({ prompt: "" });
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    };

    triggerPopup();
  });
}

/**
 * Logs out / Revokes the active token
 */
export function disconnectGoogle() {
  const token = getCachedToken();
  if (token) {
    try {
      (window as any).google?.accounts?.oauth2?.revoke(token, () => {
        console.log("Token Google revocado con éxito.");
      });
    } catch (e) {
      console.warn("Fallo revocar token en script:", e);
    }
  }
  notifyTokenChange(null);
}

/**
 * Inserts an event directly into the user's primary Google Calendar
 */
export async function insertCalendarEvent(
  accessToken: string,
  eventData: CalendarEventPayload
): Promise<{ success: boolean; eventLink?: string; error?: string }> {
  try {
    const { name, deadlineISO, description, url, chileCode, alertDaysBefore = [1, 3] } = eventData;
    
    // ISO Date parsing
    // Default deadline is a full day or standard daytime event
    // The date format should be YYYY-MM-DD
    const matchedDate = deadlineISO.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!matchedDate) {
      throw new Error(`Instancia de fecha inválida: ${deadlineISO}`);
    }

    // Set standard times: Start 09:00, End 10:00 (Chile locale local time)
    const startDateStr = `${deadlineISO}T09:00:00`;
    const endDateStr = `${deadlineISO}T10:00:00`;

    // Construct reminder alerts in minutes
    // e.g., 1 day before = 1440 mins. 3 days before = 4320 mins.
    const reminderOverrides = alertDaysBefore.map(days => ({
      method: "popup",
      minutes: days * 1440
    }));

    const event = {
      summary: `Cierre: ${name} ${chileCode ? `[${chileCode}]` : ""}`,
      location: "Portal o Plataforma postulante, Chile",
      description: `Radar Fondos CL: Recordatorio de Cierre TI Chile.\n\nCódigo de Ficha: ${chileCode || "No aplica"}\nDescripción: ${description}\n\nEnlace oficial: ${url}\n\nAgendado de manera estratégica vía Radar Fondos CL.`,
      start: {
        dateTime: startDateStr,
        timeZone: "America/Santiago"
      },
      end: {
        dateTime: endDateStr,
        timeZone: "America/Santiago"
      },
      reminders: {
        useDefault: false,
        overrides: reminderOverrides
      }
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorJson = await response.json();
      throw new Error(errorJson.error?.message || "Fallo crear evento en la API de Google Agenda.");
    }

    const result = await response.json();
    return {
      success: true,
      eventLink: result.htmlLink
    };
  } catch (error: any) {
    console.error("Error al insertar evento en Google Calendar:", error);
    return {
      success: false,
      error: error.message || "Error desconocido al insertar evento."
    };
  }
}
