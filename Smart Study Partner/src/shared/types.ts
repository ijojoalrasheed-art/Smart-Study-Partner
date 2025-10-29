import z from "zod";

export const UserProfileSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  age: z.number().min(6).max(100),
  grade: z.string(),
  favorite_subjects: z.string(),
  bio: z.string().optional(),
  is_active: z.boolean(),
  last_active_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(6, "Age must be at least 6").max(100, "Age must be less than 100"),
  grade: z.string().min(1, "Grade is required"),
  favorite_subjects: z.string().min(1, "At least one subject is required"),
  bio: z.string().optional(),
});

export const StudyMatchSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  matched_user_id: z.string(),
  compatibility_score: z.number(),
  match_reason: z.string().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ChatMessageSchema = z.object({
  id: z.number(),
  sender_id: z.string(),
  receiver_id: z.string(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateChatMessageSchema = z.object({
  receiver_id: z.string(),
  message: z.string().min(1, "Message cannot be empty"),
});

export const StudySessionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  partner_id: z.string().optional(),
  subject: z.string(),
  duration_minutes: z.number().optional(),
  notes: z.string().optional(),
  completed_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateStudySessionSchema = z.object({
  partner_id: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  duration_minutes: z.number().optional(),
  notes: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CreateUserProfile = z.infer<typeof CreateUserProfileSchema>;
export type StudyMatch = z.infer<typeof StudyMatchSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateChatMessage = z.infer<typeof CreateChatMessageSchema>;
export type StudySession = z.infer<typeof StudySessionSchema>;
export type CreateStudySession = z.infer<typeof CreateStudySessionSchema>;

export interface MatchWithProfile extends StudyMatch {
  matched_profile: UserProfile;
}

export interface ChatConversation {
  partner: UserProfile;
  last_message?: ChatMessage;
  unread_count: number;
}
