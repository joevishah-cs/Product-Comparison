-- Daikin Competitive Marketing Intelligence — normalized schema.
-- Every product attribute retains raw value, normalized value, unit, source
-- document, source location, verification status and import timestamp.

create extension if not exists "pgcrypto";

/* ---------------------------------------------------------------- */
/* Identity                                                          */
/* ---------------------------------------------------------------- */

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'Competitive Marketing',
  created_at timestamptz not null default now()
);

/* ---------------------------------------------------------------- */
/* Catalog                                                           */
/* ---------------------------------------------------------------- */

create table if not exists brands (
  id text primary key,
  name text not null,
  is_daikin boolean not null default false,
  -- true when the source column carried an explicit brand line
  from_source boolean not null default true
);

create table if not exists product_families (
  id text primary key,
  brand_id text references brands (id) on delete set null,
  name text not null,
  equipment_type text not null check (equipment_type in ('ducted_split_hp', 'air_to_water_hp'))
);

create table if not exists source_documents (
  id text primary key,
  title text not null,
  file_name text not null,
  kind text not null check (kind in ('spreadsheet', 'pdf')),
  scope text,
  imported_at timestamptz not null default now(),
  excluded_cells integer not null default 0
);

create table if not exists source_locations (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references source_documents (id) on delete cascade,
  page integer,
  sheet text,
  cell text,
  row_label text,
  column_label text,
  citation text not null,
  unique (document_id, page, sheet, cell, row_label, column_label)
);

create table if not exists products (
  id text primary key,
  brand_id text references brands (id) on delete set null,
  family_id text references product_families (id) on delete set null,
  model text not null,
  display_name text not null,
  source_header text not null,
  equipment_type text not null check (equipment_type in ('ducted_split_hp', 'air_to_water_hp')),
  is_daikin boolean not null default false,
  chassis text,
  -- true when the source row identifies a brand rather than a specific model
  model_is_brand_level boolean not null default false,
  tonnages numeric[] ,
  document_id text not null references source_documents (id) on delete cascade,
  imported_at timestamptz not null default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products (id) on delete cascade,
  url text not null,
  alt_text text not null,
  -- no manufacturer photography exists in the imported sources, so every image
  -- shipped with this application is a labelled representative illustration
  is_representative boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists attribute_definitions (
  key text primary key,
  label text not null,
  source_label text not null,
  attribute_group text not null,
  unit text,
  direction text not null check (direction in ('higher', 'lower', 'none', 'range')),
  kind text not null,
  plain_language text,
  source_comment text,
  document_id text references source_documents (id) on delete set null,
  equipment_type text not null check (equipment_type in ('ducted_split_hp', 'air_to_water_hp'))
);

create table if not exists product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products (id) on delete cascade,
  attribute_key text not null references attribute_definitions (key) on delete cascade,
  raw_value text,                      -- verbatim source text; null when the cell was blank
  normalized_numeric numeric,
  normalized_numeric_secondary numeric,
  normalized_boolean boolean,
  normalized_text text,
  unit text,
  verification_status text not null
    check (verification_status in ('verified', 'unavailable', 'formula_error')),
  source_location_id uuid references source_locations (id) on delete set null,
  -- the source document's own colour mark; presentation evidence only
  source_assessment text
    check (source_assessment in ('daikin_better', 'competitor_better',
                                 'not_available_marker', 'equal_or_no_difference')),
  imported_at timestamptz not null default now(),
  unique (product_id, attribute_key)
);

create index if not exists idx_pav_product on product_attribute_values (product_id);
create index if not exists idx_pav_attribute on product_attribute_values (attribute_key);
create index if not exists idx_pav_status on product_attribute_values (verification_status);

/* ---------------------------------------------------------------- */
/* Workspace records                                                 */
/* ---------------------------------------------------------------- */

create table if not exists saved_comparisons (
  id text primary key,
  owner_email text not null,
  name text not null,
  scenario text not null default '',
  audience text not null default 'Dealer',
  product_ids text[] not null,
  unit_selections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_comparison_products (
  id uuid primary key default gen_random_uuid(),
  comparison_id text not null references saved_comparisons (id) on delete cascade,
  product_id text not null references products (id) on delete cascade,
  selected_tonnage numeric,
  sort_order integer not null default 0,
  unique (comparison_id, product_id)
);

create table if not exists review_signals (
  id text primary key,
  owner_email text not null,
  product_id text not null,
  sentiment text not null check (sentiment in ('positive', 'mixed', 'concern')),
  excerpt text not null,
  context text not null default '',
  reviewer_type text not null,
  source text not null,
  occurred_on date not null,
  verification_status text not null
    check (verification_status in ('approved_excerpt', 'field_note', 'pending_review')),
  themes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists analyst_notes (
  id text primary key,
  owner_email text not null,
  track text not null,
  question text not null,
  owner_name text not null,
  status text not null check (status in ('open', 'in_progress', 'evidence_pending', 'closed')),
  due_date date,
  connected_report text not null default '',
  evidence_status text not null
    check (evidence_status in ('external_source_required', 'internal_evidence', 'source_linked')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists media_clips (
  id text primary key,
  owner_email text not null,
  headline text not null,
  publication text not null,
  author text not null default '',
  published_on date not null,
  product_id text not null,
  sentiment text not null check (sentiment in ('positive', 'mixed', 'concern')),
  topic text not null,
  url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists generated_briefs (
  id text primary key,
  owner_email text not null,
  title text not null,
  format text not null,
  audience text not null,
  product_ids text[] not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists chat_sessions (
  id text primary key,
  owner_email text not null,
  product_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id text primary key,
  session_id text not null,
  owner_email text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists citations (
  id uuid primary key default gen_random_uuid(),
  -- the record this citation supports
  subject_type text not null check (subject_type in ('brief', 'chat_message', 'review_signal', 'media_clip')),
  subject_id text not null,
  source_location_id uuid references source_locations (id) on delete set null,
  citation_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_owner on saved_comparisons (owner_email, created_at desc);
create index if not exists idx_reviews_owner on review_signals (owner_email, created_at desc);
create index if not exists idx_analyst_owner on analyst_notes (owner_email, created_at desc);
create index if not exists idx_media_owner on media_clips (owner_email, created_at desc);
create index if not exists idx_briefs_owner on generated_briefs (owner_email, created_at desc);
create index if not exists idx_chat_owner on chat_messages (owner_email, created_at desc);

/* ---------------------------------------------------------------- */
/* Row level security                                               */
/* ---------------------------------------------------------------- */

alter table profiles enable row level security;
alter table saved_comparisons enable row level security;
alter table saved_comparison_products enable row level security;
alter table review_signals enable row level security;
alter table analyst_notes enable row level security;
alter table media_clips enable row level security;
alter table generated_briefs enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table citations enable row level security;

-- Catalog tables are readable by any signed-in user and written only by the
-- import job running with the service role.
alter table brands enable row level security;
alter table product_families enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table attribute_definitions enable row level security;
alter table product_attribute_values enable row level security;
alter table source_documents enable row level security;
alter table source_locations enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'brands', 'product_families', 'products', 'product_images',
    'attribute_definitions', 'product_attribute_values',
    'source_documents', 'source_locations'
  ]
  loop
    execute format(
      'create policy %I on %I for select to authenticated using (true)',
      t || '_read', t
    );
  end loop;

  foreach t in array array[
    'saved_comparisons', 'review_signals', 'analyst_notes',
    'media_clips', 'generated_briefs', 'chat_sessions', 'chat_messages'
  ]
  loop
    execute format(
      'create policy %I on %I for all to authenticated using (owner_email = auth.jwt() ->> ''email'') with check (owner_email = auth.jwt() ->> ''email'')',
      t || '_owner', t
    );
  end loop;
end $$;

create policy profiles_self on profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy saved_comparison_products_owner on saved_comparison_products
  for all to authenticated
  using (
    exists (
      select 1 from saved_comparisons c
      where c.id = comparison_id and c.owner_email = auth.jwt() ->> 'email'
    )
  )
  with check (
    exists (
      select 1 from saved_comparisons c
      where c.id = comparison_id and c.owner_email = auth.jwt() ->> 'email'
    )
  );

create policy citations_read on citations for select to authenticated using (true);
