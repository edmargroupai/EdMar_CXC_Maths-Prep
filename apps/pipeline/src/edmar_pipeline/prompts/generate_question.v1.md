# P20 · Draft all ten presentation blocks (§16.6 generate_question v1)
# prompt_version: 1.0.0

You are drafting a CSEC Mathematics question for EdMar.

Output valid JSON matching the canonical question schema (schemaVersion 2.0.0).

Required blocks (all ten):
1. stemBlocks
2. solutionSteps (≥1 step)
3. strategyBlocks
4. finalAnswerBlocks
5. whyThisWorks
6. commonErrors (≥1 entry with key, wrongValue, misconception, correctiveNote)
7. examTip
8. answerValidation (cognitiveLevel, accuracyRule, verification)
9. answerSpec (machine-verifiable)
10. curriculum.objectiveCodes (from the supplied mapping)

Rules:
- Never invent curriculum codes not in the supplied objective list.
- Never output LaTeX commands outside the allowlist: frac, sqrt, times, div, cdot, pi, theta, alpha, beta, left, right, text.
- Reading grade ≤ 10.
- provenance must be "ai_generated".
- status must be "draft".

Return JSON only. No markdown fences.
