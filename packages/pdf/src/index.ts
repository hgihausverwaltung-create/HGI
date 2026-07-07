import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { DraftAnswers, TemplateSchema } from "@hgi/form-schema";
import { ProtocolDocument, type PdfAttachment } from "./ProtocolDocument";

export interface RenderProtocolPdfInput {
  templateName: string;
  draftTitle: string;
  schema: TemplateSchema;
  answers: DraftAnswers;
  attachments: PdfAttachment[];
  propertyLabel?: string;
  unitLabel?: string;
  referenceLabels?: Record<string, string>;
}

export async function renderProtocolPdf(input: RenderProtocolPdfInput): Promise<Buffer> {
  // ProtocolDocument renders a <Document> at its root; react-pdf's own typings just don't
  // express "component that returns a Document" so we assert the element shape it expects.
  const element = React.createElement(ProtocolDocument, {
    ...input,
    referenceLabels: input.referenceLabels ?? {},
    generatedAt: new Date(),
  }) as unknown as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export type { PdfAttachment };
