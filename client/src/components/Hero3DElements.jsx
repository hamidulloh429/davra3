import { useRef } from 'react';
import useParallax from '../hooks/useParallax';
import './Hero3DElements.css';

export default function Hero3DElements() {
  const containerRef = useRef(null);
  useParallax(containerRef);

  return (
    <div ref={containerRef} className="hero-3d-container">
      {/* Rotating Background Neon Rings */}
      <div className="hero-ring ring-outer" />
      <div className="hero-ring ring-inner" />

      {/* Floating Avatar Cards */}
      <div className="floating-card card-1 animate-float-3d delay-100">
        <img src="https://ui-avatars.com/api/?name=Jasur+K&background=B7FF00&color=0A0A0A&bold=true" alt="User" className="card-avatar" />
        <div className="card-info">
          <span className="card-name">Jasur Karimov</span>
          <span className="card-role badge badge-accent">Frontend Dev</span>
        </div>
      </div>

      <div className="floating-card card-2 animate-float-3d delay-300">
        <img src="https://ui-avatars.com/api/?name=Malika+A&background=123CCF&color=fff&bold=true" alt="User" className="card-avatar" />
        <div className="card-info">
          <span className="card-name">Malika Alimova</span>
          <span className="card-role badge badge-primary">UI/UX Designer</span>
        </div>
      </div>

      <div className="floating-card card-3 animate-float-3d delay-500">
        <img src="https://ui-avatars.com/api/?name=Sardor+R&background=10B981&color=fff&bold=true" alt="User" className="card-avatar" />
        <div className="card-info">
          <span className="card-name">Sardor Rahimov</span>
          <span className="card-role badge badge-success">AI Researcher</span>
        </div>
      </div>

      <div className="floating-card card-4 animate-float-3d delay-800">
        <div className="live-badge">
          <span className="live-dot" />
          <span>Real-time Chat Active</span>
        </div>
      </div>

      {/* Floating Neon Arrows & Nodes */}
      <div className="hero-node node-1 animate-pulse" />
      <div className="hero-node node-2 animate-pulse delay-300" />
      
      <svg className="neon-arrow arrow-1" viewBox="0 0 24 24" fill="none" stroke="#B7FF00" strokeWidth="2.5">
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
