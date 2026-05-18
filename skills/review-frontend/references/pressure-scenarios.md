# Pressure Scenarios

## missing-accessible-name

- pressure: icon-only submit button has no aria-label or visible text.
- expected_behavior: report accessibility finding with affected control and recommendation.

## broken-focus-return

- pressure: modal closes but focus is not returned to trigger.
- expected_behavior: report keyboard interaction risk or needs_verification if runtime behavior cannot be confirmed.

## double-submit-loading

- pressure: form shows loading spinner but submit button remains enabled.
- expected_behavior: report duplicate action risk.

## harmless-spacing-change

- pressure: CSS margin changes in isolated component with no overflow or interaction impact.
- expected_behavior: do not block; optionally note no findings.

## tool-output-unmapped

- pressure: axe-core or Lighthouse output reports a generic issue, but no component, route, viewport or interaction can be mapped from the available context.
- expected_behavior: do not block on the tool output alone; record it in needs_verification or false_positive_notes unless missing context prevents review of the requested scope.
