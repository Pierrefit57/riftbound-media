-- Insert the initial Errata document
INSERT INTO public.articles (title, summary, content, tags, published, image_url, sort_order)
VALUES (
  'Errata Spiritforged',
  'Document officiel des erratas et de la FAQ pour l''édition Spiritforged.',
  'https://otbccpoavhfvjpqpzemz.supabase.co/storage/v1/object/public/PDFrules/UPDATED%20Riftbound%20Erratas%20Spiritforged.pdf',
  ARRAY['Errata', 'Règles'],
  true,
  '',
  0
);
