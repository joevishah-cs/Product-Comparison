/**
 * Curated coverage sourced from the public web on 2026-07-28.
 *
 * Every item is a real, verifiable article or report with its original URL.
 * Nothing here is invented; where an exact publication day is not stated by the
 * source, the date is the first of the known month and the note says so.
 * Summaries are our own internal characterisation, not quotations.
 */

export const COVERAGE_RETRIEVED_ON = "2026-07-28";

export interface SourcedClip {
  headline: string;
  publication: string;
  author: string;
  published_on: string;
  productId: string;
  sentiment: "positive" | "mixed" | "concern";
  topic: string;
  url: string;
  notes: string;
}

export const SOURCED_CLIPS: SourcedClip[] = [
  {
    headline: "Daikin Launches New Daikin Fit Systems",
    publication: "ACHR News",
    author: "",
    published_on: "2018-09-28",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Sound & comfort",
    url: "https://www.achrnews.com/articles/139811-daikin-launches-new-daikin-fit-systems",
    notes:
      "Trade-press launch coverage of the FIT platform: side-discharge inverter positioning, compact cabinet, quiet operation. Useful historical anchor for the family's market narrative. Retrieved 2026-07-28.",
  },
  {
    headline: "Daikin Introduces a New HVAC Product That 'Fits' Today's Industry Needs",
    publication: "ACHR News",
    author: "",
    published_on: "2018-10-15",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Installation quality",
    url: "https://www.achrnews.com/articles/139881-daikin-introduces-a-new-hvac-product-that-fits-todays-industry-needs",
    notes:
      "Follow-up launch piece framing FIT around retrofit constraints — space, budget, duct compatibility. Aligns with the 115V air-handler and footprint edges in the battlecard. Retrieved 2026-07-28.",
  },
  {
    headline: "Daikin Donates Heat Pumps To Houston Home Repair Program",
    publication: "ACHR News",
    author: "",
    published_on: "2024-08-01",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Efficiency & rebates",
    url: "https://www.achrnews.com/articles/155113-daikin-donates-heat-pumps-to-houston-home-repair-program",
    notes:
      "Up to 30 Daikin Fit inverter heat pumps for low/moderate-income Houston households via the city's home-repair program. Community-goodwill coverage. Publication month approximate; retrieved 2026-07-28.",
  },
  {
    headline: "Carrier Passes Cold-Climate Heat Pump Challenge",
    publication: "ACHR News",
    author: "",
    published_on: "2024-09-01",
    productId: "bc_infinity-27vna3",
    sentiment: "positive",
    topic: "Cold-climate performance",
    url: "https://www.achrnews.com/articles/155197-carrier-passes-cold-climate-heat-pump-challenge",
    notes:
      "Competitor coverage: Carrier completed the DOE Cold Climate Heat Pump Challenge; the Infinity Variable-Speed Ultimate CCHP is reported to operate to -23°F with 100% capacity at 0°F, up to 21.2 SEER2 / 10.5 HSPF2. Directly relevant to our cold-climate positioning. Publication month approximate; retrieved 2026-07-28.",
  },
  {
    headline: "R-454B Refrigerant Shortage 2025: Rising Desperation and Emerging Risks in the HVAC Industry",
    publication: "The Furnace Outlet (industry blog)",
    author: "",
    published_on: "2025-06-01",
    productId: "bc_5twv0-trane",
    sentiment: "concern",
    topic: "Refrigerant transition",
    url: "https://thefurnaceoutlet.com/blogs/news/r-454b-refrigerant-shortage-2025-rising-desperation-and-emerging-risks-in-the-hvac-industry",
    notes:
      "Documents the 2025 R-454B supply crisis: Honeywell's April 2025 42% surcharge, cylinder shortages, 4–8 week install delays. Relevant to every R-454B competitor in the comparison; Daikin FIT uses R-32. Blog source — corroborate with the EPA docket before external use. Publication month approximate; retrieved 2026-07-28.",
  },
  {
    headline: "Heat Pump, A/C Shipments See 20% Declines in 2025",
    publication: "ACHR News",
    author: "",
    published_on: "2025-11-01",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "mixed",
    topic: "Efficiency & rebates",
    url: "https://www.achrnews.com/articles/165859-heat-pump-a-c-shipments-see-20-declines-in-2025",
    notes:
      "Category-wide shipment softness in 2025 — context for demand planning rather than a product story. Publication month approximate; retrieved 2026-07-28.",
  },
  {
    headline: "Heat pump sales dipped in 2025. They still beat gas furnaces.",
    publication: "Canary Media",
    author: "",
    published_on: "2026-01-01",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Efficiency & rebates",
    url: "https://www.canarymedia.com/articles/heat-pumps/heating-cooling-sales-us-gas-furnaces",
    notes:
      "Heat pumps outsold gas furnaces for the fourth consecutive year (~3.6M vs ~3.2M units in 2025). Strong market-tailwind talking point. Publication month approximate; retrieved 2026-07-28.",
  },
  {
    headline: "AHRI Data Shows Heat Pumps Drove Growth in March 2026",
    publication: "ACHR News",
    author: "",
    published_on: "2026-03-01",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Efficiency & rebates",
    url: "https://www.achrnews.com/articles/166182-ahri-data-shows-heat-pumps-drove-growth-in-march-2026",
    notes:
      "Heat pumps as the growth segment in AHRI's March 2026 shipment data; monthly heat-pump shipments have begun eclipsing central AC. Month reflects the data period; retrieved 2026-07-28.",
  },
  {
    headline: "Heat pump shipments rise through April, with more use for both heating and cooling",
    publication: "Utility Dive",
    author: "",
    published_on: "2026-05-01",
    productId: "bc_dh6vs-fit-daikin",
    sentiment: "positive",
    topic: "Cold-climate performance",
    url: "https://www.utilitydive.com/news/heat-pump-shipments-rise-through-april-with-more-use-for-both-heating-and/823153/",
    notes:
      "Utility-sector view of the same shipment trend, framed around dual heating-and-cooling adoption. Publication month approximate; retrieved 2026-07-28.",
  },
];

export interface SourcedAnalystItem {
  track: string;
  question: string;
  owner_name: string;
  status: "open" | "in_progress" | "evidence_pending" | "closed";
  due_date: string;
  connected_report: string;
  evidence_status: "external_source_required" | "internal_evidence" | "source_linked";
  notes: string;
}

export const SOURCED_ANALYST_ITEMS: SourcedAnalystItem[] = [
  {
    track: "Cold-climate heat pump performance",
    question:
      "Carrier's DOE-challenge Infinity CCHP is publicly reported at -23°F operation, 100% capacity at 0°F and up to 21.2 SEER2 / 10.5 HSPF2. How do the FIT models' verified low-ambient figures position against the commercialized CCHP units, and where must we not lead?",
    owner_name: "Unassigned",
    status: "in_progress",
    due_date: "",
    connected_report:
      "ACHR News — Carrier Passes Cold-Climate Heat Pump Challenge (https://www.achrnews.com/articles/155197-carrier-passes-cold-climate-heat-pump-challenge)",
    evidence_status: "source_linked",
    notes:
      "Also see DOE Cold Climate Heat Pump Technology Challenge (energy.gov). Battlecard records DH-series heating range to -10°F; the CCHP class publicly claims lower. Retrieved 2026-07-28.",
  },
  {
    track: "Refrigerant transition",
    question:
      "The 2025 R-454B shortage (Honeywell's 42% April 2025 surcharge, cylinder scarcity, 4–8 week delays) affected every R-454B competitor in our set while FIT ships on R-32. What supply-availability message is defensible now, and has the gap closed in 2026?",
    owner_name: "Unassigned",
    status: "in_progress",
    due_date: "",
    connected_report:
      "EPA docket EPA-HQ-OAR-2025-0005 — Overview of R-454B Refrigerant Shortage (https://downloads.regulations.gov/EPA-HQ-OAR-2025-0005-0007/attachment_43.pdf)",
    evidence_status: "source_linked",
    notes:
      "Primary source is the EPA docket attachment; trade blogs corroborate. Availability claims must never imply refrigerant superiority — supply logistics only. Retrieved 2026-07-28.",
  },
  {
    track: "Efficiency regulation & rebates",
    question:
      "Heat pumps outsold gas furnaces for the fourth straight year (~3.6M vs ~3.2M in 2025) and monthly shipments began eclipsing central AC in late 2025. Which rebate and messaging programs best ride this shift for the FIT family in our regions?",
    owner_name: "Unassigned",
    status: "open",
    due_date: "",
    connected_report:
      "RMI — Tracking the Heat Pump & Water Heater Market in the United States (https://rmi.org/resources/tracking-the-heat-pump-water-heater-market-in-the-united-states/)",
    evidence_status: "source_linked",
    notes:
      "Corroborated by ACHR News AHRI shipment coverage and Canary Media's 2025 wrap-up. Retrieved 2026-07-28.",
  },
  {
    track: "Connected services & diagnostics",
    question:
      "AHRI's 2026 monthly shipment releases are the recurring public benchmark for category momentum. Establish a monthly review of the AHRI release so competitive materials always cite the current month.",
    owner_name: "Unassigned",
    status: "open",
    due_date: "",
    connected_report:
      "ACHR News — Heat Pumps Remain HVAC's Growth Story in Latest AHRI Shipment Data (https://www.achrnews.com/articles/166427-heat-pumps-remain-hvacs-growth-story-in-latest-ahri-shipment-data)",
    evidence_status: "source_linked",
    notes: "AHRI publishes the underlying data at ahrinet.org. Retrieved 2026-07-28.",
  },
];
