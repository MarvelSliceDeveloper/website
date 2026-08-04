import { useState } from 'react';

const styles = {
  container: {
    display: 'flex',
    position: 'relative',
  },
  tab: {
    position: 'relative',
    padding: '8px 14px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  active: {
    background: '#f97316',
    color: '#fff',
  },
  inactive: {
    background: '#f3f4f6',
    color: '#1e293b',
  },
  diamond: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '12px',
    height: '12px',
    background: '#f97316',
    pointerEvents: 'none',
  },
};

export default function TabBar({ tabs, activeIndex = 0, onChange }) {
  const [active, setActive] = useState(activeIndex);

  function handleClick(i) {
    setActive(i);
    onChange?.(i);
  }

  return (
    <div style={styles.container}>
      {tabs.map((label, i) => (
        <button
          key={label}
          onClick={() => handleClick(i)}
          style={{
            ...styles.tab,
            ...(i === active ? styles.active : styles.inactive),
          }}
        >
          {label}
          {i === active && <div style={styles.diamond} />}
        </button>
      ))}
    </div>
  );
}
