"""Generate public/data/reviews.json from the supplied customer-review export.

Run with:  pip install openpyxl && python source-documents/generate-review-records.py

Rules enforced here:
  * review text and titles are copied verbatim -- never rewritten, merged or summarized
  * only fields present in the source are emitted; absent fields (sub-ratings,
    verified-purchase, source platform, helpful votes) are simply not invented
  * every review keeps its source row so it can be cited
  * theme and feedback-subject detection is deterministic keyword matching, and is
    recorded as detection metadata rather than presented as a source fact
"""
import collections
import json
import os
import re

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
XLSX = os.path.join(HERE, "DaikinFitReviews.xlsx")
OUT = os.path.join(HERE, "..", "public", "data", "reviews.json")

SHEET = "Review Data"
SOURCE_PLATFORM_KNOWN = False  # the export carries no platform column

# ---------------------------------------------------------------- themes
# Each theme is (key, label, regex). Matching is on the lowercased title + text.
THEMES = [
    ("quietness", "Quiet operation",
     r"\b(quiet|quietly|quieter|quietest|silent|silence|noise|noisy|loud|louder|loudest|hear it|whisper|db|decibel)\w*"),
    ("comfort", "Consistent comfort",
     r"\b(comfort\w*|even temperature|consistent temp\w*|constant temp\w*|no highs and lows|cozy|cool(s|ing)? (evenly|well)|warm(th)?|keeps? the (house|home)|temperature (stable|consistent|even))"),
    ("humidity", "Humidity comfort",
     r"\b(humid\w*|dehumid\w*|moisture|muggy|clammy|dry(ness)?|rh\b)"),
    ("efficiency", "Energy efficiency",
     r"\b(efficien\w*|energy|electric(ity)? bill|power bill|utility bill|kwh|seer|savings?|saves? (me|us)?|economical)"),
    ("reliability", "Reliability",
     r"\b(reliab\w*|dependab\w*|breakdown|broke(n)?|failure|failed|fault|error code|shut ?down|stopped working|trouble ?free|no issues|works? (great|well|perfectly))"),
    ("controls", "Easy controls",
     r"\b(thermostat|app\b|one\+?|oneplus|smart (home|control)|wifi|wi-fi|alexa|google|nest|schedul\w*|interface|screen|control(s|ler)?|remote)"),
    ("heating", "Heating performance",
     r"\b(heat(ing|s|er|ed)?\b|heat pump (heat|struggl)|cold (weather|outside|days?)|winter|freez\w*|defrost|aux(iliary)? heat|emergency heat|below freezing)"),
    ("installation", "Installation experience",
     r"\b(install\w*|crew|technician|tech\b|installer|setup|set up|commission\w*|ductwork|duct(s)?\b|wiring|start ?up)"),
    ("dealer", "Dealer or contractor",
     r"\b(dealer|contractor|company|salesman|sales ?person|sales ?rep|quote|estimate|price|cost|expensive|value|worth (it|every)|professional\w*|courteous|on time)"),
    ("service", "Service and support",
     r"\b(service|warrant\w*|repair\w*|maintenance|support|call(ed|s)? (them|back)|came (back|out)|replace(d|ment)?|part(s)? (order|arriv)|customer service)"),
    ("size", "Size and placement",
     r"\b(footprint|compact|small(er)?|size of the unit|space|fits?|slim|side of the house|tight)"),
    ("build", "Build quality",
     r"\b(build quality|well made|sturdy|solid|flimsy|cheap(ly)? made|coil|fin(s)?\b|cabinet|paint|rust|corro\w*)"),
]

# Which subject a piece of feedback is about. Order matters: the first match wins
# for the primary subject, but all matches are recorded.
SUBJECTS = [
    ("installation", "Installation",
     r"\b(install\w*|installer|crew|ductwork|wiring|setup|set up|commission\w*|start ?up)"),
    ("dealer", "Dealer or contractor",
     r"\b(dealer|contractor|salesman|sales ?person|sales ?rep|company|quote|estimate|told (me|us)|promised)"),
    ("service", "Service and support",
     r"\b(service call|customer service|repair\w*|came (back|out)|technician|warrant\w*|support|maintenance)"),
    ("delivery", "Delivery or availability",
     r"\b(deliver\w*|back ?order\w*|availab\w*|lead time|waiting for the (unit|part)|shipment)"),
    ("equipment", "Equipment",
     r"\b(unit|system|compressor|coil|fan|thermostat|heat pump|air handler|condenser|equipment)"),
]

POSITIVE_HINTS = re.compile(
    r"\b(love|great|excellent|amazing|awesome|perfect|impressed|happy|pleased|quiet|efficient|"
    r"comfortable|recommend|best|fantastic|wonderful|outstanding|superb|worth)", re.I)
NEGATIVE_HINTS = re.compile(
    r"\b(disappoint\w*|not happy|unhappy|problem|issue|fail\w*|broke\w*|poor|bad|worst|"
    r"loud|noisy|never|refus\w*|useless|frustrat\w*|regret|complain\w*|struggl\w*|"
    r"can ?not|can't|doesn'?t work|won'?t|lack\w*|oversold)", re.I)


def sentiment_for(rating):
    """Sentiment is derived from the star rating the reviewer actually gave --
    the one signal the source records unambiguously."""
    if rating is None:
        return "unrated"
    if rating >= 4:
        return "positive"
    if rating == 3:
        return "neutral"
    return "negative"


def detect(patterns, haystack):
    hits = []
    for key, label, pattern in patterns:
        if re.search(pattern, haystack, re.I):
            hits.append(key)
    return hits


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True, read_only=True)
    ws = wb[SHEET]

    rows = []
    for excel_row, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if row[0] is None:
            continue
        review_id, submitted, rating, title, text, product_id, product_name, brand, category = row[:9]

        title = "" if title is None else str(title).strip()
        text = "" if text is None else str(text).strip()
        haystack = f"{title}\n{text}"

        try:
            rating = int(rating) if rating is not None else None
        except (TypeError, ValueError):
            rating = None

        date = str(submitted)[:10] if submitted else None

        themes = detect(THEMES, haystack)
        subjects = detect(SUBJECTS, haystack)

        sentiment = sentiment_for(rating)
        pos_hit = bool(POSITIVE_HINTS.search(haystack))
        neg_hit = bool(NEGATIVE_HINTS.search(haystack))

        rows.append({
            "id": str(review_id),
            "date": date,
            "rating": rating,
            "title": title,
            "text": text,
            "productId": str(product_id).strip() if product_id else "",
            "productName": str(product_name).strip() if product_name else "",
            "brand": str(brand).strip() if brand else "",
            "category": str(category).strip() if category else None,
            "sentiment": sentiment,
            "themes": themes,
            "subjects": subjects,
            "hasPositiveLanguage": pos_hit,
            "hasCriticalLanguage": neg_hit,
            "sourceRow": excel_row,
        })

    rows.sort(key=lambda r: (r["date"] or ""), reverse=True)

    products = collections.Counter((r["productId"], r["productName"], r["brand"]) for r in rows)
    catalogue = [
        {"productId": pid, "productName": name, "brand": brand, "reviewCount": count}
        for (pid, name, brand), count in sorted(products.items(), key=lambda x: -x[1])
    ]

    theme_defs = [{"key": k, "label": label} for k, label, _ in THEMES]
    subject_defs = [{"key": k, "label": label} for k, label, _ in SUBJECTS]

    available_fields = ["reviewId", "date", "rating", "title", "text", "productId",
                        "productName", "brand", "category"]
    absent_fields = ["subRatings", "verifiedPurchase", "sourcePlatform", "helpfulVotes", "unitOrTonnage"]

    payload = {
        "sourceFile": "DaikinFitReviews.xlsx",
        "sourceSheet": SHEET,
        "importedAt": "2026-07-28T00:00:00.000Z",
        "totalReviews": len(rows),
        "dateRange": {
            "from": min(r["date"] for r in rows if r["date"]),
            "to": max(r["date"] for r in rows if r["date"]),
        },
        "availableFields": available_fields,
        "absentFields": absent_fields,
        "sourcePlatformRecorded": SOURCE_PLATFORM_KNOWN,
        "themeDefinitions": theme_defs,
        "subjectDefinitions": subject_defs,
        "reviewedProducts": catalogue,
        "reviews": rows,
    }

    payload["_note"] = (
        "AUTO-GENERATED from DaikinFitReviews.xlsx (sheet 'Review Data'). Review titles "
        "and text are copied verbatim and are never rewritten, merged or summarized. "
        "Fields the export does not contain are listed in absentFields and are never fabricated."
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    print("wrote", OUT)
    print("reviews:", len(rows))
    print("date range:", payload["dateRange"])
    print("products:", len(catalogue))
    for c in catalogue:
        print("  ", c["productId"], c["reviewCount"])
    dist = collections.Counter(r["rating"] for r in rows)
    print("rating distribution:", sorted(dist.items(), key=lambda x: (x[0] is None, x[0])))
    sent = collections.Counter(r["sentiment"] for r in rows)
    print("sentiment:", sent.most_common())
    th = collections.Counter(t for r in rows for t in r["themes"])
    print("theme hits:", th.most_common())
    sub = collections.Counter(s for r in rows for s in r["subjects"])
    print("subject hits:", sub.most_common())


if __name__ == "__main__":
    main()
