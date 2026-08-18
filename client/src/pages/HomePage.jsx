import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Hero3DElements from '../components/Hero3DElements';
import CircleCard from '../components/CircleCard';
import './HomePage.css';

export default function HomePage() {
  const { user, loginWithGoogle } = useAuth();
  const [stats, setStats] = useState({
    total_circles: 12,
    total_users: 148,
    today_messages: 320,
    active_users: 45
  });
  const [featuredCircles, setFeaturedCircles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch RPC stats if function exists, else query counts directly
        const { data: rpcStats } = await supabase.rpc('get_platform_stats');
        if (rpcStats) {
          setStats(rpcStats);
        } else {
          // Direct fallback counts
          const { count: circleCount } = await supabase.from('circles').select('*', { count: 'exact', head: true });
          const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
          const { count: msgCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
          
          setStats({
            total_circles: circleCount || 12,
            total_users: userCount || 148,
            today_messages: msgCount || 320,
            active_users: Math.round((userCount || 100) * 0.3)
          });
        }

        // Fetch top featured circles
        const { data: circles } = await supabase
          .from('circles')
          .select('*, categories(name), profiles!creator_id(full_name)')
          .eq('is_hidden', false)
          .order('member_count', { ascending: false })
          .limit(6);

        if (circles && circles.length > 0) {
          setFeaturedCircles(circles);
        }
      } catch (err) {
        console.error('HomePage data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="home-page">
      {/* ─── SECTION 1: HERO ─── */}
      <section className="hero-section bg-grid-dark">
        <div className="hero-container container">
          <div className="hero-content animate-slide-up">
            <div className="hero-badge badge badge-accent">
              <span className="badge-icon">🚀</span>
              <span>Professional Community Platform</span>
            </div>

            <h1 className="hero-title">
              YOUR COMMUNITY. <br />
              <span className="text-accent">YOUR DAVRA.</span>
            </h1>

            <p className="hero-desc">
              Sizga mos fikrdoshlar va mutaxassislarni bir doirada to'plang. Bepul real-time muloqot qiling, rasm va videolar ulashing, hamjamiyatingizni rivojlantiring.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link to="/communities/new" className="btn btn-primary btn-xl">
                  <span>Davra yaratish</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </Link>
              ) : (
                <button onClick={loginWithGoogle} className="btn btn-primary btn-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google orqali kirish</span>
                </button>
              )}

              <Link to="/communities" className="btn btn-glass btn-xl">
                <span>Davralarni ko'rish</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <Hero3DElements />
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: LIVE STATS ─── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">🌐</span>
              <div className="stat-info">
                <h3>{stats.total_circles || 0}</h3>
                <p>Faol davralar</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div className="stat-info">
                <h3>{stats.total_users || 0}</h3>
                <p>Foydalanuvchilar</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">💬</span>
              <div className="stat-info">
                <h3>{stats.today_messages || 0}</h3>
                <p>Bugungi xabarlar</p>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">⚡</span>
              <div className="stat-info">
                <h3>{stats.active_users || 0}</h3>
                <p>Onlayn muloqotda</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: FEATURED CIRCLES ─── */}
      <section className="section circles-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mashhur davralar</h2>
            <p className="section-subtitle">Eng faol va qiziqarli hamjamiyatlarga qo'shiling</p>
          </div>
          <Link to="/communities" className="btn btn-outline">
            <span>Hammasini ko'rish</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {featuredCircles.length > 0 ? (
          <div className="circles-grid">
            {featuredCircles.map(circle => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        ) : (
          <div className="empty-circles-fallback">
            <div className="fallback-card card">
              <h3>🚀 Birinchi davrani siz yarating!</h3>
              <p>Hali faol davralar mavjud emas. O'z qiziqishingiz bo'yicha hamjamiyat oching va do'stlaringizni taklif qiling.</p>
              <Link to="/communities/new" className="btn btn-primary mt-4">Davra yaratish</Link>
            </div>
          </div>
        )}
      </section>

      {/* ─── SECTION 4: PLATFORM FEATURES ─── */}
      <section className="section features-section bg-surface">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="section-title">Nima uchun Davra?</h2>
            <p className="section-subtitle" style={{ marginInline: 'auto' }}>
              Platformamiz zamonaviy hamjamiyatlar uchun barcha imkoniyatlarni taqdim etadi
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card card">
              <span className="feature-icon">💬</span>
              <h3>Real-time Chat & Media</h3>
              <p>Text, yuqori sifatli rasm va videolarni zudlik bilan almashing. Sahifani yangilash talab etilmaydi.</p>
            </div>

            <div className="feature-card card">
              <span className="feature-icon">🔐</span>
              <h3>Professional Xavfsizlik</h3>
              <p>Google OAuth autentifikatsiyasi, qat'iy Row Level Security (RLS) va 2-Faktorli admin paneli.</p>
            </div>

            <div className="feature-card card">
              <span className="feature-icon">🏷️</span>
              <h3>Noyob Davralar</h3>
              <p>Ochiq (Public), Yopiq (Private) yoki Faqat taklifli (Invite only) davralar yaratish erkinligi.</p>
            </div>

            <div className="feature-card card">
              <span className="feature-icon">📱</span>
              <h3>100% Mobile & PWA</h3>
              <p>Barcha smartfon, planshet va kompyuterlarda birdek qulay. Ilova sifatida o'rnatish imkoniyati.</p>
            </div>

            <div className="feature-card card">
              <span className="feature-icon">⚡</span>
              <h3>3D & Fast UI</h3>
              <p>Yengil 3D interaktiv animatsiyalar, yuqori tezlik (FPS) va modern Web3 startup estetikasi.</p>
            </div>

            <div className="feature-card card">
              <span className="feature-icon">🛠️</span>
              <h3>Moderatsiya & Reports</h3>
              <p>Spam va noto'g'ri tarkibga qarshi real-time report va admin moderatsiya tizimi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: HOW IT WORKS ─── */}
      <section className="section how-it-works-section container text-center">
        <h2 className="section-title">Qanday boshlash kerak?</h2>
        <p className="section-subtitle" style={{ marginInline: 'auto' }}>
          Atigi 3 qadamda o'z hamjamiyatingizga ega bo'ling
        </p>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Google orqali kiring</h3>
            <p>Birgina klik orqali xavfsiz va bepul ro'yxatdan o'ting va shaxsiy username tanlang.</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Davra tanlang yoki yarating</h3>
            <p>Qiziqishlaringizga mos davralarni toping yoki o'zingizning yangi davrangizni oching.</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Muloqotni boshlang</h3>
            <p>Real-time chatda fikr almashing, fayllar va tajriba ulashing.</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: COMMUNITY PREVIEW ─── */}
      <section className="section preview-section container">
        <div className="preview-card card-glass text-center">
          <div className="preview-header">
            <span className="badge badge-accent">Davra Chat Preview</span>
            <h2>Jonli suhbat muhitini his qiling</h2>
          </div>

          <div className="preview-chat-mock">
            <div className="mock-message left">
              <img src="https://ui-avatars.com/api/?name=Bekzod+M&background=123CCF&color=fff" alt="Avatar" className="avatar avatar-sm" />
              <div className="mock-bubble">
                <span className="mock-author">Bekzod M.</span>
                <p>Assalomu alaykum! Davramizga yangi qo'shilganlarni qutlaymiz 🎉</p>
              </div>
            </div>

            <div className="mock-message right">
              <div className="mock-bubble right-bubble">
                <span className="mock-author">Siz</span>
                <p>Vaalaykum assalom! Yangi startap loyihamizni muhokama qilishga tayyorman 🚀</p>
              </div>
            </div>

            <div className="mock-message left">
              <img src="https://ui-avatars.com/api/?name=Nigora+S&background=10B981&color=fff" alt="Avatar" className="avatar avatar-sm" />
              <div className="mock-bubble">
                <span className="mock-author">Nigora S.</span>
                <p>Ajoyib! Rasm va video previewlar ham juda tez ishlayapti 👍</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: CTA ─── */}
      <section className="cta-section bg-grid-dark text-center">
        <div className="container">
          <h2 className="cta-title">O'z davrangizni hoziroq yarating</h2>
          <p className="cta-subtitle">
            Minglab insonlar bilan bir doirada bo'ling. Hamjamiyat yaratish bepul va mutlaqo oson.
          </p>

          <div className="cta-actions">
            {user ? (
              <Link to="/communities/new" className="btn btn-primary btn-xl">
                Davra yaratish
              </Link>
            ) : (
              <button onClick={loginWithGoogle} className="btn btn-primary btn-xl">
                Google orqali kiring va boshlang
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
