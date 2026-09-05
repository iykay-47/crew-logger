# Camera Capture

## What it does
Allows crew members to photograph job tickets and odometer/equipment readings
and attach them to job entries.

## Behavior
- Camera opens from the new entry screen
- Photos are compressed and resized before upload (target: under 500KB per image)
- Photos are stored in external storage (Cloudflare R2 or similar)
- Only the URL is saved in the database
- Multiple photos per entry allowed

## Phase
Phase 4: Full implementation

## Definition of done
- [ ] Camera opens and captures a photo
- [ ] Photo is compressed and resized before upload
- [ ] Photo uploads to external storage
- [ ] Photo URL is saved with the entry
- [ ] Photos display in entry detail view
- [ ] Multiple photos per entry work correctly
