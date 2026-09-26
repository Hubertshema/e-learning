import { query } from '../config/database.js';
import { cache } from '../config/cache.js';

/**
 * Real-time Lesson Builder & Media Synchronization Handlers with Caching
 */
export function registerLessonHandlers(io, socket) {
  // Join a lesson collaboration room
  socket.on('join_lesson_room', async ({ lessonId }) => {
    if (!lessonId) return;
    const room = `lesson:${lessonId}`;
    socket.join(room);

    console.log(`🔌 Socket ${socket.id} joined live lesson room: ${room}`);

    // Notify other room members
    socket.to(room).emit('editor_joined', {
      userId: socket.user?.id || 'guest',
      name: socket.user ? `${socket.user.firstName} ${socket.user.lastName}` : 'Collaborator',
      timestamp: new Date().toISOString(),
    });
  });

  // Leave lesson room
  socket.on('leave_lesson_room', ({ lessonId }) => {
    if (!lessonId) return;
    const room = `lesson:${lessonId}`;
    socket.leave(room);

    socket.to(room).emit('editor_left', {
      userId: socket.user?.id || 'guest',
      timestamp: new Date().toISOString(),
    });
  });

  // Real-time block update broadcasting (e.g. alignment, size, notes, media changes)
  socket.on('broadcast_lesson_update', ({ lessonId, blocks, settings, updatedBlockId }) => {
    if (!lessonId) return;
    const room = `lesson:${lessonId}`;

    // Update live cache if present
    const cacheKey = `lesson:${lessonId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      if (blocks) cached.blocks = blocks;
      if (settings?.title) cached.title = settings.title;
      cache.set(cacheKey, cached, 600);
    }

    socket.to(room).emit('lesson_live_updated', {
      lessonId,
      blocks,
      settings,
      updatedBlockId,
      editor: socket.user ? `${socket.user.firstName} ${socket.user.lastName}` : 'Teacher',
      timestamp: new Date().toISOString(),
    });
  });

  // Real-time Fetch Lesson from Database / Cache via Socket
  socket.on('fetch_live_lesson', async ({ lessonId }, callback) => {
    if (!lessonId) {
      if (typeof callback === 'function') callback({ error: 'Lesson ID required' });
      return;
    }

    const cacheKey = `lesson:${lessonId}`;

    // 1. Check Cache first
    const cachedLesson = cache.get(cacheKey);
    if (cachedLesson) {
      if (typeof callback === 'function') {
        callback({ success: true, lesson: cachedLesson, fromCache: true });
      } else {
        socket.emit('live_lesson_data', { success: true, lesson: cachedLesson, fromCache: true });
      }
      return;
    }

    // 2. Cache Miss: Fetch from PostgreSQL database
    try {
      const lessonRes = await query(
        `SELECT l.*, u."courseId" 
         FROM "public"."lessons" l
         JOIN "public"."units" u ON u.id = l."unitId"
         WHERE l.id = $1 LIMIT 1`,
        [lessonId]
      );

      if (lessonRes.rows.length === 0) {
        if (typeof callback === 'function') callback({ error: 'Lesson not found' });
        return;
      }

      const lesson = lessonRes.rows[0];

      // Fetch all sections
      const secRes = await query(
        `SELECT * FROM "public"."lesson_sections" WHERE "lessonId" = $1 ORDER BY "orderIndex" ASC`,
        [lessonId]
      );
      lesson.sections = secRes.rows;

      // Parse JSON blocks if stored in section content
      if (lesson.sections.length > 0 && lesson.sections[0].content) {
        try {
          const parsed = JSON.parse(lesson.sections[0].content);
          lesson.blocks = parsed.blocks || [];
          lesson.objectives = parsed.objectives || [];
          lesson.completionRule = parsed.completionRule || 'all_blocks';
        } catch {
          lesson.blocks = [];
        }
      }

      // Store in Cache (10 minutes TTL)
      cache.set(cacheKey, lesson, 600);

      if (typeof callback === 'function') {
        callback({ success: true, lesson, fromCache: false });
      } else {
        socket.emit('live_lesson_data', { success: true, lesson, fromCache: false });
      }
    } catch (err) {
      console.error('[Socket Fetch Lesson Error]', err);
      if (typeof callback === 'function') {
        callback({ error: err.message || 'Database query error' });
      }
    }
  });

  // Real-time Live Save to Database with Cache Invalidation & Room Broadcast
  socket.on('save_live_lesson', async ({ lessonId, blocks, settings, title }, callback) => {
    if (!lessonId) {
      if (typeof callback === 'function') callback({ error: 'Lesson ID required' });
      return;
    }

    try {
      // 1. Update lesson metadata if title provided
      if (title) {
        await query(
          `UPDATE "public"."lessons" SET title = $1, "updatedAt" = NOW() WHERE id = $2`,
          [title.trim(), lessonId]
        );
      }

      // 2. Extract primary media URL
      const mediaBlock = (blocks || []).find(
        (b) => ['video', 'audio', 'image'].includes(b.type) && b.content?.url
      );
      const primaryMediaUrl = mediaBlock?.content?.url || null;

      // 3. Serialize all blocks, layout, sizing, alignment, and side notes
      const contentJson = JSON.stringify({
        blocks: blocks || [],
        objectives: settings?.objectives || [],
        completionRule: settings?.completionRule || 'all_blocks',
        updatedAt: new Date().toISOString(),
      });

      // 4. Update or Insert Section
      const existingSec = await query(
        `SELECT id FROM "public"."lesson_sections" WHERE "lessonId" = $1 ORDER BY "orderIndex" ASC LIMIT 1`,
        [lessonId]
      );

      let savedSectionId;
      if (existingSec.rows.length > 0) {
        savedSectionId = existingSec.rows[0].id;
        await query(
          `UPDATE "public"."lesson_sections"
           SET content = $1, "mediaUrl" = $2, "contentType" = 'JSON', "updatedAt" = NOW()
           WHERE id = $3`,
          [contentJson, primaryMediaUrl, savedSectionId]
        );
      } else {
        const secRes = await query(
          `INSERT INTO "public"."lesson_sections"
            (id, "lessonId", title, "contentType", content, "mediaUrl", "orderIndex", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, 'JSON', $3, $4, 1, NOW(), NOW())
           RETURNING id`,
          [lessonId, title || 'Lesson Content', contentJson, primaryMediaUrl]
        );
        savedSectionId = secRes.rows[0].id;
      }

      // 5. Invalidate & Update Cache with fresh data
      const cacheKey = `lesson:${lessonId}`;
      cache.del(cacheKey);

      // 6. Broadcast Real-time Event to Lesson Room
      const room = `lesson:${lessonId}`;
      io.to(room).emit('lesson_saved_realtime', {
        lessonId,
        sectionId: savedSectionId,
        mediaUrl: primaryMediaUrl,
        savedAt: new Date().toISOString(),
      });

      io.to(room).emit('lesson_live_updated', {
        lessonId,
        blocks,
        settings,
        editor: socket.user ? `${socket.user.firstName} ${socket.user.lastName}` : 'Teacher',
        timestamp: new Date().toISOString(),
      });

      if (typeof callback === 'function') {
        callback({ success: true, savedSectionId, mediaUrl: primaryMediaUrl });
      }
    } catch (err) {
      console.error('[Socket Live Save Error]', err);
      if (typeof callback === 'function') {
        callback({ error: err.message || 'Database live save failed' });
      }
    }
  });
}

