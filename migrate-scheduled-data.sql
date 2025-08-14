-- Migrate Data from scheduled_time to scheduled_for (if needed)
-- Only run this AFTER running the safe-fix-scheduling.sql script
-- This script will copy data from scheduled_time to scheduled_for

-- 1. Check if we need to migrate data
SELECT 'Checking if migration is needed:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'scheduled_time'
        ) AND EXISTS (
            SELECT 1 FROM posts WHERE scheduled_time IS NOT NULL
        ) THEN 'Migration needed - scheduled_time has data'
        ELSE 'No migration needed'
    END as migration_needed;

-- 2. Show what data would be migrated
SELECT 'Data that would be migrated:' as info;
SELECT 
    id,
    scheduled_time,
    status,
    caption
FROM posts 
WHERE scheduled_time IS NOT NULL
ORDER BY scheduled_time;

-- 3. Perform the migration (only if scheduled_time has data)
-- This copies data from scheduled_time to scheduled_for
UPDATE posts 
SET scheduled_for = scheduled_time 
WHERE scheduled_time IS NOT NULL 
AND scheduled_for IS NULL;

-- 4. Verify the migration
SELECT 'Verification after migration:' as info;
SELECT 
    COUNT(*) as total_posts_with_scheduled_time,
    COUNT(CASE WHEN scheduled_for IS NOT NULL THEN 1 END) as posts_with_scheduled_for
FROM posts 
WHERE scheduled_time IS NOT NULL;

-- 5. Now it's safe to remove the scheduled_time column (optional)
-- Uncomment the line below ONLY if you're sure you want to remove scheduled_time
-- ALTER TABLE posts DROP COLUMN IF EXISTS scheduled_time;

-- 6. Final check
SELECT 'Final column status:' as info;
SELECT 
    column_name,
    CASE 
        WHEN column_name = 'scheduled_for' THEN '✅ This is the correct column'
        WHEN column_name = 'scheduled_time' THEN '⚠️ This column can be removed if migration was successful'
        ELSE 'Other column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('scheduled_for', 'scheduled_time')
ORDER BY column_name; 