# Working on Line Calc

Read `docs/NOTES.md` first — it records which design choices are load-bearing and would
be wrong to "simplify".

## The rules that matter

1. **The calibration tests are the contract.** `src/domain/data-line.test.ts` pins
   NovaStar's three published MX40 Pro per-port figures. If a change makes them fail, the
   change is wrong — not the test. Every number the app prints rests on them.
2. **Never hand-edit `src/data/*.generated.ts`.** Run `npm run gen:panels`. The records
   carry manufacturer provenance and hand-editing silently breaks it.
3. **Never copy specs out of a competitor's curated database.** The specs themselves are
   facts and are fine to take from the manufacturer; a compiled database is a protected
   work in its own right under UK/EU database right. Primary sources only — and record
   the document in `source`.
4. **`verified: false` is not a nag.** It means the record cannot be used to quote a job.
   Keep the UI distinction.
5. **Do not let the power half drift into implying it is a design.** It is steady-state
   arithmetic with the inrush caveat stated. Sizing a circuit is a qualified person's job
   and the UI says so.

## Checks

```bash
npm test          # must be green, calibration pins included
npm run typecheck
npm run build
```
