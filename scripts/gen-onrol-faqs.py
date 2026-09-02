"""Generate category-UNIQUE, AEO-optimized "People Also Ask" FAQs for ONROL's
programmatic pages, using the paa-tree engine.

Each category (a generic city page, each course, each persona) gets its OWN
answer-first questions with a {city} placeholder the page interpolates at render
time — so all ~1,778 geo pages gain fresh, snippet-/AI-Overview-friendly FAQs
with NO per-page LLM calls and NO thin content.

Output: <repo>/data/paa-faqs.json  ->  { "<category_key>": [ {"q":..., "a":...}, ... ] }

Run (key comes from the environment, never committed):
  GEMINI_API_KEYS=k1,k2 python scripts/gen-onrol-faqs.py
"""
import os, sys, json, time

# import the paa-tree engine (sibling project in the scratch folder)
PAA_DIR = r"E:\vs code projects\scratch\paa-tree"
sys.path.insert(0, PAA_DIR)
import paa  # reuse llm() + rotation + _extract_json

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "data", "paa-faqs.json")
N = int(os.environ.get("FAQ_N", "3"))

TIERS = {
    1: "a major Indian metro and large tech/business hub",
    2: "a fast-growing Indian tier-2 city with a rising professional base",
    3: "a smaller Indian tier-3 city / emerging market where in-person AI options are scarce",
}

RULES = """ONROL is a live, ONLINE AI "execution school" — build-first, portfolio over theory,
taught in English, no coding required. Cohorts are 100% online (evening/weekend batches),
so a city means who is nearby, not a physical campus.

The city in question is {tierdesc}. Frame the questions and answers to fit that kind of place
(e.g. for a smaller city, lean on "no local classroom needed — learn live online from here").

Optimize for Answer Engine Optimization (being cited by Google AI Overviews / Perplexity /
ChatGPT) and featured snippets.

Write {n} DISTINCT, high-value questions a real person would actually ask, SPECIFIC to this
topic and this kind of city. For each, write an ANSWER-FIRST answer: the direct answer in the
first sentence, about 35-45 words, practical and trustworthy.

Placeholders — use these EXACT tokens; they are filled with the real city's data at render time:
- {{city}}      the place name (e.g. "in {{city}}"). ALWAYS use it — never a real city name.
- {{industry}}  a noun phrase for the city's local economy, e.g. "IT services and product firms"
                or "an automotive and manufacturing belt". Use it naturally in at least ONE
                answer, e.g. "With {{city}}'s {{industry}}, ...". Do NOT add "the" before it.
- {{area}}      a well-known locality/neighbourhood in the city. Use it in at least ONE answer,
                e.g. "learners from {{area}} and across {{city}}".

Hard rules:
- NEVER invent fees, prices, placement or salary percentages, ratings, star reviews, exact
  durations in weeks, or any institute/brand names.
- NEVER name competitor institutes; compare only by category if unavoidable.
- ONROL is online, so if the question implies offline/classroom "in {{city}}", clarify it is
  live online, available from {{city}}. Route the reader to ONROL's live cohort.
- Never guarantee a job; speak about portfolio-driven employability honestly.
- Natural, human phrasing. No markdown.

Return ONLY a JSON array of objects: [{{"q": "...", "a": "..."}}, ...]"""

TOPIC = {
    "geo-city": "learning AI / doing a live online AI course in {city}",
}
COURSES = {
    "data-analytics-with-ai": "Data Analytics with AI",
    "power-bi": "Power BI",
    "generative-ai": "Generative AI",
    "ai-automation": "AI Automation",
    "ai-digital-marketing": "AI Digital Marketing",
    "prompt-engineering": "Prompt Engineering",
    "python-for-ai": "Python for AI",
    "sql": "SQL for data & AI",
    "data-science": "Data Science",
    "ai-agents": "AI Agents",
    "ai-app-development": "AI App Development",
    "ai-content-creation": "AI Content Creation",
}
PERSONAS = {
    "it-professionals": "IT professionals",
    "finance-professionals": "finance professionals",
    "hr-professionals": "HR professionals",
    "sales-professionals": "sales professionals",
    "marketing-professionals": "marketing professionals",
    "healthcare-professionals": "healthcare professionals",
    "business-owners": "business owners",
    "freshers": "freshers and students",
}


def build_categories():
    base = [("geo-city", TOPIC["geo-city"])]
    for k, label in COURSES.items():
        base.append(("course:" + k, f"doing a {label} course (applied, with AI) in {{city}}"))
    for k, label in PERSONAS.items():
        base.append(("persona:" + k, f"a live online AI course made for {label} in {{city}}"))
    # cross each category with each city tier -> key "category|t<tier>"
    cats = []
    for key, topic in base:
        for tier in TIERS:
            cats.append((f"{key}|t{tier}", topic, tier))
    return cats


def gen(topic, tier):
    prompt = f"Topic: {topic}\n\n" + RULES.format(n=N, tierdesc=TIERS[tier])
    raw = paa.llm(prompt)
    arr = paa._extract_json(raw) or []
    out = []
    for it in arr:
        if isinstance(it, dict) and it.get("q") and it.get("a"):
            out.append({"q": it["q"].strip(), "a": it["a"].strip()})
    return out[:N]


def main():
    cats = build_categories()
    data = {}
    try:
        data = json.load(open(OUT, encoding="utf-8"))  # resume-friendly
    except Exception:
        pass
    for i, (key, topic, tier) in enumerate(cats):
        if key in data and data[key]:
            print(f"  [{i+1}/{len(cats)}] skip {key} (have {len(data[key])})", file=sys.stderr)
            continue
        try:
            faqs = gen(topic, tier)
            if not faqs:
                print(f"  ! {key}: empty, will retry next run", file=sys.stderr)
                continue
            data[key] = faqs
            print(f"  [{i+1}/{len(cats)}] {key}: {len(faqs)} Q", file=sys.stderr, flush=True)
            os.makedirs(os.path.dirname(OUT), exist_ok=True)
            json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            time.sleep(0.3)
        except Exception as e:
            print(f"  ! {key}: {str(e)[:80]}", file=sys.stderr)
    print(f"done: {len(data)} categories -> {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
