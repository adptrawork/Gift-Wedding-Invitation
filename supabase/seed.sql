-- Seed registry template. Jalankan SETELAH seluruh migrations.
--
-- Dua hal penting di sini:
--  1. UUID templates dikunci ke id yang sama dengan templates/<slug>/template.json
--     supaya manifest Git dan baris DB selalu sinkron.
--  2. template_versions ikut diisi. Tanpa ini template_version_id selalu null
--     dan jaminan "update template tidak merusak customer lama" tidak berlaku.

insert into public.templates (id, slug, name, description, category, thumbnail_url, preview_url, status, current_version)
values
  ('00000000-0000-0000-0000-000000000001', 'luxury-gold',    'Luxury Gold',    'Undangan wedding mewah nuansa emas',        'wedding', '/templates/luxury-gold/thumbnail.jpg',    '/templates/luxury-gold/preview.jpg',    'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000002', 'romantic-garden', 'Romantic Garden', 'Undangan wedding romantis nuansa taman bunga', 'wedding', '/templates/romantic-garden/thumbnail.jpg', '/templates/romantic-garden/preview.jpg', 'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000003', 'modern-minimal',  'Modern Minimal',  'Undangan wedding modern minimalis',           'wedding', '/templates/modern-minimal/thumbnail.jpg',  '/templates/modern-minimal/preview.jpg',  'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000004', 'wedding-gift',    'Wedding Gift',    'Kado digital untuk pengantin',                 'gift',    '/templates/wedding-gift/thumbnail.jpg',    '/templates/wedding-gift/preview.jpg',    'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000005', 'birthday-gift',   'Birthday Gift',   'Kado digital ulang tahun',                     'gift',    '/templates/birthday-gift/thumbnail.jpg',   '/templates/birthday-gift/preview.jpg',   'published', '1.0.0')
on conflict (slug) do update set
  name            = excluded.name,
  description     = excluded.description,
  category        = excluded.category,
  thumbnail_url   = excluded.thumbnail_url,
  preview_url     = excluded.preview_url,
  status          = excluded.status,
  current_version = excluded.current_version,
  updated_at      = now();

-- Version 1.0.0 untuk setiap template. manifest/schema diambil dari Git saat
-- build, jadi di sini cukup metadata minimum yang dibutuhkan renderer.
insert into public.template_versions (template_id, version, manifest, schema, status)
select t.id,
       '1.0.0',
       jsonb_build_object(
         'id', t.slug,
         'name', t.name,
         'slug', t.slug,
         'version', '1.0.0',
         'description', t.description,
         'category', t.category,
         'status', t.status
       ),
       '{}'::jsonb,
       'published'
  from public.templates t
 where t.current_version = '1.0.0'
on conflict (template_id, version) do update set
  status = excluded.status;
