# System: Gigs

## Answers

- How does the gig marketplace transition states?
- What are the constraints around gig visibility?

## Architecture

- Gigs are the core data shape.
- Gigs traverse a strict lifecycle.

## Lifecycle States

- **Open:** Visible to out-of-network users (.edu verified). Contact info hidden.
- **Requested:** An interested student submits a request. Poster reviews requests.
- **Accepted:** Poster accepts a request. Contact information is mutually revealed.
- **Completed:** Task is finished and verified. Karma Kredit is exchanged.

## Validations

- Ensure payment tags are correctly applied.
- Prevent interactions that violate `INV_GIG_01` and `INV_GIG_02`.
