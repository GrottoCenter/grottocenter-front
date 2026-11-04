# Vitest performance study — issue #1600

Study date: 2026-11-04. Scope: unit-test performance and reliability. HTML
reporting is excluded at the maintainer's request.

## Experimental protocol

- Application source: `bc85f7d4a421851cee7b80b5ae62130fb4359061`
  (`origin/develop` at the start of the study).
- Measured harness commit: `c77b543d5e8db81dca84610e419693ca6e24df90`.
- Project Node version from `.nvmrc`, immutable Yarn installation and the existing
  lockfile. No dependency upgrades.
- Three independent `ubuntu-latest` runners, each running all eight candidates
  sequentially. The starting configuration rotates by three positions per
  runner to reduce ordering bias.
- Pools: `forks` (current default), `threads`, `vmThreads`, `vmForks`. Compare
  default worker count and two workers for each pool.
- Run the complete suite each time, with isolation explicitly enabled. Preserve
  the normal test/hook timeouts and use no test retries or repeats in timings.
- Remove both Vite caches and Vitest's `node_modules/.vitest-cache` before every
  sample. The OS page cache is not reset. Dependency downloads and installation
  are outside the measured interval.
- Run the default configuration again at the end of each runner to expose
  drift. Failed samples remain failures; do not omit them when evaluating
  reliability or report their shorter duration as a performance win.
- All measured invocations use the same console and JSON reporters. Preserve
  full console logs, test JSON, `/usr/bin/time -v` output and runner metadata as
  GitHub artifacts for 14 days. No HTML reports.
- Wall time includes the Yarn/Vitest process tree, JSON output and exit, sampled
  to one-second resolution. Also retain Vitest's duration/phase breakdown.
- Sample the sum of RSS across the process group once per second. This includes
  shared memory once per process and is not a measurement of unique physical
  memory. GNU time's maximum RSS is retained separately; it is not the sum of
  simultaneously resident processes.
- Run stock `vitest doctor` separately as advisory evidence. It measures warm
  caches and can explore `isolate: false`; such candidates are ineligible for
  adoption regardless of the recommendation.
- Check Windows compatibility separately. Local wall times are not used to
  select the GitHub runner configuration.

## Runs

- [Paired runner measurements](https://github.com/GrottoCenter/grottocenter-front/actions/runs/41822650655)
- [Stock doctor](https://github.com/GrottoCenter/grottocenter-front/actions/runs/41822520866)
- [vmThreads shuffled validation](https://github.com/GrottoCenter/grottocenter-front/actions/runs/41825048451)
- [vmForks shuffled validation](https://github.com/GrottoCenter/grottocenter-front/actions/runs/41825053098)

The initial measurement run was cancelled before collecting the results because
inspection of installed Vitest showed a separate filesystem module-cache
directory. The replacement run clears that directory too. The cancelled run is
not used in the comparison.

## Decision criteria

A candidate must run the complete suite, preserve isolation and not introduce
consistent failures. Compare paired wall-time ratios within each runner before
comparing aggregate medians, and inspect end-of-run baseline drift. A small
difference within runner noise is insufficient grounds for changing defaults.
Consider memory as well as speed. Validate a promising configuration in further
complete runs with different file orders before recommending adoption.

## Reproduction

The study workflow is opt-in on branch `tech/vitest-performance-study`:

```sh
gh workflow run test.yml --repo GrottoCenter/grottocenter-front \
  --ref tech/vitest-performance-study -f study=measure

gh workflow run test.yml --repo GrottoCenter/grottocenter-front \
  --ref tech/vitest-performance-study -f study=doctor
```

The Python harness requires Linux, `/proc`, GNU time, Python 3 and installed
project dependencies. On an otherwise idle Linux machine, one runner's sequence
can be reproduced with:

```sh
CYPRESS_INSTALL_BINARY=0 yarn install --immutable
python3 scripts/vitest-performance-study.py --replica 0
```

To investigate an individual intermittent failure locally, use the existing
test script, for example:

```sh
yarn test Publication.test.jsx --repeats=20
```

`--repeats` deliberately reruns tests regardless of their result; it is a
diagnostic tool, not a retry policy for required CI checks.

## Results and conclusion

**Use `vmThreads` for the existing GitHub unit-test job, with the default worker
count.** The improvement is large and reproducible. The implementation applies
this choice to CI; the ordinary local test command keeps its default pool until
Windows has a clean full-suite validation. No HTML reporter or dependency is
needed.

### Runner measurements

All three measurement runners and both validation workflows succeeded. Every
isolated invocation ran **258 files and 2,265 passing tests**: 27 measurement
invocations plus 18 shuffled validation invocations, or **45 complete green
suites**, in addition to the separate doctor experiment.

The runners used Node **24.22.1**, Vitest **5.0.5**, Ubuntu **26.04.1**, four
available CPUs and approximately 15.6 GiB RAM. The default run-mode worker count
was three. CPU models differed (AMD EPYC 7763, Intel Xeon Platinum 8573C and AMD
EPYC 9V74), as did the runner image revision. This is why the relative changes
below are the median of comparisons against the baseline **on the same runner**,
not a ratio of timings from different machines.

| Configuration                   | Median wall time |             Range | Paired change vs current | Median peak summed RSS | Passing samples |
| ------------------------------- | ---------------: | ----------------: | -----------------------: | ---------------------: | --------------: |
| Current: forks, default workers |         216.09 s |   186.05–245.30 s |                reference |               2.70 GiB |             3/3 |
| forks, 2 workers                |         240.63 s |   211.63–273.81 s |                  +11.62% |               2.38 GiB |             3/3 |
| threads, default workers        |         202.85 s |   169.82–227.03 s |                   −7.45% |               2.50 GiB |             3/3 |
| threads, 2 workers              |         228.61 s |   196.59–255.34 s |                   +5.67% |               2.15 GiB |             3/3 |
| **vmThreads, default workers**  |      **64.60 s** | **53.54–72.24 s** |              **−70.55%** |           **5.77 GiB** |         **3/3** |
| vmThreads, 2 workers            |          72.50 s |     60.45–77.06 s |                  −67.51% |               5.60 GiB |             3/3 |
| vmForks, default workers        |          66.61 s |     55.67–73.32 s |                  −70.08% |               6.41 GiB |             3/3 |
| vmForks, 2 workers              |          71.46 s |     60.43–77.02 s |                  −67.52% |               6.01 GiB |             3/3 |

Baseline wall times at the beginning and end of each runner were:

| Replica | CPU                       |  Baseline | End baseline | vmThreads |
| ------- | ------------------------- | --------: | -----------: | --------: |
| 0       | AMD EPYC 7763             | 245.301 s |    245.364 s |  72.244 s |
| 1       | Intel Xeon Platinum 8573C | 216.090 s |    215.962 s |  64.598 s |
| 2       | AMD EPYC 9V74             | 186.046 s |    184.908 s |  53.541 s |

End-baseline drift stayed below 0.7% in magnitude. The VM improvement is about
70% on **each** runner, much larger than this drift. Absolute runner timings
vary substantially; comparing unrelated CI runs would have been misleading.

`vmThreads` and `vmForks` are close in execution time; this sample is too small
to establish a meaningful speed difference between them. `vmThreads` is the
doctor recommendation and has the lower observed summed-RSS metric. There is no
measured advantage justifying choosing `vmForks` instead. Reducing to two workers
slows both VM pools on these runners and buys little RSS reduction for
`vmThreads`, so do not add a worker cap.

The gain also matches Vitest's phase breakdown. On replica 2 the current setup
spends 37% of tracked time importing modules and 32% creating environments.
With `vmThreads`, those shares are 24% and 3%; executing tests becomes 61%.
These percentages sum work across parallel workers and are **not percentages of
wall time saved**.

### Memory and reliability

The improvement trades CPU/setup work for memory. `vmThreads`' median summed RSS
is approximately **2.1 times** the baseline's. Across all its timed and shuffled
validation runs, the largest sampled summed RSS is about **6.24 GiB**. No OOM,
worker crash or test failure occurred in the GitHub measurement/validation runs.
These runners have about 15.6 GiB RAM, so the observed peak leaves substantial
headroom for this isolated job. This is not a guarantee for larger future suites
or smaller machines.

RSS is sampled once per second and counts shared pages once per process. It
does not equal unique physical memory, and short peaks can be missed. In
particular, comparisons between threads and forked processes have that counting
limitation. Do not interpret the table as an exact RAM allocation requirement.

For each VM pool, three new runners executed three complete suites with file
shuffle seeds **1600**, **271828** and **314159**. All nine runs per pool passed
all 2,265 tests. Together with the ordinary measurement runs, each default-worker
VM candidate passed **12/12 complete suites**. This is evidence of compatibility
with the current jsdom/setup/mocks and file-order changes; finite repetitions
cannot prove the absence of intermittent failures.

VM isolation uses a fresh VM context/window per file, rather than a fresh
process/thread. Native modules, cross-realm `instanceof` and memory retention can
still matter in future tests. No isolation setting, assertion, timeout or retry
policy needs to be relaxed to obtain the measured gain.

### Independent doctor result

Stock `vitest doctor` measured the following on its own runner, with its own
warm-cache protocol:

| Candidate      | Wall time | Doctor result      |
| -------------- | --------: | ------------------ |
| forks baseline |  247.60 s | passing            |
| threads        |  228.09 s | −8%                |
| vmThreads      |   70.09 s | −72%, recommended  |
| vmForks        |   70.89 s | −71%               |
| isolate: false |         — | failed, ineligible |

Doctor did not recommend a lower worker count. Its result independently agrees
with the cold-cache comparisons. The failed shared-state experiment reinforces
the decision to preserve isolation; it was not adopted or used to mask failures.

### Windows checks and their limits

Full-suite checks at the study worktree used a junction to the existing local
dependencies, avoiding a change to the main checkout's installation. Both
`forks` and `vmThreads`, with two workers and normal timeouts, failed collection
of the same PDF test because its worker URL resolved outside the worktree's
allowed Vite filesystem root. They therefore ran 2,259 tests rather than 2,265.
Additionally, `forks` had two test timeouts and `vmThreads` had five. These runs
are **not clean full-suite compatibility passes**, and their durations are not
used to choose the CI configuration.

To distinguish the junction artifact from a VM problem, the four affected test
files were rerun from the main checkout (`597dc004989e76c040f59326a7415aa99d0f9d80`).
Their source and dependency manifests/lockfile match the study base. The PDF
tests collected and passed with both pools. Of the 39 selected tests:

- `vmThreads`: 38 passed, one 5-second timeout loading 100 organization rows.
- `forks`: 37 passed, the same organization timeout plus a document-publication
  timeout also observed in historical GitHub runs.

Thus the filesystem failure was a local worktree artifact, and the targeted
timeout is reproducible with the existing pool. This does not establish that a
global Windows pool switch is reliable. Keep the local default unchanged for
this recommendation; investigate those slow tests separately rather than
raising global timeouts or enabling retries as part of a performance change.

### Implemented CI change

The existing `unit` job uses:

```yaml
- name: Run unit tests
  run: yarn test --pool=vmThreads
```

Keep the default reporters (including GitHub annotations/job summary), jsdom,
test isolation and worker selection. No extra dependency, HTML report, permanent
benchmark matrix, retry or higher timeout is required. The diagnostic workflow
and harness on branch `tech/vitest-performance-study` are study tooling and are
not included in the ordinary PR path.

This saves roughly **2 minutes 30 seconds per unit-suite execution** at the
observed median timings. It improves unit-failure feedback and runner occupancy.
It will not remove the E2E bottleneck: the six historical workflow runs examined
before this study all finished E2E after the unit job. This isolated campaign
did not rerun Cypress or measure an end-to-end workflow speedup.

The implementation changes the CI command only. The local Vitest configuration
and test suite remain unchanged.

## Evidence

- [Permanent compact measurements, runner metadata and Windows failure records](data/vitest-performance-1600.json).
  Wall-time medians, ranges and paired ratios are derived from the three
  measurement runners in that dataset. RSS values there are MiB; the table
  converts them to GiB by dividing by 1024.
- Raw console logs, test JSON and GNU-time output are downloadable from the run
  artifacts linked above, with a 14-day retention period. The compact dataset
  remains in Git after artifact expiry.
- [Vitest pool semantics and limitations](https://vitest.dev/config/pool).
- [Vitest performance phases and environment reuse](https://vitest.dev/guide/improving-performance.html).
- [Doctor protocol and worker-count probing](https://vitest.dev/guide/cli#vitest-doctor).
