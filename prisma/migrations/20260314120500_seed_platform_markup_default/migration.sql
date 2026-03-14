INSERT INTO "platform_settings" ("key", "value", "updated_at", "updated_by")
SELECT
  'markup_percentage',
  '12',
  NOW(),
  admin_user."id"
FROM "users" AS admin_user
WHERE admin_user."role" = 'platform_admin'
  AND NOT EXISTS (
    SELECT 1
    FROM "platform_settings"
    WHERE "key" = 'markup_percentage'
  )
ORDER BY admin_user."created_at" ASC
LIMIT 1;
