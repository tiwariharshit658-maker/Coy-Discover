import { useCallback, useEffect, useRef, useState } from "react";

function Icon({ name, size = 22 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": true
  };
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
  if (name === "close") return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></svg>;
  if (name === "chat") return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.8-4.1a7 7 0 0 1-1.3-4.4A7.5 7.5 0 0 1 12 4h.5a7.5 7.5 0 0 1 7.5 7.5Z" /></svg>;
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></svg>;
  if (name === "back") return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
  return null;
}

async function request(path, options) {
  const response = await fetch(path, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Something went wrong");
  return payload;
}

function ProfileCard({ profile, onSwipe, disabled, exitDirection }) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [imageFailed, setImageFailed] = useState(false);
  const start = useRef(null);
  const dragX = useRef(0);

  useEffect(() => {
    setImageFailed(false);
    setDrag({ x: 0, y: 0 });
    dragX.current = 0;
  }, [profile?.id]);

  if (!profile) return null;

  function handlePointerDown(event) {
    if (disabled) return;
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!start.current || disabled) return;
    dragX.current = event.clientX - start.current.x;
    setDrag({ x: dragX.current, y: event.clientY - start.current.y });
  }

  function handlePointerUp() {
    if (!start.current) return;
    const delta = dragX.current;
    start.current = null;
    if (Math.abs(delta) > 90) {
      onSwipe(delta > 0 ? "like" : "pass");
    } else {
      dragX.current = 0;
      setDrag({ x: 0, y: 0 });
    }
  }

  const rotation = Math.max(-12, Math.min(12, drag.x / 22));
  const style = {
    transform: exitDirection
      ? `translate3d(${exitDirection === "like" ? "125vw" : "-125vw"}, 0, 0) rotate(${exitDirection === "like" ? 22 : -22}deg)`
      : `translate3d(${drag.x}px, ${drag.y * 0.18}px, 0) rotate(${rotation}deg)`,
    opacity: exitDirection ? 0 : 1,
    transition: exitDirection
      ? "transform 260ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease"
      : start.current ? "none" : "transform 260ms cubic-bezier(.2,.8,.2,1)"
  };

  return (
    <article
      className="profile-card"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={`${profile.name}, ${profile.age}`}
    >
      {!imageFailed ? (
        <img className="profile-photo" src={profile.photo} alt="" draggable="false" onError={() => setImageFailed(true)} />
      ) : (
        <div className={`photo-placeholder hue-${Number(profile.id.slice(-2)) % 6}`} aria-hidden="true">
          <span>{profile.name[0]}</span>
        </div>
      )}
      <div className={`swipe-stamp ${drag.x > 24 ? "stamp-like" : drag.x < -24 ? "stamp-pass" : ""}`}>
        {drag.x > 24 ? "LIKE" : drag.x < -24 ? "PASS" : ""}
      </div>
      <div className="photo-shade" />
      <div className="card-content">
        <div className="profile-heading">
          <div>
            <h2>{profile.name}<span>, {profile.age}</span></h2>
            <p className="location"><span className="pin">⌖</span>{profile.location}</p>
          </div>
          <span className="verified-mark" aria-label="Profile">✦</span>
        </div>
        <p className="bio">{profile.bio}</p>
        <div className="interest-list">
          {profile.interests.map((interest) => <span className="interest" key={interest}>{interest}</span>)}
        </div>
      </div>
    </article>
  );
}

function MatchDialog({ profile, onClose }) {
  return (
    <div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="match-title">
      <div className="match-confetti" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>·</i></div>
      <button className="icon-button match-close" onClick={onClose} aria-label="Close match"><Icon name="close" /></button>
      <div className="match-copy">
        <span className="eyebrow">IT'S MUTUAL</span>
        <h2 id="match-title">It's a match!</h2>
        <p>You and {profile.name} liked each other.</p>
      </div>
      <div className="match-photo-wrap">
        <img src={profile.photo} alt={`${profile.name}`} />
        <span className="match-heart"><Icon name="heart" size={23} /></span>
      </div>
      <button className="primary-button" onClick={onClose}>Keep discovering <span>→</span></button>
      <p className="privacy-note"><Icon name="spark" size={15} /> Only mutual likes become matches.</p>
    </div>
  );
}

function MatchesView({ matches, loading }) {
  if (loading) return <div className="view-message">Loading your matches…</div>;
  if (!matches.length) return (
    <div className="matches-empty">
      <div className="empty-icon"><Icon name="heart" size={29} /></div>
      <h2>Your story starts with a spark.</h2>
      <p>When you and someone like each other, you’ll find each other here.</p>
    </div>
  );
  return (
    <section className="matches-section">
      <p className="section-label">YOUR MUTUAL SPARKS <span>{matches.length}</span></p>
      <div className="matches-list">
        {matches.map((match) => (
          <article className="match-row" key={match.id}>
            <img src={match.photo} alt="" />
            <div className="match-row-copy">
              <h3>{match.name}, {match.age}</h3>
              <p>{match.location}</p>
              <span>It's mutual ✨</span>
            </div>
            <span className="row-heart"><Icon name="heart" size={18} /></span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState("discover");
  const [feed, setFeed] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exitDirection, setExitDirection] = useState("");
  const [newMatch, setNewMatch] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [feedData, matchData] = await Promise.all([request("/feed"), request("/matches")]);
      setFeed(feedData.profiles);
      setMatches(matchData.matches);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const swipe = useCallback(async (action) => {
    const current = feed[0];
    if (!current || saving) return;
    setSaving(true);
    setFeedback(action === "like" ? "LIKE" : "PASS");
    setExitDirection(action);
    setError("");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 240));
      const result = await request("/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: current.id, action })
      });
      setFeed((previous) => previous.filter((profile) => profile.id !== current.id));
      setExitDirection("");
      if (result.match) {
        setMatches((previous) => previous.some((match) => match.id === result.profile.id) ? previous : [result.profile, ...previous]);
        setNewMatch(result.profile);
      }
      window.setTimeout(() => setFeedback(""), 600);
    } catch (requestError) {
      setExitDirection("");
      setError(requestError.message);
      setFeedback("");
    } finally {
      setSaving(false);
    }
  }, [feed, saving]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (tab !== "discover" || newMatch || saving || event.target instanceof HTMLButtonElement) return;
      if (event.key === "ArrowRight") swipe("like");
      if (event.key === "ArrowLeft") swipe("pass");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab, newMatch, saving, swipe]);

  const dismissMatch = () => setNewMatch(null);
  const currentProfile = feed[0];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Coy">
          <span className="brand-mark"><span /></span>
          <span>coy</span>
        </div>
        <span className="topbar-caption">GOOD THINGS, BOTH WAYS</span>
        <button className="profile-avatar" aria-label="Your profile">Y</button>
      </header>

      <main className="main-content">
        {tab === "discover" ? (
          <section className="discover-view" aria-label="Discover people">
            <div className="discover-intro">
              <span className="eyebrow"><Icon name="spark" size={14} /> YOUR PEOPLE ARE OUT THERE</span>
              <h1>A little more <em>you.</em></h1>
              <p>Meet someone who gets your kind of curious.</p>
            </div>

            {error && <div className="error-banner" role="alert">{error}<button onClick={loadFeed}>Try again</button></div>}

            {loading ? (
              <div className="card-loading" aria-label="Loading profiles"><span /><span /><span /></div>
            ) : currentProfile ? (
              <>
                <div className="card-wrap">
                  <ProfileCard profile={currentProfile} onSwipe={swipe} disabled={saving} exitDirection={exitDirection} />
                </div>
                <div className="swipe-controls" aria-label="Profile actions">
                  <button className="action-button pass-button" onClick={() => swipe("pass")} disabled={saving} aria-label="Pass">
                    <Icon name="close" size={25} />
                  </button>
                  <span className="gesture-hint">← pass <span>·</span> like →</span>
                  <button className="action-button like-button" onClick={() => swipe("like")} disabled={saving} aria-label="Like">
                    <Icon name="heart" size={25} />
                  </button>
                </div>
                <div className={`swipe-feedback ${feedback ? "visible" : ""} ${feedback === "LIKE" ? "feedback-like" : ""}`} aria-live="polite">
                  {feedback}
                </div>
                <p className="privacy-promise"><Icon name="spark" size={14} /> Likes stay private until they're mutual.</p>
              </>
            ) : (
              <div className="feed-empty">
                <div className="empty-icon"><Icon name="spark" size={28} /></div>
                <h2>You're all caught up.</h2>
                <p>That's everyone for now. Check back soon for new faces.</p>
              </div>
            )}
          </section>
        ) : tab === "matches" ? (
          <section className="matches-view">
            <div className="discover-intro matches-intro">
              <span className="eyebrow"><Icon name="heart" size={14} /> THE GOOD PART</span>
              <h1>Your <em>mutuals.</em></h1>
              <p>Only the sparks you both chose.</p>
            </div>
            <MatchesView matches={matches} loading={loading} />
          </section>
        ) : <section className="home-view" aria-label="Home" />}
      </main>

      <nav className="tab-bar" aria-label="Main navigation">
        <button className={`tab-item ${tab === "home" ? "active" : ""}`} onClick={() => setTab("home")} aria-current={tab === "home" ? "page" : undefined}>
          <Icon name="home" size={21} /><span>Home</span>
        </button>
        <button className={`tab-item ${tab === "discover" ? "active" : ""}`} onClick={() => setTab("discover")} aria-current={tab === "discover" ? "page" : undefined}>
          <span className="discover-tab-icon"><Icon name="spark" size={21} /></span><span>Discover</span>
        </button>
        <button className={`tab-item ${tab === "matches" ? "active" : ""}`} onClick={() => setTab("matches")} aria-current={tab === "matches" ? "page" : undefined}>
          <Icon name="chat" size={21} /><span>Matches{matches.length > 0 && <span className="match-count">{matches.length}</span>}</span>
        </button>
      </nav>
      {newMatch && <MatchDialog profile={newMatch} onClose={dismissMatch} />}
    </div>
  );
}
