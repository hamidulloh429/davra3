import './DavraVisualization.css';

export default function DavraVisualization() {
  const elements = [
    { size: 20, color: 'var(--color-ochre)', distance: 100, speed: '15s' },
    { size: 30, color: 'var(--color-terracotta)', distance: 140, speed: '20s' },
    { size: 15, color: 'var(--color-turquoise)', distance: 80, speed: '12s' },
    { size: 25, color: 'var(--color-indigo)', distance: 180, speed: '25s' },
    { size: 18, color: 'var(--color-ochre-light)', distance: 160, speed: '18s' },
    { size: 22, color: 'var(--color-terracotta-light)', distance: 120, speed: '22s' },
  ];

  return (
    <div className="davra-viz">
      <div className="davra-center">
        <span>DAVRA</span>
      </div>
      {elements.map((el, i) => (
        <div 
          key={i} 
          className="davra-orbit-el"
          style={{
            width: el.size,
            height: el.size,
            backgroundColor: el.color,
            '--orbit-radius': `${el.distance}px`,
            animationDuration: el.speed,
            animationDelay: `-${i * 3}s`
          }}
        ></div>
      ))}
      <div className="davra-ring" style={{ width: 200, height: 200 }}></div>
      <div className="davra-ring" style={{ width: 280, height: 280 }}></div>
      <div className="davra-ring" style={{ width: 360, height: 360 }}></div>
    </div>
  );
}
