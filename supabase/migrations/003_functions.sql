-- Migration 003: Functions and Triggers

-- 1. handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. update_updated_at()
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON circles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- 3. get_platform_stats()
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json AS $$
DECLARE
  v_total_circles INT;
  v_total_users INT;
  v_today_messages INT;
  v_active_users INT;
BEGIN
  SELECT count(*) INTO v_total_circles FROM circles WHERE is_hidden = false;
  SELECT count(*) INTO v_total_users FROM profiles;
  SELECT count(*) INTO v_today_messages FROM messages WHERE created_at >= NOW() - INTERVAL '1 day';
  SELECT count(*) INTO v_active_users FROM profiles WHERE last_login_at >= NOW() - INTERVAL '1 day';
  
  RETURN json_build_object(
    'total_circles', v_total_circles,
    'total_users', v_total_users,
    'today_messages', v_today_messages,
    'active_users', v_active_users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. update_circle_member_count()
CREATE OR REPLACE FUNCTION public.update_circle_member_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE circles SET member_count = member_count - 1 WHERE id = OLD.circle_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_circle_member_change
  AFTER INSERT OR DELETE ON circle_members
  FOR EACH ROW EXECUTE PROCEDURE public.update_circle_member_count();

-- 5. check_message_rate_limit()
CREATE OR REPLACE FUNCTION public.check_message_rate_limit(p_user_id UUID, p_circle_id UUID)
RETURNS boolean AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count 
  FROM messages 
  WHERE user_id = p_user_id AND circle_id = p_circle_id AND created_at >= NOW() - INTERVAL '10 seconds';
  
  RETURN v_count < 5;
END;
$$ LANGUAGE plpgsql;

-- 6. search_platform()
CREATE OR REPLACE FUNCTION public.search_platform(search_query TEXT)
RETURNS json AS $$
DECLARE
  v_users json;
  v_circles json;
BEGIN
  SELECT json_agg(row_to_json(u)) INTO v_users
  FROM (
    SELECT id, username, full_name, avatar_url 
    FROM profiles 
    WHERE username ILIKE '%' || search_query || '%' OR full_name ILIKE '%' || search_query || '%'
    LIMIT 10
  ) u;

  SELECT json_agg(row_to_json(c)) INTO v_circles
  FROM (
    SELECT id, name, slug, cover_image, description 
    FROM circles 
    WHERE (name ILIKE '%' || search_query || '%' OR description ILIKE '%' || search_query || '%') 
    AND is_hidden = false AND is_archived = false
    LIMIT 10
  ) c;

  RETURN json_build_object(
    'users', COALESCE(v_users, '[]'::json),
    'circles', COALESCE(v_circles, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql;
