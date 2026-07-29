/** Homeowner-friendly explanations for HVAC terms. Descriptions of what a metric
 *  means -- never a claim about any specific product. */
export const PLAIN_LANGUAGE: Record<string, string> = {
  initial_cost:
    "Relative price band recorded in the source, shown as dollar signs. More signs means the source placed the unit in a higher price band.",
  tonnage_options:
    "The unit sizes a model is sold in. One ton is roughly the cooling a typical 400-600 sq ft of home needs. More sizes means an installer can match your home more precisely.",
  chassis_type:
    "The shape of the outdoor unit. 'SD' is side-discharge -- a slim box that blows air sideways, so it fits tight side yards. 'Cube' blows air out of the top and needs clearance above.",
  footprint:
    "How much space the outdoor unit takes up, in inches: depth x width x height. Smaller matters when the unit has to fit down a narrow side yard.",
  air_handler_matchup:
    "The household electrical supply the matching indoor air handler can run on. A 115V option means it can plug into a standard household circuit instead of requiring a dedicated 240V circuit.",
  refrigerant:
    "The fluid that carries heat in and out of your home. Different refrigerants have different pressures, service procedures and global-warming potential.",
  compressor_type:
    "The pump at the heart of the system. Variable-speed (VS) compressors ramp up and down instead of switching fully on and off, which keeps temperature steadier and uses less electricity.",
  sound_blanket:
    "An insulating jacket wrapped around the compressor to muffle the sound it makes.",
  sound_level:
    "How loud the outdoor unit is, in decibels (dBA). Lower is quieter. A 10 dBA drop sounds roughly half as loud. 45 dBA is close to a quiet library; 60 dBA is close to normal conversation.",
  coil_only_matchup:
    "Whether the outdoor unit can be paired with just an indoor coil -- useful when you are keeping an existing furnace.",
  straight_cool:
    "Whether a cooling-only version is offered, for homes that heat some other way.",
  thermostat_type:
    "The kind of thermostat the system is designed around. A communicating thermostat exchanges detailed data with the equipment instead of just switching it on and off.",
  thermostat_24v:
    "Whether the system can run on a conventional 24-volt thermostat, which most existing homes already have wired.",
  regional_profiles:
    "Preconfigured setup profiles that tune airflow and humidity behaviour for a region's climate, so the installer does not have to dial it in by hand.",
  reusable_profiles:
    "Whether an installer can save a full set of system settings as a file and push it to the next install with one button.",
  charge_verification:
    "Whether a technician can confirm the refrigerant charge is correct without hooking up gauges. Correct charge is one of the biggest drivers of real-world efficiency.",
  slow_loss_alerting:
    "Whether the system notices a slow refrigerant leak and warns the contractor before you lose comfort or damage the compressor.",
  cloud_alerts:
    "Whether the system reports faults and diagnostics to the contractor over the internet in real time, so problems can be triaged before a truck rolls.",
  humidity_control:
    "True dehumidification -- running the compressor hard while keeping the indoor fan slow, so the coil pulls moisture out of the air instead of just cooling it.",
  base_pan_heater:
    "A heater in the base of the outdoor unit that keeps melted frost from re-freezing during winter operation.",
  heater_kit_3stage:
    "An optional electric backup heater with three output steps, so the system only uses as much backup heat as it needs.",
  intelligent_defrost:
    "Whether the system can keep delivering heat while it clears frost off the outdoor coil, instead of blowing cool air during the defrost cycle.",
  anticorrosive:
    "A protective coating on the outdoor coil that resists corrosion -- important near the coast or in industrial air.",
  energy_star: "Whether the model carries the U.S. EPA ENERGY STAR efficiency certification.",
  energy_star_cchp:
    "The ENERGY STAR cold-climate heat pump designation, awarded to models that hold up their heating output in genuinely cold weather.",
  cee_2025:
    "Whether the model meets the Consortium for Energy Efficiency's 2025 efficiency tier, which many utility rebates are tied to.",
  seer2:
    "Seasonal cooling efficiency. Higher is better -- it is roughly cooling delivered divided by electricity used across a season. Every point up is lower summer bills.",
  eer2:
    "Cooling efficiency measured at one hot design condition rather than across a season. Higher is better. It tells you how the system behaves on the hottest days.",
  hspf2:
    "Seasonal heating efficiency. Higher is better -- heating delivered divided by electricity used across a heating season.",
  cop_5f:
    "Coefficient of performance at 5°F outdoors. A COP of 2.0 means the system moves two units of heat for every one unit of electricity, even in cold weather. Higher is better.",
  cap_5f:
    "How much heat the unit can still deliver when it is 5°F outside, in BTU per hour. Higher means less reliance on expensive backup electric heat.",
  cap_47f:
    "Heating output at 47°F outdoors, the standard mild-weather rating point. Higher is more heat.",
  cap_95f:
    "Cooling output at 95°F outdoors, the standard hot-weather rating point. Higher is more cooling.",
  cap_115f:
    "Cooling output at 115°F outdoors -- extreme heat. Higher means the system holds up in a heat wave.",
  cooling_range:
    "The outdoor temperature band the manufacturer allows the unit to run in cooling mode.",
  heating_range:
    "The outdoor temperature band the manufacturer allows the unit to run in heating mode. A lower minimum means it keeps heating in colder weather.",
  line_length:
    "The maximum distance of refrigerant piping allowed between the outdoor and indoor units. Longer gives the installer more freedom in where the outdoor unit goes.",
  pre_charge:
    "How much line length comes already charged with refrigerant from the factory, before the installer has to add more.",
  elevation:
    "The maximum permitted height difference between the indoor and outdoor units.",
  warranty:
    "How long the manufacturer covers parts, and what happens if a major component fails. A replacement warranty means the unit is replaced rather than repaired.",

  /* Air-to-water attributes */
  max_lwt:
    "The hottest water the heat pump can send out to your radiators or floor loops, in °F. Higher means it can drive older high-temperature radiators.",
  min_lwt:
    "The water temperature the unit can still produce when it is at its coldest permitted outdoor condition.",
  delta_lwt:
    "The ratio of minimum to maximum leaving water temperature -- how much of its output temperature the unit holds onto in the cold. Closer to 1.0 means it holds up better.",
  lowest_ambient_lwt:
    "The coldest outdoor temperature at which the unit is rated to keep producing hot water. Lower is better in a cold climate.",
  emitter_high_temp:
    "The water temperature available for high-temperature emitters -- traditional baseboard and cast-iron radiators, which need hot water to work.",
  emitter_medium_temp:
    "The water temperature available for medium-temperature emitters such as heat-pump convectors, fan coils and air handlers.",
  emitter_low_temp:
    "The water temperature available for low-temperature emitters, mainly radiant floor loops.",
  cold_climate_op: "The coldest outdoor temperature the source records for cold-climate operation.",
  max_heat_cap_131:
    "Peak heating output measured while producing 131°F water, in BTU per hour. Higher is more heat.",
  min_heat_cap:
    "Heating output remaining at the coldest permitted outdoor temperature. Higher means less backup heat needed.",
  delta_heat_cap:
    "The gap between peak heating output and cold-weather output. A smaller gap means output falls off less as it gets cold.",
  lowest_ambient_heat:
    "The coldest outdoor temperature at which the unit is rated to deliver heat. Lower is better in a cold climate.",
  single_fan: "Whether the unit uses a single fan.",
  no_glycol:
    "Whether the system can run without glycol antifreeze in the water loop. Glycol costs money, reduces heat transfer and needs periodic service.",
  warranty_hydronic: "The warranty term recorded for this air-to-water unit.",
  boiler_replacement:
    "The water temperature recorded against boiler-replacement suitability -- how well the unit can stand in for an existing boiler.",
  max_cool_cap: "Peak cooling output, in BTU per hour.",
  min_cool_cap: "Cooling output remaining at the hottest permitted outdoor temperature.",
  delta_cool_cap: "The gap between peak and hot-weather cooling output.",
  highest_ambient: "The hottest outdoor temperature the unit is rated to operate in.",
  oem_heat_pump: "Whether the heat pump is the manufacturer's own equipment.",
  hydro_split:
    "A hydro-split design keeps the water side outdoors, so no refrigerant piping has to be run into the house.",
  low_gwp:
    "Whether the refrigerant has a low global warming potential -- how much it would contribute to warming if released.",
  sound_level_hy: "How loud the unit is, in decibels. Lower is quieter.",
  total_amps: "The total electrical current draw, which sets the size of the breaker required.",
  cop_a5w110:
    "Coefficient of performance at 5°F outdoor air producing 110°F water. Higher means more heat delivered per unit of electricity in cold weather.",
};
