# Data Dictionary

| Canonical attribute | Unit / representation | Comparison treatment | Primary source mapping |
|---|---|---|---|
| SEER2 | numeric, qualifier retained | higher generally better | FIT Battlecard / SEER2 |
| EER2 | numeric, qualifier retained | higher generally better | FIT Battlecard / EER2 |
| HSPF2 | numeric, qualifier retained | higher generally better | FIT Battlecard / HSPF2 |
| COP@5F | numeric | higher generally better | FIT Battlecard / COP@5F |
| Sound level | dBA string, approximate retained | lower generally better | FIT Battlecard / Sound Performance |
| Heating operating range | °F range | wider is contextual | FIT Battlecard / Heating Operating Range |
| Refrigerant | enumerated string | no automatic winner | FIT Battlecard / Refrigerant |
| Warranty | qualitative structured-text candidate | manual rule | FIT Battlecard / Warranty |
| Maximum heating capacity | BTU/h | higher contextually | Comparison workbook / C17:C22 |
| Lowest ambient | °F | lower extends operating envelope | Comparison workbook / F7:F12 |

Blank cells mean `Information unavailable`, never `No`. Workbook formula errors are excluded from normalized facts.
