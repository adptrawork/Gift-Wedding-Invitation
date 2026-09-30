-- Seed template registry (Description: jalankan setelah migrasi init).
-- UUID sesuai templates/*/template.json agar konsisten dengan TemplateRenderer.
-- Ganti created_by dengan id admin setelah user admin dibuat.

insert into public.templates (id, slug, name, description, category, thumbnail_url, preview_url, status, current_version)
values
  ('00000000-0000-0000-0000-000000000001', 'luxury-gold', 'Luxury Gold', 'Undangan wedding mewah nuansa emas', 'wedding', '/templates/luxury-gold/thumbnail.jpg', '/templates/luxury-gold/preview.jpg', 'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000002', 'romantic-garden', 'Romantic Garden', 'Undangan wedding romantis nuansa taman bunga', 'wedding', '/templates/romantic-garden/thumbnail.jpg', '/templates/romantic-garden/preview.jpg', 'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000003', 'modern-minimal', 'Modern Minimal', 'Undangan wedding modern minimalis', 'wedding', '/templates/modern-minimal/thumbnail.jpg', '/templates/modern-minimal/preview.jpg', 'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000004', 'wedding-gift', 'Wedding Gift', 'Kado digital untuk pengantin', 'gift', '/templates/wedding-gift/thumbnail.jpg', '/templates/wedding-gift/preview.jpg', 'published', '1.0.0'),
  ('00000000-0000-0000-0000-000000000005', 'birthday-gift', 'Birthday Gift', 'Kado digital ulang tahun', 'gift', '/templates/birthday-gift/thumbnail.jpg', '/templates/birthday-gift/preview.jpg', 'published', '1.0.0')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  current_version = excluded.current_version,
  updated_at = now();
