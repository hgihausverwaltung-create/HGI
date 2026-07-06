import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "./storage";

export interface SendEmailInput {
  to: string[];
  subject: string;
  text: string;
  attachmentPath: string;
}

/**
 * Dev stand-in for a transactional email provider (Resend/Postmark in the production
 * plan, which need an API key this sandbox doesn't have). Writes the "email" as a JSON
 * file next to the PDF instead of actually sending it, so the send flow is fully
 * exercisable end-to-end without external credentials. Swapping to a real provider means
 * replacing only this function.
 */
const OUTBOX_ROOT = path.resolve(import.meta.dirname, "../../storage/outbox");
mkdirSync(OUTBOX_ROOT, { recursive: true });

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const record = {
    ...input,
    sentAt: new Date().toISOString(),
    pdfPath: resolveStoragePath(input.attachmentPath),
  };
  const fileName = `${Date.now()}-${input.to[0]?.replace(/[^a-z0-9]/gi, "_") ?? "unknown"}.json`;
  writeFileSync(path.join(OUTBOX_ROOT, fileName), JSON.stringify(record, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[dev-email] an ${input.to.join(", ")}: "${input.subject}" (Anhang: ${input.attachmentPath})`);
}
