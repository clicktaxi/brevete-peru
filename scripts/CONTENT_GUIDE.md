# Content guide for question batches (content/a1/parts/batch-NN.json)

Target user: knows Spanish at **A1** (reads syllable by syllable, a few hundred words). They will NOT
learn Spanish; they must **recognize** the question and the right answer on the Spanish exam. Everything
we write must help them pick the right letter.

Hard rules:
- Spanish text (`questions.json`) is the law. Never change it. The correct answer comes from the PDF;
  never "fix" it. If an answer looks wrong or disputable, still explain the PDF answer and add the id to
  `disputed` in your batch file with a one-line reason.
- Explanation must not contradict the PDF answer.
- Simple language: short sentences, no legalese, no bureaucratic style. Write as if explaining to a friend.

## Batch file format

```json
{
  "meta": {
    "a1-001": {
      "topic": "estacionamiento",
      "terms": ["recoger", "pasajero", "lugar autorizado"],
      "anchors": { "questionKeys": ["permitido", "vía"], "answerKeys": ["lugares autorizados"] }
    }
  },
  "ru": { "a1-001": { ...QuestionTranslation... } },
  "en": { "a1-001": { ...QuestionTranslation... } },
  "disputed": [ { "id": "a1-0XX", "reason": "..." } ]
}
```

### meta
- `topic` — exactly one of: `senales` (signs), `semaforos` (traffic lights), `marcas` (road markings),
  `preferencia` (right of way), `velocidad` (speed), `adelantamiento` (overtaking), `estacionamiento`
  (parking/stopping/pick-up), `infracciones` (offences, fines, points, sanctions), `documentos` (licence,
  SOAT, inspection, papers), `seguridad` (safety, alcohol, seat belts, fatigue, lights, tyres, driving
  technique), `peatones` (pedestrians, school zones), `primeros-auxilios` (first aid), `otros`.
  A question about a sign image → `senales` even if the sign is about speed or parking.
- `terms` — Spanish lemmas (lowercase, singular, infinitive for verbs) of the important domain words
  in the question and options: `"berma"`, `"calzada"`, `"adelantar"`, `"ceder el paso"`, `"papeleta"`,
  `"luces direccionales"`. 3–8 per question. They are matched to the glossary later by `es`.
  Do NOT include logic words (no, solo, salvo…) and generic words (vehículo, conductor are fine to include).
- `anchors.questionKeys` — 2–4 Spanish words/short phrases **taken verbatim from the question text** by
  which the user will recognize the question (the most distinctive words): `["flecha verde", "semáforo"]`.
- `anchors.answerKeys` — 1–3 Spanish words/short phrases that appear **in the correct option and in none of
  the wrong options** (checked case- and accent-insensitively as substrings). Prefer meaningful words, not
  articles. If no such unique word exists (options differ only by a logic word like prohibido/permitido or
  the answer is «Ninguna…/Todas…»), set `answerKeys: []` and fill `trap` in both translations.

### QuestionTranslation (ru and en)
```json
{
  "id": "a1-001",
  "text": "Что разрешено на дороге:",
  "options": { "a": "...", "b": "...", "c": "...", "d": "..." },
  "gist": "Где можно высаживать пассажиров",
  "explanation": "Пассажиров можно сажать и высаживать только в разрешённых местах. Остальные варианты — нарушения.",
  "trap": "Вариант a тоже про пассажиров, но «en cualquier lugar» (где угодно) — это нарушение.",
  "legalRef": "RNT art. 90",
  "gloss": {
    "text": [ { "es": "Está permitido", "tr": "Разрешено", "kind": "logic" }, { "es": "en la vía:", "tr": "на дороге:" } ],
    "options": {
      "a": [ { "es": "Recoger o dejar pasajeros", "tr": "Сажать или высаживать пассажиров" }, { "es": "o carga", "tr": "или груз" }, { "es": "en cualquier lugar", "tr": "где угодно", "kind": "logic" } ],
      "b": [ ... ], "c": [ ..., { "es": "en lugares autorizados.", "tr": "в разрешённых местах.", "kind": "anchor" } ], "d": [ ... ]
    }
  },
  "status": "machine"
}
```
- `text`, `options` — natural, simple translation. Keep the meaning exact (including logic words).
  Options are translated WITHOUT the letter prefix (the Spanish options have none either).
- `gist` — the meaning of the question in **≤ 7 words**, plain language, no punctuation at the end.
- `explanation` — 2–4 short sentences, **each ≤ 15 words**. Why the answer is right; if useful, why the
  most tempting wrong option is wrong. Plain language.
- `trap` (optional, but REQUIRED when `answerKeys` is empty) — what makes wrong options look like the right
  one and how to tell them apart. Quote the Spanish words in «…» with the translation in brackets.
- `legalRef` (optional) — only if you are confident: "RNT art. NN" (Reglamento Nacional de Tránsito,
  D.S. 016-2009-MTC), "MDCT" for the sign manual. Omit if unsure.
- `gloss` — the interlinear translation. Split the Spanish text into **meaning chunks of 1–5 words**; each
  chunk `es` must be an exact substring of the original, chunks in order, covering the whole text (spaces
  between chunks may be dropped; punctuation stays attached to its word). `tr` = translation of that chunk
  (short, may be a bit literal so the user maps words to meaning). Mark `kind: "logic"` on chunks that
  contain a logic word (no, nunca, siempre, solo, solamente, únicamente, salvo, excepto, sin embargo, aun
  cuando, antes, después, prohibido, permitido, obligatorio, debe, puede, izquierda, derecha, mayor, menor,
  más, menos, ninguna, todas, ambas). Mark `kind: "anchor"` on the chunk(s) of the **correct option** that
  contain the `answerKeys` (never on wrong options).
- `status` — always `"machine"`.

## Check your work
```bash
python scripts/check_part.py content/a1/parts/batch-NN.json --from A --to B
```
Fix every ERROR and re-run until it prints `OK`. The checker verifies chunk alignment, anchors uniqueness,
lengths and required fields. Do not "fix" errors by weakening content (e.g. an empty trap) — rewrite.
