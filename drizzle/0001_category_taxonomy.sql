UPDATE items
SET category = '灵感收集'
WHERE category IN ('创作参考', '生活灵感', '想买清单');
--> statement-breakpoint
UPDATE items
SET category = 'AI 学习'
WHERE category = 'AI 与工具';
--> statement-breakpoint
UPDATE items
SET category = '文字创作'
WHERE category = '营销增长';
