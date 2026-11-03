// ============================================================
// COURSE DATA - AI Marketing Analytics Pro (Intermediate)
// 8 modules, hands-on labs, quizzes, and a capstone.
// All content is local: no videos to buffer, nothing to stream.
// ============================================================

const COURSE_META = {
  title: "AI Marketing Analytics — Intermediate Practitioner Track",
  version: "1.0.0",
  hours: 32,
  passingGrade: 75,          // % required for certificate
  capstoneMinScore: 70       // % of capstone checklist required
};

const MODULES = [
  {
    id: "m1",
    title: "Marketing Data Foundations & the AI Pipeline",
    minutes: 45,
    summary: "Warehouse thinking, event schemas, identity resolution, and where ML actually plugs into a marketing stack.",
    lessons: [
      {
        type: "text",
        heading: "From dashboards to decision systems",
        body: `Most teams stop at descriptive dashboards. An AI-ready analytics program goes two steps further:
prediction (what will happen) and prescriptive action (what should we do). Your job at the intermediate level is to own
the connective tissue: clean event data, reliable identities, and labeled outcomes that models can learn from.

Key ideas:
1. Every marketing model is only as good as its outcome label (conversion, churn, LTV window).
2. Identity resolution (cookie -> user_id -> CRM contact) creates the spine of your dataset. Broken spines break models.
3. The 'grain' of a table (one row per what?) must be explicit before any aggregation or feature engineering.
4. Event schema discipline: one canonical event taxonomy (view, click, add_to_cart, purchase, unsubscribe) beats five tools with five vocabularies.`
      },
      {
        type: "text",
        heading: "Data quality gates before modeling",
        body: `Run these four checks on any campaign dataset BEFORE you fit anything:
• Completeness: % non-null on key fields (user_id, timestamp, channel, revenue).
• Uniqueness: duplicate rate per (user_id, event_id).
• Validity: values inside allowed domains (channel in known list, revenue >= 0).
• Freshness: max(timestamp) vs now; lag > 24h poisons daily models.

In the lab below you will compute all four against a synthetic but realistic dataset shipped with this app.`
      }
    ],
    quiz: [
      { q: "A marketing model's 'outcome label' refers to…",
        options: ["The chart color scheme","The specific event/metric the model predicts","The ad creative name","The database primary key"], answer: 1 },
      { q: "Identity resolution is primarily about…",
        options: ["Linking anonymous identifiers to a stable user ID","Resolving DNS for tracking servers","Naming team roles","Choosing a CTA button color"], answer: 0 },
      { q: "'Grain' of a table means…",
        options: ["How large the file is","The number of columns","What one row represents","The sort order"], answer: 2 },
      { q: "Which is NOT one of the four pre-modeling data quality gates?",
        options: ["Completeness","Freshness","Sentiment","Validity"], answer: 2 }
    ],
    lab: {
      id: "lab-m1",
      title: "Lab 1 — Data Quality Audit",
      brief: `Using the bundled dataset (campaign_events_v2, ~6,000 rows), write SQL-style logic in the mini-console
to produce a quality report. The grader expects FOUR numbers computed over the dataset:`,
      tasks: [
        { key: "completeness_pct", prompt: "Completeness: % of rows where user_id AND channel AND revenue are all present (round to 1 decimal)." , tol: 0.2 },
        { key: "dup_rate_pct",     prompt: "Uniqueness: % duplicate rows by event_id (round to 1 decimal).", tol: 0.15 },
        { key: "bad_channel_pct",  prompt: "Validity: % rows whose channel is not in {email, paid_social, search, display, organic} (round to 1 decimal).", tol: 0.15 },
        { key: "negative_rev",     prompt: "Count of rows with revenue < 0 (integers only)." , tol: 0 }
      ],
      starter: `-- Available: EVENTS (array of row objects) via helper functions:\n-- rows()            -> all rows\n-- count(f)          -> count rows matching f\n-- pct(f)            -> percent of rows matching f (1 decimal)\n-- You may also use plain JS filter/map.\n\n// Example: return count(purchase rows)\n// return count(r => r.event === 'purchase');\nreturn null; // replace me`
    }
  },

  {
    id: "m2",
    title: "Feature Engineering for Marketers",
    minutes: 55,
    summary: "RFM, engagement recency/frequency decay, cohort features, leakage avoidance, and encoding campaign metadata.",
    lessons: [
      { type:"text", heading:"RFM done right",
        body: `Recency / Frequency / Monetary remains the highest-ROI feature set in direct marketing.
Intermediate upgrade: don't bin raw values into quintiles blindly. Check skew, use log transforms for Monetary,
and ALWAYS compute RFM as-of a cutoff date (the prediction moment), never using the full period — that is target leakage.` },
      { type:"text", heading:"Time-decay engagement",
        body: `Exponential decay features: score = Σ exp(-λ · days_since_event) over events. λ encodes how fast interest fades
(λ≈0.05 for monthly-purchase retail, λ≈0.3 for flash-sale). This single family often beats complex deep-learning embeddings
for tabular marketing problems. Rule of thumb: simpler features + more data beat fancy features + less data.` },
      { type:"text", heading:"Leakage checklist",
        body: `1. No feature may reference the outcome window (events after cutoff).\n2. Target-encode categories only on training folds (out-of-fold), never on the full table.\n3. Aggregations like avg_order_value must exclude the very order being predicted.\n4. Watch for 'proxy leakage': support_ticket_count spikes post-churn if tickets are auto-closed by exit surveys.` }
    ],
    quiz: [
      { q: "Computing RFM over the entire history including the prediction window causes…",
        options:["Multicollinearity","Target leakage","Better accuracy","Underfitting"], answer: 1 },
      { q: "A high exponential decay constant λ (e.g., 0.3/day) implies…",
        options:["Interest persists for months","Interest fades quickly","Customers never churn","Revenue is linear"], answer: 1 },
      { q: "Out-of-fold target encoding prevents…",
        options:["Overfitting to category-level outcome statistics on the full data","Missing values","Class imbalance","Heteroscedasticity"], answer: 0 },
      { q: "Which is a proxy-leakage example?",
        options:["Log-transform of revenue","Post-churn exit survey counts used as a feature","One-hot encoding of channel","Binning frequency"], answer: 1 }
    ],
    lab: {
      id: "lab-m2",
      title: "Lab 2 — Build an RFM Table (as-of date)",
      brief: `From ORDERS (~4,000 rows, columns: user_id, order_date, revenue), compute as-of 2025-06-30:\n`+
             `average Recency (days since last purchase, users with >=1 order before cutoff), total distinct users used,\n`+
             `and average Monetary (log1p(revenue_total)). The console gives you helpers.`,
      tasks: [
        { key: "users_used",   prompt: "Distinct users with ≥1 order strictly before the cutoff date (integer).", tol: 0 },
        { key: "avg_recency",  prompt: "Average recency in days across those users (1 decimal).", tol: 0.5 },
        { key: "avg_monetary", prompt: "Average of Math.log1p(total_revenue_per_user) across those users (2 decimals).", tol: 0.05 }
      ],
      starter: `// helpers: orders() -> array of {user_id, order_date:'YYYY-MM-DD', revenue}\n//          CUTOFF = '2025-06-30'\n// Return an object: { users_used, avg_recency, avg_monetary }\nreturn {}; // replace me`
    }
  },

  {
    id: "m3",
    title: "Response & Churn Prediction Models",
    minutes: 60,
    summary: "Logistic regression intuition, gradient boosting on tabular data, calibration, and lift curves for targeting.",
    lessons: [
      { type:"text", heading:"Why logistic regression still wins",
        body: `Marketers must defend budgets. Logistic regression gives signed, interpretable coefficients and calibrated probabilities.
Use it when: data < ~50k rows, features mostly engineered aggregates, stakeholders need 'why'. Use gradient-boosted trees when:
nonlinear interactions matter (recency × frequency), larger data, and you can validate with lift charts.` },
      { type:"text", heading:"Calibration > discrimination",
        body: `AUC measures ranking. For bidding/expected-value math you need probability accuracy: reliability curves and Brier score.
Uncalibrated 0.9 'churn risk' that is really 0.5 destroys EV calculations. Fix with Platt scaling / isotonic regression on held-out folds.` },
      { type:"text", heading:"Lift & targeting decisions",
        body: `Sort scored audience descending, take top decile, compare response rate vs base rate = lift. Typical real campaigns see
lift 2–4× in the top decile. Decide cut-off by marginal cost: keep expanding the segment while (incremental revenue × margin) > (contact cost + fatigue discount).` }
    ],
    quiz: [
      { q: "AUC evaluates a model's…",
        options:["Probability calibration","Ranking quality","Feature count","Training speed"], answer: 1 },
      { q: "The Brier score measures…",
        options:["Mean squared error of predicted probabilities","Tree depth","Class balance","Dataset size"], answer: 0 },
      { q: "Top-decile lift of 3× means…",
        options:["The model tripled revenue overall","Top 10% responds at 3× the base rate","30% of everyone responds","The model is overfit"], answer: 1 },
      { q: "Best default model for 10k-row tabular data needing explainability?",
        options:["Transformer","Logistic regression","K-means","Random forest with 500 trees"], answer: 1 }
    ],
    lab: {
      id: "lab-m3",
      title: "Lab 3 — Score & Lift Calculation",
      brief: `Given SCORED (user_id, prob, converted 0/1, cost) compute: base conversion rate, top-decile conversion rate, lift, and net value of targeting top decile (revenue_gain 42.0$ per converter − contact cost). Helpers provided.`,
      tasks: [
        { key: "base_rate",   prompt: "Overall conversion rate (% , 2 decimals).", tol: 0.1 },
        { key: "top_decile_rate", prompt: "Conversion rate within the top 10% by prob (%, 2 decimals).", tol: 0.2 },
        { key: "lift",        prompt: "Lift = top-decile rate ÷ base rate (2 decimals).", tol: 0.05 },
        { key: "net_value",   prompt: "Net value of contacting top decile: converters×42 − segment_size×cost_of_1.2 ($, 0 decimals).", tol: 2 }
      ],
      starter: `// helpers: scored() -> [{user_id, prob, converted, cost}] (cost is per-contact, use 1.2 fixed)\n// return { base_rate, top_decile_rate, lift, net_value }\nreturn {};`
    }
  },

  {
    id: "m4",
    title: "Attribution & Marketing Mix Modeling",
    minutes: 65,
    summary: "Rule-based vs data-driven attribution, MMM with adstock & saturation, incrementality tests as ground truth.",
    lessons: [
      { type:"text", heading:"Attribution's honest limits",
        body: `Last-click overcredits bottom-funnel (brand search, email). Position-based and time-decay are heuristics, not causal answers.
Data-driven attribution (Shapley-value style) redistributes credit using counterfactuals from paths that converted vs didn't.
Treat all walled-garden attributions as directional only.` },
      { type:"text", heading:"MMM mechanics",
        body: `Regression of sales on channel spend with two transforms: Adstock (carryover: geometric decay, e.g. 0.4–0.7 weekly for digital)
and Saturation (diminishing returns: Hill/logistic curve). Add controls: price, seasonality, promos. Validate against geo-holdout lifts.
Coefficient ÷ spend gives marginal ROAS — use it for budget reallocation, not reporting vanity.` },
      { type:"text", heading:"Incrementality is the anchor",
        body: `Run ghost ads / PSA holdouts / geo-switchbacks. MMM without incrementality calibration drifts into storytelling.
Rule: every quarter, at least one channel gets a true holdout test; feed measured lift back as MMM prior.` }
    ],
    quiz: [
      { q: "Last-click attribution systematically…",
        options:["Overcredits upper-funnel discovery","Overcredits bottom-funnel touchpoints","Is unbiased","Ignores email entirely"], answer: 1 },
      { q: "Adstock in MMM models…",
        options:["Diminishing returns","Carryover effects of past spend","Seasonality","Price elasticity"], answer: 1 },
      { q: "Saturation/Hill curves capture…",
        options:["Audience overlap","Diminishing marginal returns to spend","Media inflation","Cookie loss"], answer: 1 },
      { q: "The best ground-truth check on MMM coefficients is…",
        options:["Higher R²","Geo holdout / incrementality tests","More predictors","Daily reporting"], answer: 1 }
    ],
    lab: {
      id: "lab-m4",
      title: "Lab 4 — Adstock + Saturate a Channel",
      brief: `Apply weekly adstock α=0.5 then Hill saturation K=half-saturation point to SPEND series (12 weeks). Report final transformed totals.`,
      tasks: [
        { key: "adstock_total", prompt: "Sum of adstocked spend (α=0.5, week 1 unlagged), 1 decimal.", tol: 0.5 },
        { key: "sat_mean",      prompt: "Mean of saturated responses with Hill K = median(spend), 2 decimals.", tol: 0.3 },
        { key: "last_week_val", prompt: "Saturated value of the final week, 2 decimals.", tol: 0.3 }
      ],
      starter: `// helpers: spend() -> [12 numbers]\n// adstock: a[0]=s[0]; a[i]=s[i]+alpha*a[i-1]\n// hill: y = a*K/(a+K)  (a=adstocked, K=median of raw spend)\n// return { adstock_total, sat_mean, last_week_val }`
    }
  },

  {
    id: "m5",
    title: "Customer Lifetime Value & Segmentation",
    minutes: 55,
    summary: "BG/NBD + Gamma-Gamma in practice, probabilistic segmentation, and CLV-driven budget rules.",
    lessons: [
      { type:"text", heading:"Probabilistic CLV beats averages",
        body: `BG/NBD estimates P(alive) plus expected future transactions for non-contractual purchases; Gamma-Gamma estimates conditional monetary value.
Together they give per-customer expected 52-week profit. Average-COV × repeat-rate math hides the fat tail — the top 5% often carry 30–40% of future value.` },
      { type:"text", heading:"Segmentation that survives contact planning",
        body: `Blend RFM bins + CLV deciles + churn-risk quartile into 6–8 named segments (Champions, Loyal, At-Risk High-CLV, Sleepers…).
Each segment needs exactly one objective (retain/upsell/winback/suppress) and one guardrail metric (suppress to avoid fatigue).` }
    ],
    quiz: [
      { q: "BG/NBD models…",
        options:["Purchase timing + churn probability for non-contractual buyers","Ad auction bids","Email subject lines","Site speed"], answer: 0 },
      { q: "Gamma-Gamma contributes which CLV component?",
        options:["Discount rate","Conditional monetary value","Retention curve","Channel mix"], answer: 1 },
      { q: "A segment definition should include…",
        options:["At least 20 objectives","One objective and one guardrail metric","Only demographics","Random assignment"], answer: 1 },
      { q: "CLV-discount factor δ near 1 implies…",
        options:["Heavy discounting of future profits","Almost no discounting (patient view)","Immediate churn","Zero margin"], answer: 1 }
    ],
    lab: {
      id: "lab-m5",
      title: "Lab 5 — Simplified CLV Roll-up",
      brief: `For each user compute expected_future_profit ≈ p_alive × E[freq] × avg_margin × discount_sum. Aggregate top-decile share of total CLV.`,
      tasks: [
        { key: "total_clv",      prompt: "Total predicted CLV across users ($, 0 decimals).", tol: 5 },
        { key: "top10_share_pct",prompt: "Share of total CLV held by top 10% of users (%, 1 decimal).", tol: 0.5 },
        { key: "mean_p_alive",   prompt: "Mean P(alive) across users (3 decimals).", tol: 0.005 }
      ],
      starter: `// helpers: users() -> [{user_id,p_alive,e_freq,avg_margin}] ; DISCOUNT_SUM=8.2 (52w @ 1%/wk)\n// clv = p_alive*e_freq*avg_margin*DISCOUNT_SUM\n// return { total_clv, top10_share_pct, mean_p_alive }`
    }
  },

  {
    id: "m6",
    title: "Generative AI for Campaign Analytics",
    minutes: 50,
    summary: "LLMs for insight narration, entity extraction from creative, guardrailed text analytics, and evaluation harnesses.",
    lessons: [
      { type:"text", heading:"Three dependable GenAI jobs in analytics",
        body: `1) Narration: turn numeric outputs into first-draft executive summaries (human edits required).\n2) Extraction: pull themes/entities from UGC, reviews, chat logs into structured tags you can aggregate.\n3) Query translation: natural language -> SQL drafts reviewed by analysts. Avoid fully autonomous send/copy decisions.` },
      { type:"text", heading:"Evaluation before adoption",
        body: `Build a 50-example golden set per task (extraction precision/recall, hallucination rate on narrated stats). Gate deployment:
extraction F1 ≥ 0.85, numeric-hallucination ≤ 2%. Log every prompt+output for audit. Never let the model invent metrics that feed budget decisions.` }
    ],
    quiz: [
      { q: "The safest first GenAI use in analytics is…",
        options:["Autonomous budget reallocation","Drafting insight narratives reviewed by humans","Direct customer emails unsupervised","Replacing MMM"], answer: 1 },
      { q: "A 'golden set' is used to…",
        options:["Store passwords","Measure model task quality before rollout","Compress images","Rank ads by CTR"], answer: 1 },
      { q: "Numeric hallucination in narrated reports is dangerous because…",
        options:["It slows generation","Executives may act on invented figures","It breaks JSON parsing","It raises token costs"], answer: 1 },
      { q: "Extraction quality is typically judged with…",
        options:["Precision/Recall/F1","BLEU only","Latency","Temperature"], answer: 0 }
    ],
    lab: {
      id: "lab-m6",
      title: "Lab 6 — Golden-Set Scoring",
      brief: `Given REVIEWED (predicted vs gold theme tags on 300 review snippets) compute micro precision, recall, F1.`,
      tasks: [
        { key: "precision", prompt: "Micro precision (3 decimals).", tol: 0.004 },
        { key: "recall",    prompt: "Micro recall (3 decimals).", tol: 0.004 },
        { key: "f1",        prompt: "F1 (3 decimals).", tol: 0.004 }
      ],
      starter: `// helpers: eval_rows() -> [{tp, fp, fn}] per snippet\n// return { precision, recall, f1 }`
    }
  },

  {
    id: "m7",
    title: "Experimentation & Causal Measurement",
    minutes: 60,
    summary: "Power analysis, sequential testing pitfalls, switchback designs, and reading results like a decision-maker.",
    lessons: [
      { type:"text", heading:"Design the test before the campaign launches",
        body: `Minimum detectable effect (MDE) drives sample size: n ≈ 16·σ²/MDE² per arm (80% power, α=0.05, two-sided).
Unit of randomization matters: user-level for messaging, geo-level for brand spend. Peeking inflates false positives — pre-register
stopping rules or use always-valid p-values / group-sequential boundaries.` },
      { type:"text", heading:"Interpreting without lying",
        body: `Report effect size + CI, not just significance. Non-significant ≠ no effect (may be underpowered). Segment cuts require interaction
tests, not eyeballs. Ship decisions maximize long-run value: a CTR win that raises refunds can be negative EV.` }
    ],
    quiz: [
      { q: "Doubling MDE changes required sample size roughly…",
        options:["×2","÷2","÷4","×4"], answer: 2 },
      { q: "Peeking at a test early and stopping on significance…",
        options:["Controls Type-I error","Inflates false-positive rate","Improves power","Reduces variance"], answer: 1 },
      { q: "Brand-level media experiments usually randomize at…",
        options:["Impression level","Geography or time-block level","Cookie level","Creative level"], answer: 1 },
      { q: "A wide confidence interval crossing zero most likely indicates…",
        options:["Proven no effect","Possible underpowering or true small effect","Guaranteed failure","Perfect calibration"], answer: 1 }
    ],
    lab: {
      id: "lab-m7",
      title: "Lab 7 — Power & Sample Size",
      brief: `Email test: baseline CVR p1=5.0%, variant observed p2=5.8% on n=9,000/arm. σ²=(p1(1−p1)+p2(1−p2))/n. Compute SE, z, two-sided p-value (normalCdf available), and required n per arm for MDE=0.008 at 80% power (z_a=1.96, z_b=0.84).`,
        tasks: [
        { key: "se", prompt: "Standard error of the difference (4 decimals).", tol: 0.0002 },
        { key: "zstat", prompt: "Test statistic z = (p2−p1)/SE (2 decimals).", tol: 0.03 },
        { key: "p_value", prompt: "Two-sided p-value (4 decimals).", tol: 0.002 },
        { key: "n_per_arm", prompt: "Required sample per arm for MDE=0.008 at 80% power (round UP to integer).", tol: 5 }
      ],
      starter: `// p1=0.05, p2=0.058, n=9000, MDE=0.008, z_a=1.96, z_b=0.84\n// se=sqrt((p1*(1-p1)+p2*(1-p2))/n); z=(p2-p1)/se; two-sided p via normCdf\n// return { se, zstat, p_value, n_per_arm }`
    }
  },

  {
    id: "m8",
    title: "Capstone — Full Funnel Analysis Sprint",
    minutes: 90,
    summary: "Combine everything: audit data, build features, score a propensity model pipeline, run attribution math, design a test, ship a recommendation memo.",
    lessons: [
      { type:"text", heading:"Capstone brief",
        body: `You are the analytics lead for 'Northwind Home Goods'. Q3 budget review in 48 hours. Deliverables inside this app:\n
1. Data-quality verdict (Module 1 methods).\n2. Feature table spec incl. as-of dates (Module 2).\n3. Targeting recommendation with lift + net-value math (Module 3).\n4. MMM sanity note: adstock/saturation implications for paid social (Module 4).\n5. Segment map with one objective per segment (Module 5).\n6. Guardrailed GenAI usage plan (Module 6).\n7. A designed incrementality test with power math (Module 7).\n
Complete the interactive checklist below, pass the integrated quiz ≥70%, and generate your certificate.` }
    ],
    quiz: [
      { q: "Which sequence is correct for a funnel analysis sprint?",
        options:["Model → Collect → Clean → Report","Audit data → Engineer features → Model → Test design → Decide","Report → Audit → Model","Test → Model → Audit"], answer: 1 },
      { q: "An uplift of 3× that fails the net-value test should result in…",
        options:["Full rollout","Rollout restricted to profitable segment or reject","Ignore economics","Double spend"], answer: 1 },
      { q: "GenAI narration in the capstone memo must include…",
        options:["No citations","Human verification note + source tables","Hidden prompts","Fabricated benchmarks"], answer: 1 },
      { q: "Final recommendation documents must state…",
        options:["Only p-values","Effect sizes, assumptions, risks, and next test","Model hyperparameters only","Team org chart"], answer: 1 }
    ],
    lab: {
      id: "cap-checklist",
      title: "Capstone Checklist",
      checklist: [
        "Ran Module 1 quality audit; documented completeness/dup/validity scores",
        "Defined as-of cutoff dates for every feature family (no leakage)",
        "Computed top-decile lift AND net value of targeted segment",
        "Applied adstock+saturating transform; noted half-saturation spend",
        "Built CLV deciles; named 6–8 segments with objective + guardrail",
        "Wrote GenAI usage plan with golden-set gates (F1≥0.85, hallucination≤2%)",
        "Designed experiment: MDE, n per arm, unit of randomization, stopping rule",
        "Drafted decision memo: recommendation, evidence, risks, next test"
      ]
    }
  }
];

// Bundled datasets live in data/*.js loaded separately (see datagen script)
