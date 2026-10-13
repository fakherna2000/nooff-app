-- تفعيل Realtime على جدول المواعيد لتلقي إشعارات فورية عند وصول طلبات جديدة
alter publication supabase_realtime add table public.appointments;
