import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  const fetchProfile = useCallback(async (userId, userEmail, userMeta) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, insert basic profile
        const newProfile = {
          id: userId,
          email: userEmail,
          full_name: userMeta?.full_name || userEmail?.split('@')[0] || 'Foydalanuvchi',
          avatar_url: userMeta?.avatar_url || null,
        };
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (!createErr) data = created;
      }

      if (data) {
        if (data.is_blocked) {
          alert("Sizning hisobingiz bloklangan. Iltimos, administrator bilan bog'laning.");
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return;
        }

        setProfile(data);
        setNeedsUsername(!data.username);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email, session.user.user_metadata)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setUser(null);
        setProfile(null);
        setNeedsUsername(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const loginWithGoogle = async () => {
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: siteUrl,
      },
    });
    if (error) {
      console.error('Google Auth Error:', error.message);
      alert('Google orqali kirishda xatolik yuz berdi: ' + error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNeedsUsername(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const setUsername = async (username) => {
    if (!user) return { success: false, message: 'Tizimga kiring' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setNeedsUsername(false);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Username saqlashda xatolik' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        needsUsername,
        loginWithGoogle,
        logout,
        refreshProfile,
        setUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
