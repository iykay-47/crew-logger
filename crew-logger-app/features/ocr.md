# OCR

## What it does
Extracts data from photographed job ticket forms using zone-based field extraction.

## Approach
- Job ticket forms have a consistent fixed layout
- OCR targets specific zones on the form (job number zone, date zone, etc.)
- Extracted values pre-fill the entry form for the crew member to verify

## Behavior
- After capturing a photo of a job ticket, offer to extract fields
- Show extracted values alongside the photo for verification
- Crew member confirms or corrects each extracted field
- Corrected values are used, not OCR output directly

## Phase
Phase 6: Full implementation

## Definition of done
- [ ] Photo of job ticket triggers OCR extraction
- [ ] Correct zones are identified on the fixed-layout form
- [ ] Extracted values pre-fill the entry form
- [ ] Side-by-side view shows photo and extracted values
- [ ] Crew member can correct any extracted field
- [ ] Corrected values save correctly
