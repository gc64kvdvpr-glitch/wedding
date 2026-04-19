-- Create guestbook table
CREATE TABLE public.guestbook (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  password text not null,
  message text not null,
  is_secret boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.guestbook ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access"
  ON public.guestbook FOR SELECT
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access"
  ON public.guestbook FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for the guestbook table
ALTER PUBLICATION supabase_realtime ADD TABLE public.guestbook;
