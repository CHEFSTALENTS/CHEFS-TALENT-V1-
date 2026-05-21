-- Ajoute la colonne source_article_id à articles pour lier une traduction
-- à son article source. Utilisé par PR6 (bouton « Traduire EN »).
--
-- Pattern : un article FR (locale='fr') peut avoir plusieurs traductions
-- (EN, ES) qui pointent vers lui via source_article_id. Quand on dépublie
-- ou modifie l'article source, on peut décider de propager (futur).

alter table public.articles
  add column if not exists source_article_id uuid references public.articles(id) on delete set null;

create index if not exists idx_articles_source_article_id
  on public.articles (source_article_id)
  where source_article_id is not null;

comment on column public.articles.source_article_id is
  'Article source pour les traductions (locale != ''fr''). NULL pour les articles originaux.';
