import { useState, useEffect, useCallback } from 'react';
import type { MpvStatus } from './types/electron';
import { Settings } from './components/Settings';
import { Sidebar, type View } from './components/Sidebar';

// Sample streams for testing
const SAMPLE_STREAMS = [
  { name: 'Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { name: 'NASA Live', url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8' },
];

function App() {
  // mpv state
  const [mpvReady, setMpvReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStream, setCurrentStream] = useState<string | null>(null);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [channelIndex, setChannelIndex] = useState(0);
  const [activeView, setActiveView] = useState<View>('none');

  // Custom stream URL input
  const [customUrl, setCustomUrl] = useState('');

  // Set up mpv event listeners
  useEffect(() => {
    if (!window.mpv) {
      setError('mpv API not available - are you running in Electron?');
      return;
    }

    window.mpv.onReady((ready) => {
      console.log('mpv ready:', ready);
      setMpvReady(ready);
    });

    window.mpv.onStatus((status: MpvStatus) => {
      if (status.playing !== undefined) setPlaying(status.playing);
      if (status.volume !== undefined) setVolume(status.volume);
      if (status.muted !== undefined) setMuted(status.muted);
    });

    window.mpv.onError((err) => {
      console.error('mpv error:', err);
      setError(err);
    });

    return () => {
      window.mpv?.removeAllListeners();
    };
  }, []);

  // Auto-hide controls after 3 seconds of no activity
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls, playing]);

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);

  // Control handlers
  const handleLoadStream = async (url: string, name?: string) => {
    if (!window.mpv) return;
    setError(null);
    const result = await window.mpv.load(url);
    if (result.error) {
      setError(result.error);
    } else {
      setCurrentStream(name || url);
      setPlaying(true);
    }
  };

  const handleTogglePlay = async () => {
    if (!window.mpv) return;
    await window.mpv.togglePause();
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (window.mpv) {
      await window.mpv.setVolume(newVolume);
    }
  };

  const handleToggleMute = async () => {
    if (!window.mpv) return;
    await window.mpv.mute(!muted);
    setMuted(!muted);
  };

  const handleStop = async () => {
    if (!window.mpv) return;
    await window.mpv.stop();
    setPlaying(false);
    setCurrentStream(null);
  };

  // Channel navigation
  const handleChannelUp = useCallback(() => {
    const newIndex = (channelIndex + 1) % SAMPLE_STREAMS.length;
    setChannelIndex(newIndex);
    setShowChannelInfo(true);
    setTimeout(() => setShowChannelInfo(false), 2000);
  }, [channelIndex]);

  const handleChannelDown = useCallback(() => {
    const newIndex = channelIndex === 0 ? SAMPLE_STREAMS.length - 1 : channelIndex - 1;
    setChannelIndex(newIndex);
    setShowChannelInfo(true);
    setTimeout(() => setShowChannelInfo(false), 2000);
  }, [channelIndex]);

  const handlePlaySelectedChannel = useCallback(() => {
    const stream = SAMPLE_STREAMS[channelIndex];
    handleLoadStream(stream.url, stream.name);
  }, [channelIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'm':
          handleToggleMute();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleChannelUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleChannelDown();
          break;
        case 'Enter':
          if (showChannelInfo) {
            handlePlaySelectedChannel();
          }
          break;
        case 'i':
          setShowChannelInfo((prev) => !prev);
          break;
        case 'Escape':
          setShowChannelInfo(false);
          setShowControls(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleChannelUp, handleChannelDown, handlePlaySelectedChannel, showChannelInfo]);

  // Window control handlers
  const handleMinimize = () => window.electronWindow?.minimize();
  const handleMaximize = () => window.electronWindow?.maximize();
  const handleClose = () => window.electronWindow?.close();

  return (
    <div className="app" onMouseMove={handleMouseMove}>
      {/* Custom title bar for frameless window */}
      <div className="title-bar">
        <span className="title-bar-title">neTV</span>
        <div className="window-controls">
          <button onClick={handleMinimize} title="Minimize">
            ─
          </button>
          <button onClick={handleMaximize} title="Maximize">
            □
          </button>
          <button onClick={handleClose} className="close" title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Background - transparent over mpv */}
      <div className="video-background">
        {!currentStream && (
          <div className="placeholder">
            <h1>neTV</h1>
            <p>Select a stream to begin</p>
          </div>
        )}
        {currentStream && (
          <div className="now-playing">
            <p>Now playing: {currentStream}</p>
          </div>
        )}
      </div>

      {/* Channel Info Overlay */}
      {showChannelInfo && (
        <div className="channel-info">
          <div className="channel-number">{channelIndex + 1}</div>
          <div className="channel-name">{SAMPLE_STREAMS[channelIndex].name}</div>
          <div className="channel-hint">Press Enter to tune</div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Control Bar */}
      <div className={`control-bar ${showControls ? 'visible' : 'hidden'}`}>
        {/* Status indicator */}
        <div className="status">
          <span className={`indicator ${mpvReady ? 'ready' : 'waiting'}`}>
            {mpvReady ? 'mpv ready' : 'Waiting for mpv...'}
          </span>
        </div>

        {/* Stream selector */}
        <div className="stream-selector">
          <label>Quick Load:</label>
          {SAMPLE_STREAMS.map((stream, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadStream(stream.url, stream.name)}
              disabled={!mpvReady}
              className={currentStream === stream.name ? 'active' : ''}
            >
              {stream.name}
            </button>
          ))}
        </div>

        {/* Custom URL input */}
        <div className="custom-url">
          <input
            type="text"
            placeholder="Or paste stream URL..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customUrl) {
                handleLoadStream(customUrl, 'Custom Stream');
              }
            }}
          />
          <button
            onClick={() => handleLoadStream(customUrl, 'Custom Stream')}
            disabled={!mpvReady || !customUrl}
          >
            Load
          </button>
        </div>

        {/* Playback controls */}
        <div className="playback-controls">
          <button onClick={handleTogglePlay} disabled={!mpvReady || !currentStream}>
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={handleStop} disabled={!mpvReady || !currentStream}>
            ⏹ Stop
          </button>

          <div className="volume-control">
            <button onClick={handleToggleMute} disabled={!mpvReady}>
              {muted ? '🔇' : volume > 50 ? '🔊' : '🔉'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!mpvReady}
            />
            <span>{volume}%</span>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="keyboard-hints">
          <span>Space: Play/Pause</span>
          <span>M: Mute</span>
          <span>↑↓: Browse Channels</span>
          <span>I: Info</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        visible={showControls}
      />

      {/* Settings Panel */}
      {activeView === 'settings' && <Settings onClose={() => setActiveView('none')} />}
    </div>
  );
}

export default App;
