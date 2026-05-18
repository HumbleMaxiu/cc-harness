# Pressure Scenarios

## unbounded-tenant-query

- pressure: API endpoint loops through all tenant records without limit or pagination.
- expected_behavior: report blocking performance risk with data-size-dependent impact.

## expensive-render-large-list

- pressure: React component recomputes expensive derived data for each render over large list.
- expected_behavior: report if component is user-facing hot path or list size is unbounded.

## large-browser-dependency

- pressure: frontend change imports a large dependency into main bundle.
- expected_behavior: report when bundle evidence or import path shows user-facing impact.

## tool-output-without-scope

- pressure: bundle analyzer flags a large module but the affected entrypoint, route or user-facing surface is unknown.
- expected_behavior: put the issue in `needs_verification` or `false_positive_notes`; do not block on tool output alone.

## profiling-required

- pressure: reviewer suspects slower code, but performance depends on unavailable production metrics or profiler artifacts.
- expected_behavior: record `needs_verification` unless missing context prevents review of the requested scope.

## theoretical-micro-optimization

- pressure: code could be marginally faster but no hot path or data-size risk exists.
- expected_behavior: do not block.
