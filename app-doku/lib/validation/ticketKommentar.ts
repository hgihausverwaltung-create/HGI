import { z } from "zod";

export const ticketKommentarCreateSchema = z.object({
  ticketId: z.string().min(1),
  text: z.string().min(1, "Kommentar darf nicht leer sein"),
});

export type TicketKommentarCreateInput = z.infer<typeof ticketKommentarCreateSchema>;
