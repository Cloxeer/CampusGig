# CLEAN_CODE_RULES
SCOPE: JavaScript | PLpgSQL | CSS | HTML
AUDIENCE: AI assistant enforcing standards on this codebase
APPLY: every read, write, review, refactor, and generation task

---

## RULE ENGINE

When analyzing or generating code, run this check sequence in order:

```
1. SIMPLE?      → fewest lines that correctly solve the problem
2. SINGLE JOB?  → one function/class/query = one responsibility
3. NAMED?       → every identifier communicates purpose without a comment
4. DRY?         → zero duplicated logic; extract if seen twice
5. NO MAGIC?    → no raw literals; use named constants
6. TESTED?      → test after each logical unit before moving on
7. LINT PASS?   → consistent formatting, no warnings
```

Flag any violation. Do not proceed past a failing step without fixing or flagging it.

---

## PRINCIPLES (compressed)

| ID | Name | Rule |
|----|------|------|
| P1 | KISS | Simplest correct solution. No speculation. |
| P2 | DRY | Logic exists once. Extract on second occurrence. |
| P3 | YAGNI | No features not required now. Delete dead code. |
| P4 | SRP | One job per function/class/query/component. |
| P5 | NAMES | Names replace comments. Verb+noun for functions. |
| P6 | NO MAGIC | All literals → named constants. |
| P7 | COMMENTS | Why only. Never what. Delete stale comments. |
| P8 | SOC | Logic, data, UI stay separate. Never mix layers. |
| P9 | DEMETER | Max 2 dot-chain depth. No reaching into internals. |
| P10 | FORMAT | Follow lang style guide. Linter enforced, zero warnings. |

---

## LANGUAGE-SPECIFIC PATTERNS

### JavaScript (70%)
```
naming:     camelCase vars/fns | PascalCase classes | UPPER_SNAKE constants
style:      ESLint + Prettier enforced | 2-space indent | semicolons consistent
functions:  arrow fns for callbacks | named fns for exported/top-level
async:      async/await over .then chains | always catch errors
modules:    one concern per file | named exports preferred over default
NO:         var | deeply nested callbacks | console.log in production
```

Pattern to recognize → fix:
```js
// ❌ magic + vague name + mixed concern
function proc(u) {
  if (u.age > 18) db.save(u); sendEmail(u.email);
}

// ✅ SRP + named constant + separated concerns
const ADULT_AGE_THRESHOLD = 18;
function isEligibleUser(user) { return user.age > ADULT_AGE_THRESHOLD; }
function registerUser(user) { db.save(user); }
function notifyUser(user) { sendEmail(user.email); }
```

### PLpgSQL (21%)
```
naming:     snake_case tables/columns/fns | v_ prefix for variables | p_ for params
style:      UPPERCASE SQL keywords | lowercase identifiers
functions:  one operation per function | explicit RETURNS type always
queries:    no SELECT * | name all columns | parameterized inputs only
NO:         dynamic SQL unless required | logic in views | unhandled exceptions
```

Pattern to recognize → fix:
```sql
-- ❌ SELECT *, no param typing, mixed concerns
CREATE FUNCTION get_stuff(x text) RETURNS void AS $$
  SELECT * FROM users WHERE email = x;
  UPDATE users SET last_seen = now() WHERE email = x;
$$ LANGUAGE plpgsql;

-- ✅ typed params, named columns, split responsibilities
CREATE FUNCTION get_user_by_email(p_email TEXT) RETURNS users AS $$
DECLARE v_user users;
BEGIN
  SELECT id, name, email INTO v_user FROM users WHERE email = p_email;
  RETURN v_user;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION update_user_last_seen(p_email TEXT) RETURNS void AS $$
BEGIN
  UPDATE users SET last_seen = NOW() WHERE email = p_email;
END;
$$ LANGUAGE plpgsql;
```

### CSS (9%)
```
naming:     kebab-case classes | BEM pattern: block__element--modifier
style:      no inline styles | no !important except reset | group by component
NO:         id selectors for styling | deeply nested selectors (>3 levels)
```

Pattern to recognize → fix:
```css
/* ❌ id selector, magic number, no variable */
#btn { color: #fff; padding: 14px; }

/* ✅ class, BEM, CSS variable */
:root { --spacing-md: 14px; }
.button--primary { color: #fff; padding: var(--spacing-md); }
```

### HTML (0.2%)
```
rules:      semantic elements over divs | every input has a label | alt on all images
NO:         inline styles | inline event handlers (onclick=) | tables for layout
```

---

## TESTING PROTOCOL

Apply at each step — not just at the end.

```
UNIT     → test each function in isolation before wiring together
BOUNDARY → test min, max, null, empty, unexpected type inputs
QUERY    → test PLpgSQL functions with known fixtures; assert exact return values
STYLE    → run linter before any commit; zero warnings required
REVIEW   → after each logical unit: re-read as if seeing it for the first time
```

Test naming pattern:
```js
// describe WHAT it does, not HOW
test('returns null when user email is missing', () => { ... });  // ✅
test('test1', () => { ... });                                    // ❌
```

---

## COMMIT RULES

```
- one commit = one logical change
- message format: type: short description
  types → feat | fix | refactor | test | style | docs
- no commented-out code committed (use git history)
- linter must pass before commit
```

---

## VIOLATION REFERENCE

| Smell | Likely Violation | Fix |
|-------|-----------------|-----|
| Function >20 lines | P4 SRP | Split into smaller fns |
| Same logic in 2+ places | P2 DRY | Extract to shared fn |
| Raw number/string in logic | P6 NO MAGIC | Named constant |
| Comment describes what code does | P7 COMMENTS | Delete comment; rename instead |
| `x`, `data`, `temp`, `stuff` | P5 NAMES | Rename to purpose |
| `a.b.c.d.e` chain | P9 DEMETER | Add method to intermediate |
| `SELECT *` | PLpgSQL pattern | Name all columns |
| `var` in JS | JS pattern | Use `const`/`let` |
| Untested function added | TESTING | Write test before next unit |

---

## DEPENDENCY CHAIN MAPPING

PURPOSE: Before changing any function, the AI must map its full dependency tree — both upstream (callers) and downstream (callees) — to prevent breaking changes.

---

### STEP 1 — BUILD THE CALL GRAPH BEFORE TOUCHING ANYTHING

When targeting a function for refactor/fix, immediately resolve:

```
TARGET: the function being changed

DOWNSTREAM (what TARGET calls):
  TARGET → B → C → D
  TARGET → F → G

UPSTREAM (what calls TARGET):
  child ← TARGET
  grandchild ← child ← TARGET
  great-grandchild ← grandchild ← child ← TARGET

FULL MAP BEFORE CHANGE:
  great-grandchild → grandchild → child → TARGET → B → C → D
                                                  → F → G
```

Do not write a single line of changed code until this map is complete for the target function.

---

### STEP 2 — CLASSIFY EVERY NODE IN THE MAP

For each node in the call graph, assign a risk level:

| Role | Definition | Risk if TARGET changes |
|------|-----------|----------------------|
| CHILD | direct caller of TARGET | HIGH — calls TARGET directly |
| GRANDCHILD | calls child | MEDIUM — breaks if child's contract changes |
| GREAT-GRANDCHILD | calls grandchild | LOW-MEDIUM — indirect, but contract drift propagates |
| DOWNSTREAM-DIRECT | TARGET calls this | HIGH — signature/return type must stay compatible |
| DOWNSTREAM-INDIRECT | called by a downstream node | MEDIUM — data shape changes ripple here |

---

### STEP 3 — IDENTIFY WHAT CAN BREAK

Before changing TARGET, ask for each node:

```
CONTRACT QUESTIONS:
  □ Does TARGET's signature (params, types, return) change?
      → Every CHILD and GRANDCHILD that passes args must be re-checked.
  □ Does TARGET's return shape change?
      → Every CHILD that destructures or reads the return must be re-checked.
  □ Does a DOWNSTREAM node (B, C, D, F, G) get removed or renamed?
      → TARGET itself and anything that imports that node must be re-checked.
  □ Does a DOWNSTREAM node's input contract change?
      → TARGET's call to it must be updated.
  □ Are shared constants or DB columns referenced across multiple nodes?
      → Changing them cascades to ALL nodes that import them.
```

---

### STEP 4 — SAFE CHANGE ORDER (always bottom-up)

```
RULE: Fix leaf nodes first, then work up the chain toward the root.

CORRECT ORDER for TARGET → B → C → D:
  1. Fix D  (no dependents, safest)
  2. Test D in isolation
  3. Fix C  (depends on D, now stable)
  4. Test C with D
  5. Fix B  (depends on C, now stable)
  6. Test B with C + D
  7. Fix TARGET (all downstreams stable)
  8. Test TARGET with B, C, D, F, G
  9. Test CHILD (calls TARGET)
  10. Test GRANDCHILD → GREAT-GRANDCHILD (full upstream chain)

NEVER: Fix TARGET first, then discover D is broken.
```

---

### STEP 5 — SHARED NODE RULE

If a node appears in MORE THAN ONE chain, it is a SHARED NODE and carries the highest risk.

```
Example:
  A → B → C → D
  A → F → G
  E → F       ← F is shared between A-chain and E-chain

If F changes:
  → Check A (upstream of F via A→F→G)
  → Check E (upstream of F via E→F)
  → Check G (downstream of F)
  ALL THREE chains must be retested when F changes.
```

Shared node detection rule: if you see the same function imported or called in 2+ different parent files, it is a shared node. Flag it before touching it.

---

### STEP 6 — PATTERN MIGRATION IN EXISTING CODEBASE

When replacing a bad pattern with a correct one across the codebase:

```
MIGRATION ORDER:
  1. MAP    → build full call graph for all instances of the bad pattern
  2. ISOLATE → change one instance at a time; never batch-replace
  3. TEST   → full test of that instance's chain before moving to next
  4. VERIFY → confirm no upstream callers pass the old contract
  5. REPEAT → move to next instance only after current chain is green

BAD PATTERN → GOOD PATTERN examples:

  proc(u) doing 3 things
    → isEligibleUser(user) + registerUser(user) + notifyUser(user)
    → update every caller of proc() to call the correct split fn

  SELECT * in PLpgSQL fn
    → name all columns explicitly
    → check every caller that destructures the return row; shape may change

  var x = ...
    → const/let
    → check for reassignment; var→const breaks if value is mutated

  raw literal 18 in condition
    → const ADULT_AGE_THRESHOLD = 18
    → update all files that contained the raw literal

  deeply nested callback
    → async/await
    → callers expecting .then() must be updated if they chain off the return
```

---

### QUICK REFERENCE — CHAIN CHECKLIST

Run before every refactor:

```
□ Drew the full call graph (upstream + downstream) for the target?
□ Identified all shared nodes?
□ Classified every node by risk (CHILD / GRANDCHILD / DOWNSTREAM)?
□ Confirmed which contracts change (signature, return shape, constants)?
□ Planned bottom-up change order (leaves first)?
□ Tested each node in isolation before moving up the chain?
□ Ran full chain test after all nodes updated?
□ Confirmed no caller still uses the old contract?
```