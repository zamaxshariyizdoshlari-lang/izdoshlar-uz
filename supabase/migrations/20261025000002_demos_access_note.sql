-- Demo ochilganda koʻrsatiladigan kirish maʼlumoti (faqat demo hisob: login/parol)
alter table public.demos add column if not exists access_note text not null default '' check (char_length(access_note) <= 500);
