-- Demo toifalari: sayt, ilova, bot, ai, erp, boshqa. Namuna loyihalar olib tashlandi.
alter table public.demos drop constraint if exists demos_category_check;
update public.demos set category = 'boshqa' where category = 'kontent';
alter table public.demos add constraint demos_category_check check (category in ('sayt', 'ilova', 'bot', 'ai', 'erp', 'boshqa'));
delete from public.projects where placeholder = true;
