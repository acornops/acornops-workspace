---
name: acornops-reject-ai-writing
description: Use when reviewing prose, documentation, article drafts, comments, or submissions for suspected AI-generated writing; when asked to reject AI writing; or when writing should be checked for LLM-like style, fabricated sourcing, generic filler, malformed markup, or formulaic tone before acceptance.
---

# Inputs

- text, diff, draft, or document under review
- review context and acceptance criteria
- available source material, citations, timestamps, or author explanation
- Wikipedia's field guide: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing

# Procedure

1. Treat AI-writing signs as evidence, not proof. Do not rely on detector scores or vague claims that prose "sounds AI".
2. Compare the text against the review context: purpose, genre, expected style, source requirements, and publication bar.
3. Look for clusters of concrete indicators:
   - generic significance claims, legacy language, and inflated importance
   - shallow analysis that restates facts without adding verifiable substance
   - formulaic transitions, summaries, conclusions, or "important to note" disclaimers
   - over-polished but nonspecific wording, euphemisms, and stiff synonym choices
   - Markdown or markup artifacts, placeholder text, abrupt cutoffs, or prompt-refusal remnants
   - fabricated-looking citations, source/source-text mismatches, fake shortcuts, or outdated access dates
   - sudden style shifts inconsistent with surrounding human-authored text
4. Check ineffective indicators before rejecting: perfect grammar, formal tone, blandness, unsourced text, correct markup, or transition words alone are insufficient.
5. Seek contrary evidence where available: pre-ChatGPT timestamps, author explanation, source passages, edit history, or specific human editorial choices.
6. Classify the outcome:
   - `Reject`: multiple strong indicators plus quality, sourcing, policy, or trust risk that cannot be accepted as-is.
   - `Require revision`: AI signs are plausible but the content can be salvaged by replacing generic claims, verifying sources, and removing artifacts.
   - `Needs human judgment`: evidence is weak, context-dependent, or would create an unfair false-positive risk.
7. Report concise evidence snippets, the decision, and exact remediation steps. Avoid accusing a person; evaluate the text and acceptance risk.

# Outputs

- decision: `Reject`, `Require revision`, or `Needs human judgment`
- evidence list with concrete snippets and indicator categories
- false-positive considerations
- required edits or verification steps before acceptance
