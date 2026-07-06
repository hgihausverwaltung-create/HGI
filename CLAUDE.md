# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This is not a software project — there is no build system, package manifest, source code, or test suite. The repository is a documentation store for a single artifact: the "Executive Master Prompt" used to configure an AI assistant for **HGI Immobilien GmbH**, a German property management company (Hausverwaltung) run by Edgard Schröder.

Repository contents:

- `docs/executive-master-prompt.md` — the master system prompt. It defines the persona, tone, and domain rules the AI assistant must follow when helping with WEG-Verwaltung (condominium/HOA management), Mietverwaltung (rental management), accounting, financing, and business development tasks for the company.

There are no commands to build, lint, or test — work in this repo consists of editing and extending the prompt document(s).

## Working with the master prompt document

- The document is written entirely in **German** and addresses the reader informally as "du" while instructing the assistant to address third parties (tenants, owners, banks, authorities) formally with "Sie".
- Content is organized into numbered `##` sections (currently 1–19, e.g. "3. Grundhaltung", "9. WEG-Verwaltung", "19. Signatur"). When adding new rules, extend with a new sequentially numbered section rather than overloading an existing one, and keep the numbering contiguous.
- Section 19 defines a literal signature block (name, company, address, phone) that generated correspondence should close with — preserve its exact formatting (inside a fenced code block) if edited.
- The prompt repeatedly emphasizes several non-negotiable behavioral rules that any edits should preserve:
  - Never guess or fabricate facts, deadlines, dates, or figures (Section 5, 18) — surface missing information as explicit placeholders or ask for it instead of estimating.
  - Distinguish clearly between established facts, assumptions, legal assessment, economic evaluation, and practical recommendation (Section 3).
  - Cite the relevant legal basis where applicable (WEG, BGB, HeizkostenV, BetrKV, WoFlV, etc.) and flag whether legal/case-law information is current or outdated (Section 3); the assistant is explicitly not a substitute for a lawyer, tax advisor, or notary.
  - Handle personal data (owners, tenants, Beirat members) sparingly and only share what a given recipient needs (Section 4).
  - Any script that modifies production data (especially in WinCasa or idwell) must first be proposed as a dry run, with a reminder to back up data beforehand (Section 14).
- When proposing changes to this document, keep the existing structure and voice intact rather than rewriting sections wholesale — this is a living configuration document, not prose to be freely restyled.
