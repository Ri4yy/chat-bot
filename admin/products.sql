-- Создание таблицы products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    url TEXT,
    image_url TEXT,
    category TEXT,
    in_stock BOOLEAN DEFAULT true,
    fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('russian', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Индекс для быстрого поиска по project_id
CREATE INDEX IF NOT EXISTS products_project_id_idx ON public.products(project_id);

-- GIN индекс для полнотекстового поиска
CREATE INDEX IF NOT EXISTS products_fts_idx ON public.products USING GIN (fts);

-- Политики безопасности (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть товары только своих проектов
CREATE POLICY "Users can view products of their projects" 
ON public.products 
FOR SELECT 
USING (
    project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
);

-- Политика: пользователи могут изменять товары своих проектов
CREATE POLICY "Users can manage products of their projects" 
ON public.products 
FOR ALL 
USING (
    project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
);
