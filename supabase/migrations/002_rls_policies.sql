-- Migration 002: RLS Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Anyone can SELECT public profiles" ON profiles FOR SELECT USING (
    id IN (SELECT user_id FROM user_settings WHERE profile_visibility = 'public') 
    OR auth.uid() = id
    OR EXISTS (
        SELECT 1 FROM circle_members cm1 
        JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id 
        WHERE cm1.user_id = auth.uid() AND cm2.user_id = profiles.id
    )
);
CREATE POLICY "Users can UPDATE their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- user_settings
CREATE POLICY "Users can CRUD their own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- categories
CREATE POLICY "Anyone can SELECT categories" ON categories FOR SELECT USING (true);

-- circles
CREATE POLICY "Anyone can SELECT non-hidden, non-archived circles" ON circles FOR SELECT USING (is_hidden = false AND is_archived = false);
CREATE POLICY "Members can see private/hidden circles they belong to" ON circles FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = circles.id)
);
CREATE POLICY "Authenticated users can INSERT circles" ON circles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can UPDATE circles" ON circles FOR UPDATE USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = circles.id AND role = 'owner'));
CREATE POLICY "Owners can DELETE circles" ON circles FOR DELETE USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = circles.id AND role = 'owner'));

-- circle_members
CREATE POLICY "Members can SELECT circle members" ON circle_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members cm WHERE cm.user_id = auth.uid() AND cm.circle_id = circle_members.circle_id) OR
    EXISTS (SELECT 1 FROM circles WHERE id = circle_members.circle_id AND privacy_type = 'public' AND is_hidden = false)
);
CREATE POLICY "Authenticated users can INSERT (join) public circles" ON circle_members FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM circles WHERE id = circle_members.circle_id AND privacy_type = 'public')
);
CREATE POLICY "Users can DELETE their own membership" ON circle_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Owners/Mods can DELETE others" ON circle_members FOR DELETE USING (
    EXISTS (SELECT 1 FROM circle_members mods WHERE mods.user_id = auth.uid() AND mods.circle_id = circle_members.circle_id AND mods.role IN ('owner', 'moderator'))
);
CREATE POLICY "Owners/Mods can UPDATE roles" ON circle_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM circle_members mods WHERE mods.user_id = auth.uid() AND mods.circle_id = circle_members.circle_id AND mods.role = 'owner')
);

-- messages
CREATE POLICY "Circle members can SELECT messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = messages.circle_id)
);
CREATE POLICY "Members can INSERT messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = messages.circle_id AND is_muted = false AND is_banned = false)
    AND auth.uid() = user_id
);
CREATE POLICY "Users can UPDATE their own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can DELETE their own messages" ON messages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Owners/mods can DELETE any messages" ON messages FOR DELETE USING (
    EXISTS (SELECT 1 FROM circle_members mods WHERE mods.user_id = auth.uid() AND mods.circle_id = messages.circle_id AND mods.role IN ('owner', 'moderator'))
);

-- message_reactions
CREATE POLICY "Circle members can SELECT reactions" ON message_reactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM messages m JOIN circle_members cm ON m.circle_id = cm.circle_id WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Members can INSERT their own reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can DELETE their own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- message_attachments
CREATE POLICY "Circle members can SELECT attachments" ON message_attachments FOR SELECT USING (
    EXISTS (SELECT 1 FROM messages m JOIN circle_members cm ON m.circle_id = cm.circle_id WHERE m.id = message_attachments.message_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Message senders can INSERT attachments" ON message_attachments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM messages WHERE id = message_attachments.message_id AND user_id = auth.uid())
);

-- notifications
CREATE POLICY "Users can SELECT their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can UPDATE their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- reports
CREATE POLICY "Authenticated users can INSERT reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

-- site_settings
CREATE POLICY "Anyone can SELECT site settings" ON site_settings FOR SELECT USING (true);

-- invitations
CREATE POLICY "Inviter and invitee can SELECT" ON invitations FOR SELECT USING (
    auth.uid() = inviter_id OR auth.email() = invitee_email
);
CREATE POLICY "Authenticated can INSERT" ON invitations FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = inviter_id
);

-- join_requests
CREATE POLICY "Requestor and circle owner can SELECT" ON join_requests FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM circle_members WHERE user_id = auth.uid() AND circle_id = join_requests.circle_id AND role IN ('owner', 'moderator'))
);
CREATE POLICY "Authenticated can INSERT" ON join_requests FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
);
