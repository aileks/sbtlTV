import { useState, useEffect } from 'react';
import type { Source } from '../types/electron';
import './Sidebar.css';

// Tabler Icons as inline SVG
const Icons = {
  guide: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16M4 9h16M4 13h10M4 17h6" />
    </svg>
  ),
  movies: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20M2 16h20M8 4v16M16 4v16" />
    </svg>
  ),
  series: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15v-6l5 3z" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

type View = 'none' | 'guide' | 'movies' | 'series' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  visible: boolean; // Controlled by parent (same as control bar visibility)
}

export function Sidebar({ activeView, onViewChange, visible }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasXtream, setHasXtream] = useState(false);

  // Check if user has Xtream sources (for showing Movies/Series)
  useEffect(() => {
    async function checkSources() {
      if (!window.storage) return;
      const result = await window.storage.getSources();
      if (result.data) {
        setHasXtream(result.data.some((s: Source) => s.type === 'xtream'));
      }
    }
    checkSources();
  }, [activeView]); // Re-check when view changes (in case settings added a source)

  const handleClick = (view: View) => {
    if (activeView === view) {
      onViewChange('none'); // Toggle off if clicking active
    } else {
      onViewChange(view);
    }
  };

  return (
    <div
      className={`sidebar ${expanded ? 'expanded' : ''} ${visible ? 'visible' : 'hidden'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeView === 'guide' ? 'active' : ''}`}
          onClick={() => handleClick('guide')}
          title="Guide"
        >
          <span className="nav-icon">{Icons.guide}</span>
          <span className="nav-label">Guide</span>
        </button>

        {hasXtream && (
          <>
            <button
              className={`nav-item ${activeView === 'movies' ? 'active' : ''}`}
              onClick={() => handleClick('movies')}
              title="Movies"
            >
              <span className="nav-icon">{Icons.movies}</span>
              <span className="nav-label">Movies</span>
            </button>

            <button
              className={`nav-item ${activeView === 'series' ? 'active' : ''}`}
              onClick={() => handleClick('series')}
              title="Series"
            >
              <span className="nav-icon">{Icons.series}</span>
              <span className="nav-label">Series</span>
            </button>
          </>
        )}

        <div className="nav-spacer" />

        <button
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => handleClick('settings')}
          title="Settings"
        >
          <span className="nav-icon">{Icons.settings}</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export type { View };
