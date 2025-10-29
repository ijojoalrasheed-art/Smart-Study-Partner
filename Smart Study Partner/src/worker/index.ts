import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import OpenAI from "openai";
import {
  CreateUserProfileSchema,
  CreateChatMessageSchema,
  CreateStudySessionSchema,
  type UserProfile,
  type MatchWithProfile,
  type ChatConversation,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Auth routes
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: (c.env as any).MOCHA_USERS_SERVICE_API_URL,
    apiKey: (c.env as any).MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: (c.env as any).MOCHA_USERS_SERVICE_API_URL,
    apiKey: (c.env as any).MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: (c.env as any).MOCHA_USERS_SERVICE_API_URL,
      apiKey: (c.env as any).MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Profile routes
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).all();

  if (results.length === 0) {
    return c.json({ profile: null });
  }

  return c.json({ profile: results[0] });
});

app.post("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  
  const validation = CreateUserProfileSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const { name, age, grade, favorite_subjects, bio } = validation.data;

  // Check if profile exists
  const { results: existing } = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).all();

  if (existing.length > 0) {
    // Update existing profile
    await c.env.DB.prepare(`
      UPDATE user_profiles 
      SET name = ?, age = ?, grade = ?, favorite_subjects = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(name, age, grade, favorite_subjects, bio || "", user.id).run();
  } else {
    // Create new profile
    await c.env.DB.prepare(`
      INSERT INTO user_profiles (user_id, name, age, grade, favorite_subjects, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(user.id, name, age, grade, favorite_subjects, bio || "").run();
  }

  return c.json({ success: true });
});

// AI Matching route
app.get("/api/matches", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  // Get user's profile
  const { results: userProfile } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user.id).all();

  if (userProfile.length === 0) {
    return c.json({ matches: [] });
  }

  const profile = userProfile[0] as UserProfile;

  // Get other active profiles
  const { results: otherProfiles } = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id != ? AND is_active = 1"
  ).bind(user.id).all();

  if (otherProfiles.length === 0) {
    return c.json({ matches: [] });
  }

  // Use OpenAI to find best matches
  const openai = new OpenAI({
    apiKey: (c.env as any).OPENAI_API_KEY,
  });

  const prompt = `
You are an AI study partner matcher. Find the best 3 study partners for this student:

Student: ${profile.name}, Age: ${profile.age}, Grade: ${profile.grade}, Subjects: ${profile.favorite_subjects}

Available partners:
${otherProfiles.map((p: any) => `- ${p.name}, Age: ${p.age}, Grade: ${p.grade}, Subjects: ${p.favorite_subjects}`).join('\n')}

Return a JSON array of the top 3 matches with this exact format:
[
  {
    "name": "partner_name",
    "compatibility_score": 0.85,
    "match_reason": "Both love math and science, similar age group"
  }
]

Consider age compatibility (within 2-3 years), shared subjects, and grade level. Scores should be between 0.0 and 1.0.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiMatches = JSON.parse(response.choices[0].message.content || "[]");
    
    // Find the actual profiles and create match records
    const matches: MatchWithProfile[] = [];
    
    for (const aiMatch of aiMatches) {
      const matchedProfile = otherProfiles.find((p: any) => p.name === aiMatch.name);
      if (matchedProfile) {
        // Check if match already exists
        const { results: existingMatch } = await c.env.DB.prepare(
          "SELECT id FROM study_matches WHERE user_id = ? AND matched_user_id = ?"
        ).bind(user.id, (matchedProfile as any).user_id as string).all();

        if (existingMatch.length === 0) {
          // Create new match
          await c.env.DB.prepare(`
            INSERT INTO study_matches (user_id, matched_user_id, compatibility_score, match_reason)
            VALUES (?, ?, ?, ?)
          `).bind(user.id, (matchedProfile as any).user_id as string, aiMatch.compatibility_score, aiMatch.match_reason).run();
        }

        matches.push({
          id: Date.now() + Math.random(),
          user_id: user.id,
          matched_user_id: (matchedProfile as any).user_id as string,
          compatibility_score: aiMatch.compatibility_score,
          match_reason: aiMatch.match_reason,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          matched_profile: matchedProfile as UserProfile,
        });
      }
    }

    return c.json({ matches });
  } catch (error) {
    console.error("AI matching error:", error);
    return c.json({ error: "Failed to generate matches" }, 500);
  }
});

// Chat routes
app.get("/api/conversations", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  // Get all conversations (people user has messaged or received messages from)
  const { results: conversations } = await c.env.DB.prepare(`
    SELECT DISTINCT 
      CASE 
        WHEN sender_id = ? THEN receiver_id 
        ELSE sender_id 
      END as partner_id
    FROM chat_messages 
    WHERE sender_id = ? OR receiver_id = ?
  `).bind(user.id, user.id, user.id).all();

  const chatConversations: ChatConversation[] = [];

  for (const conv of conversations) {
    const partnerId = (conv as { partner_id: string }).partner_id;
    // Get partner profile
    const { results: partnerProfile } = await c.env.DB.prepare(
      "SELECT * FROM user_profiles WHERE user_id = ?"
    ).bind(partnerId).all();

    if (partnerProfile.length > 0) {
      // Get last message
      const { results: lastMessage } = await c.env.DB.prepare(`
        SELECT * FROM chat_messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC LIMIT 1
      `).bind(user.id, partnerId, partnerId, user.id).all();

      // Get unread count
      const { results: unreadCount } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM chat_messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0"
      ).bind(partnerId, user.id).all();

      chatConversations.push({
        partner: partnerProfile[0] as UserProfile,
        last_message: lastMessage[0] as any,
        unread_count: (unreadCount[0] as any)?.count || 0,
      });
    }
  }

  return c.json({ conversations: chatConversations });
});

app.get("/api/messages/:partnerId", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const partnerId = c.req.param("partnerId");

  const { results: messages } = await c.env.DB.prepare(`
    SELECT * FROM chat_messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).bind(user.id, partnerId, partnerId, user.id).all();

  // Mark messages as read
  await c.env.DB.prepare(
    "UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?"
  ).bind(partnerId, user.id).run();

  return c.json({ messages });
});

app.post("/api/messages", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  
  const validation = CreateChatMessageSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const { receiver_id, message } = validation.data;

  await c.env.DB.prepare(`
    INSERT INTO chat_messages (sender_id, receiver_id, message)
    VALUES (?, ?, ?)
  `).bind(user.id, receiver_id, message).run();

  return c.json({ success: true });
});

// Study sessions
app.get("/api/sessions", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const { results } = await c.env.DB.prepare(`
    SELECT s.*, p.name as partner_name 
    FROM study_sessions s
    LEFT JOIN user_profiles p ON s.partner_id = p.user_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
  `).bind(user.id).all();

  return c.json({ sessions: results });
});

app.post("/api/sessions", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json();
  
  const validation = CreateStudySessionSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: validation.error.issues }, 400);
  }

  const { partner_id, subject, duration_minutes, notes } = validation.data;

  await c.env.DB.prepare(`
    INSERT INTO study_sessions (user_id, partner_id, subject, duration_minutes, notes, completed_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(user.id, partner_id || null, subject, duration_minutes || null, notes || "").run();

  return c.json({ success: true });
});

export default app;
