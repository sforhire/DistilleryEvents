
import { EventRecord } from "../types";
import { combineDateTimeToISO, getEnv } from "./utils";
import { supabase } from "./supabaseClient";

/**
 * Note: Define your Zapier Webhook URL in your environment variables as VITE_ZAPIER_WEBHOOK_URL.
 * If not set, it will attempt to use a placeholder.
 */
const ZAPIER_URL = getEnv('VITE_ZAPIER_WEBHOOK_URL') || '';

export const pushEventToCalendar = async (event: EventRecord): Promise<{ success: boolean; googleEventId?: string; error?: string }> => {
  if (!ZAPIER_URL) {
    return { success: false, error: "Zapier Webhook URL not configured." };
  }

  const payload = {
    title: `${event.eventType} - ${event.firstName} ${event.lastName}`,
    description: `Distillery Event Briefing\nClient: ${event.firstName} ${event.lastName}\nGuests: ${event.guests}\nNotes: ${event.notes || 'No specific directives.'}`,
    start: combineDateTimeToISO(event.dateRequested, event.time),
    end: combineDateTimeToISO(event.dateRequested, event.endTime),
    location: "Distillery Tasting Room & Production Floor",
    eventId: event.id,
    clientEmail: event.email,
    clientPhone: event.phone
  };

  try {
    const response = await fetch(ZAPIER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);

    const result = await response.json();
    const googleEventId = result?.id || result?.google_event_id || 'pushed';

    // Update Supabase to mark as pushed
    const updateData = {
      ...event,
      pushedToCalendar: true,
      calendarPushedAt: new Date().toISOString(),
      googleEventId: googleEventId
    };

    const { error: dbError } = await supabase.from('events').upsert(updateData);
    if (dbError) console.error("Calendar status persisted locally but DB update failed:", dbError);

    return { success: true, googleEventId };
  } catch (err: any) {
    console.error("Calendar Sync Error:", err);
    return { success: false, error: err.message };
  }
};