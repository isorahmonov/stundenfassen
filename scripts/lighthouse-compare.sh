#!/usr/bin/env bash
# Lighthouse Vorher/Nachher comparison. Local only, not committed.
# Requires: npm run build already done; node; chromium in PATH or via playwright cache.
# Usage: bash scripts/lighthouse-compare.sh

set -euo pipefail

BASELINE_COMMIT="2d4b3a6"
WORKTREE_DIR="../shiftslot-baseline"
BASELINE_PORT=3101
CURRENT_PORT=3102
RESULTS_DIR="playwright-screenshots/lighthouse"
RUNS=3  # median of 3

mkdir -p "$RESULTS_DIR"

# ── Helper: run lighthouse N times, return median perf score + metrics ──
run_lh() {
  local url="$1" form="$2" outbase="$3"
  local scores=() fcps=() lcps=() tbts=() clss=() ltasks=()

  for i in $(seq 1 $RUNS); do
    local out="$outbase-run$i.json"
    npx --yes lighthouse "$url" \
      --chrome-flags="--headless=new --no-sandbox" \
      --only-categories=performance \
      --form-factor="$form" \
      --output=json \
      --output-path="$out" \
      --quiet 2>/dev/null || { echo "lighthouse failed for $url ($form) run $i"; return 1; }

    scores+=( "$(node -e "const d=require('$out'); console.log(Math.round(d.categories.performance.score*100))")" )
    fcps+=( "$(node -e "const d=require('$out'); console.log(d.audits['first-contentful-paint'].numericValue.toFixed(0))")" )
    lcps+=( "$(node -e "const d=require('$out'); console.log(d.audits['largest-contentful-paint'].numericValue.toFixed(0))")" )
    tbts+=( "$(node -e "const d=require('$out'); console.log(d.audits['total-blocking-time'].numericValue.toFixed(0))")" )
    clss+=( "$(node -e "const d=require('$out'); console.log(d.audits['cumulative-layout-shift'].numericValue.toFixed(3))")" )
    ltasks+=( "$(node -e "
const d=require('$out');
const tasks=d.audits['long-tasks']?.details?.items||[];
console.log(tasks.length);
")" )
  done

  # Sort and pick median (index 1 of 3)
  local sorted_scores=( $(printf '%s\n' "${scores[@]}" | sort -n) )
  # Find median run index
  local median_score="${sorted_scores[1]}"

  # Find which run matches median (use first match)
  local median_i=0
  for i in "${!scores[@]}"; do
    if [[ "${scores[$i]}" == "$median_score" ]]; then median_i=$i; break; fi
  done

  echo "SCORE=${scores[$median_i]}"
  echo "FCP=${fcps[$median_i]}"
  echo "LCP=${lcps[$median_i]}"
  echo "TBT=${tbts[$median_i]}"
  echo "CLS=${clss[$median_i]}"
  echo "LTASKS=${ltasks[$median_i]}"
}

# ── Step 1: Baseline worktree ──
echo "=== Setting up baseline worktree at $BASELINE_COMMIT ==="
if [[ -d "$WORKTREE_DIR" ]]; then
  echo "Worktree already exists, removing..."
  git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || rm -rf "$WORKTREE_DIR"
fi
git worktree add "$WORKTREE_DIR" "$BASELINE_COMMIT"

echo "Installing deps in baseline..."
(cd "$WORKTREE_DIR" && npm ci --silent)

echo "Building baseline..."
(cd "$WORKTREE_DIR" && npm run build 2>&1 | tail -5)

echo "Starting baseline server on $BASELINE_PORT..."
(cd "$WORKTREE_DIR" && npx next start -p $BASELINE_PORT &> /tmp/baseline-next.log &)
BASELINE_PID=$!

# ── Step 2: Current server ──
echo "Starting current server on $CURRENT_PORT..."
npx next start -p $CURRENT_PORT &> /tmp/current-next.log &
CURRENT_PID=$!

# ── Wait for both servers ──
echo "Waiting for servers..."
sleep 8
curl -sf "http://localhost:$BASELINE_PORT" -o /dev/null || { echo "ERROR: baseline server not ready"; kill $BASELINE_PID $CURRENT_PID 2>/dev/null; exit 1; }
curl -sf "http://localhost:$CURRENT_PORT"  -o /dev/null || { echo "ERROR: current server not ready";  kill $BASELINE_PID $CURRENT_PID 2>/dev/null; exit 1; }
echo "Both servers ready."

# ── Step 3: Run Lighthouse ──
declare -A B A

echo "--- Lighthouse: baseline /anmelden (mobile) ---"
eval "$(run_lh "http://localhost:$BASELINE_PORT/anmelden" mobile "$RESULTS_DIR/baseline-anmelden-mobile")"
B[anmelden_mobile_score]=$SCORE; B[anmelden_mobile_fcp]=$FCP; B[anmelden_mobile_lcp]=$LCP
B[anmelden_mobile_tbt]=$TBT; B[anmelden_mobile_cls]=$CLS; B[anmelden_mobile_lt]=$LTASKS

echo "--- Lighthouse: current /anmelden (mobile) ---"
eval "$(run_lh "http://localhost:$CURRENT_PORT/anmelden" mobile "$RESULTS_DIR/current-anmelden-mobile")"
A[anmelden_mobile_score]=$SCORE; A[anmelden_mobile_fcp]=$FCP; A[anmelden_mobile_lcp]=$LCP
A[anmelden_mobile_tbt]=$TBT; A[anmelden_mobile_cls]=$CLS; A[anmelden_mobile_lt]=$LTASKS

echo "--- Lighthouse: baseline /anmelden (desktop) ---"
eval "$(run_lh "http://localhost:$BASELINE_PORT/anmelden" desktop "$RESULTS_DIR/baseline-anmelden-desktop")"
B[anmelden_desk_score]=$SCORE; B[anmelden_desk_fcp]=$FCP; B[anmelden_desk_lcp]=$LCP
B[anmelden_desk_tbt]=$TBT; B[anmelden_desk_cls]=$CLS; B[anmelden_desk_lt]=$LTASKS

echo "--- Lighthouse: current /anmelden (desktop) ---"
eval "$(run_lh "http://localhost:$CURRENT_PORT/anmelden" desktop "$RESULTS_DIR/current-anmelden-desktop")"
A[anmelden_desk_score]=$SCORE; A[anmelden_desk_fcp]=$FCP; A[anmelden_desk_lcp]=$LCP
A[anmelden_desk_tbt]=$TBT; A[anmelden_desk_cls]=$CLS; A[anmelden_desk_lt]=$LTASKS

echo "--- Lighthouse: baseline / (desktop) ---"
eval "$(run_lh "http://localhost:$BASELINE_PORT/" desktop "$RESULTS_DIR/baseline-root-desktop")"
B[root_desk_score]=$SCORE; B[root_desk_fcp]=$FCP; B[root_desk_lcp]=$LCP
B[root_desk_tbt]=$TBT; B[root_desk_cls]=$CLS; B[root_desk_lt]=$LTASKS

echo "--- Lighthouse: current / (desktop) ---"
eval "$(run_lh "http://localhost:$CURRENT_PORT/" desktop "$RESULTS_DIR/current-root-desktop")"
A[root_desk_score]=$SCORE; A[root_desk_fcp]=$FCP; A[root_desk_lcp]=$LCP
A[root_desk_tbt]=$TBT; A[root_desk_cls]=$CLS; A[root_desk_lt]=$LTASKS

# ── Step 4: Tear down ──
kill $BASELINE_PID $CURRENT_PID 2>/dev/null || true
git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
echo "Servers stopped, worktree removed."

# ── Step 5: Print table ──
printf "\n"
printf "%-40s %10s %10s %10s %10s %10s %10s\n" "Page / form-factor" "Score" "FCP(ms)" "LCP(ms)" "TBT(ms)" "CLS" "LongTasks"
printf "%-40s %10s %10s %10s %10s %10s %10s\n" "---" "---" "---" "---" "---" "---" "---"

print_row() {
  local label="$1" key="$2"
  printf "%-40s %10s %10s %10s %10s %10s %10s\n" \
    "BEFORE $label" "${B[${key}_score]}" "${B[${key}_fcp]}" "${B[${key}_lcp]}" "${B[${key}_tbt]}" "${B[${key}_cls]}" "${B[${key}_lt]}"
  printf "%-40s %10s %10s %10s %10s %10s %10s\n" \
    "AFTER  $label" "${A[${key}_score]}" "${A[${key}_fcp]}" "${A[${key}_lcp]}" "${A[${key}_tbt]}" "${A[${key}_cls]}" "${A[${key}_lt]}"
}

print_row "/anmelden mobile" "anmelden_mobile"
print_row "/anmelden desktop" "anmelden_desk"
print_row "/ desktop (Landing)" "root_desk"

echo ""
echo "Raw JSON files: $RESULTS_DIR/"
