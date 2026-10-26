# Apply

## Establish the approved target

Read every shape file owning source in scope and the contracts of collaborators
needed to interpret their interfaces. Compare the target with current code and
project conventions. Identify missing contracts, ambiguous ownership, conflicting
commitments, and proposed interface changes.

Complete this step when each planned code change has an approved contract and
its responsibility boundary is clear. For a gap or conflict, present the concrete
contract proposal or decision needed and wait for confirmation of that part.
Continue independent work already covered by approved contracts.

## Implement

Make code conform to the approved organization, file membership, public
structures, and behavioral commitments. Choose private mechanisms within those
constraints. Include callers affected by an approved interface change within the
authorized scope; identify any work that would extend it.

Use the project's implementation and testing practices. Verify changed behavior
with evidence appropriate to the contract, including its errors and effects.
Complete this step when all authorized changes are implemented and relevant
checks have run. If blocked, identify what prevents meeting that criterion.

## Verify and report

Read [Check](check.md) and assess the affected scope. Repair implementation
violations within the task's authorization, then reassess the affected contracts.
Preserve the approved contract during repairs; contract changes follow the
skill's approval boundary rather than erasing a failed check.

Finish with the changes made, evidence of conformance, and remaining gaps,
blockers, or unverified commitments.
