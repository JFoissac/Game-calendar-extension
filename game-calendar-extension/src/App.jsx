import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import Select from 'react-select';
import { fetchUpcomingGames } from './api/giantBomb';
import { searchStreamers } from './api/twitch';
import 'react-calendar/dist/Calendar.css';
import './App.css';

function App() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [streamers, setStreamers] = useState([]);
  const [selectedStreamer, setSelectedStreamer] = useState(null);
  const [gameSearch, setGameSearch] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'game',
    description: '',
    streamer: '',
    streamerImage: '',
    gameImage: '',
    gameDeck: '',
    platforms: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les événements depuis le stockage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const storage = await chrome.storage.local.get('events');
        if (storage.events) {
          setEvents(storage.events);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    loadEvents();
  }, []);

  // Sauvegarder les événements dans le stockage
  useEffect(() => {
    const saveEvents = async () => {
      try {
        if (events.length > 0) {
          await chrome.storage.local.set({ events });
        }
      } catch (error) {
        console.error('Error saving events:', error);
      }
    };
    saveEvents();
  }, [events]);

  // Charger les jeux
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const games = await fetchUpcomingGames();
        setUpcomingGames(games);
      } catch (error) {
        console.error('Erreur lors du chargement des jeux:', error);
        setError('Impossible de charger les jeux. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  // Filtrer les jeux en fonction de la recherche
  const filteredGames = upcomingGames.filter(game => 
    game.name.toLowerCase().includes(gameSearch.toLowerCase())
  );

  // Formater la date de sortie
  const formatReleaseDate = (game) => {
    if (game.expected_release_date) {
      const date = new Date(game.expected_release_date);
      return format(date, 'dd-MM-yyyy');
    } else if (game.expected_release_year) {
      if (game.expected_release_month && game.expected_release_day) {
        return `${String(game.expected_release_day).padStart(2, '0')}-${String(game.expected_release_month).padStart(2, '0')}-${game.expected_release_year}`;
      } else if (game.expected_release_month) {
        return `${String(game.expected_release_month).padStart(2, '0')}-${game.expected_release_year}`;
      }
      return `${game.expected_release_year}`;
    }
    return 'Date inconnue';
  };

  // Formater les plateformes
  const formatPlatforms = (platforms) => {
    if (!platforms || platforms.length === 0) return 'Plateformes inconnues';
    return platforms.map(p => p.name).join(', ');
  };

  // Convertir les jeux en options pour react-select
  const gameOptions = upcomingGames.map(game => ({
    value: game.id,
    label: `${game.name} (${formatReleaseDate(game)})`,
    game: game
  }));

  // Rechercher les streamers
  const handleStreamerSearch = async (inputValue) => {
    try {
      if (inputValue && inputValue.length >= 2) {
        const results = await searchStreamers(inputValue);
        setStreamers(results);
        return results;
      } else {
        setStreamers([]);
        return [];
      }
    } catch (error) {
      console.error('Erreur dans handleStreamerSearch:', error);
      setStreamers([]);
      return [];
    }
  };

  // Convertir les streamers en options pour react-select
  const streamerOptions = [...streamers]
    .sort((a, b) => {
      // Trier d'abord par statut live, puis par nom
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(streamer => ({
      value: streamer.id,
      label: (
        <div className="streamer-option">
          <img src={streamer.image} alt={streamer.name} className="streamer-avatar" />
          <div className="streamer-info">
            <div className="streamer-name">
              {streamer.name}
              {streamer.isLive && <span className="live-badge">LIVE</span>}
            </div>
          </div>
        </div>
      ),
      streamer: streamer
    }));

  const handleStreamerSelect = (option) => {
    if (option) {
      const streamer = option.streamer;
      setSelectedStreamer(streamer);
      setNewEvent(prev => ({
        ...prev,
        streamer: streamer.name,
        streamerImage: streamer.image,
        twitchUrl: `https://twitch.tv/${streamer.login}`
      }));
    } else {
      setSelectedStreamer(null);
    }
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      alert('Le titre et la date sont requis');
      return;
    }

    const updatedEvents = editingEvent
      ? events.map(event => event.id === editingEvent.id ? { ...newEvent, id: event.id } : event)
      : [...events, { ...newEvent, id: Date.now() }];

    setEvents(updatedEvents);
    setEditingEvent(null);
    setNewEvent({
      title: '',
      date: format(date, 'yyyy-MM-dd'),
      type: 'game',
      description: '',
      streamer: '',
      streamerImage: '',
      gameImage: '',
      gameDeck: '',
      platforms: []
    });
    setShowAddEvent(false);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      type: event.type,
      description: event.description,
      streamer: event.streamer || '',
      streamerImage: event.streamerImage || '',
      gameImage: event.gameImage || '',
      gameDeck: event.gameDeck || '',
      platforms: event.platforms || []
    });
    setShowAddEvent(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      setEvents(events.filter(event => event.id !== eventId));
    }
  };

  const handleVerifyLink = (event, e) => {
    e.stopPropagation();
    if (event.type === 'twitch' && event.twitchUrl) {
      window.open(event.twitchUrl, '_blank');
    }
  };

  const handleEventClick = (event) => {
    if (event.type === 'twitch' && event.twitchUrl) {
      window.open(event.twitchUrl, '_blank');
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setNewEvent(prev => ({
      ...prev,
      date: format(newDate, 'yyyy-MM-dd') + (prev.type === 'other' ? 'T00:00' : '')
    }));
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setNewEvent(prev => ({
      ...prev,
      type,
      date: format(date, 'yyyy-MM-dd') + (type === 'other' ? 'T00:00' : '')
    }));
  };

  const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  const getEventsForDate = (date) => {
    return events.filter(event => 
      new Date(event.date).toDateString() === date.toDateString()
    );
  };

  const handleGameSelect = (option) => {
    if (option) {
      const game = option.game;
      setSelectedGame(game);
      setNewEvent(prev => ({
        ...prev,
        title: game.name,
        description: game.deck || '',
        gameImage: game.image || '',
        gameDeck: game.deck || '',
        platforms: game.platforms || [],
        date: game.expected_release_date || prev.date
      }));
    } else {
      setSelectedGame(null);
    }
  };

  const renderEvent = (event) => {
    const url = event.type === 'other' ? extractUrl(event.description || '') : null;
    
    return (
      <div key={event.id} className={`event-card ${event.type}`} onClick={() => handleEventClick(event)}>
        {event.type !== 'other' && (
          <div className="event-image">
            {event.type === 'game' && event.gameImage && (
              <img 
                src={event.gameImage} 
                alt={event.title} 
                className="game-image" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23333"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">No Image</text></svg>';
                }}
              />
            )}
            {event.type === 'twitch' && event.streamerImage && (
              <img 
                src={event.streamerImage} 
                alt={event.streamer} 
                className="streamer-image" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23333"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">No Image</text></svg>';
                }}
              />
            )}
          </div>
        )}
        <div className="event-content">
          <div className="event-header">
            <div className="event-title">
              {event.type === 'other' && url ? (
                <h3>
                  <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    {event.title}
                  </a>
                </h3>
              ) : (
                <h3>{event.title}</h3>
              )}
              {event.type === 'twitch' && event.streamer && (
                <div className="streamer-name">
                  <span className="platform-tag">{event.streamer}</span>
                </div>
              )}
              {event.type === 'other' && (
                <div className="event-time">
                  <span className="time-tag">{format(new Date(event.date), 'HH:mm')}</span>
                </div>
              )}
            </div>
            <div className="event-actions">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEvent(event);
                }} 
                className="edit-button" 
                title="Modifier"
              >
                ✏️
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(event.id);
                }} 
                className="delete-button" 
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
          <p className="event-description">{event.description}</p>
          {event.type === 'game' && event.platforms && event.platforms.length > 0 && (
            <div className="platforms">
              {event.platforms.map(platform => (
                <span key={platform.id} className="platform-tag">
                  {platform.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>Calendrier Gaming</h1>
      
      <div className="calendar-section">
        <Calendar
          onChange={handleDateChange}
          value={date}
          tileContent={({ date }) => {
            const dayEvents = getEventsForDate(date);
            return dayEvents.length > 0 && (
              <div className="event-dot-container">
                {dayEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className={`event-dot ${event.type}`} 
                    title={event.title}
                  />
                ))}
              </div>
            );
          }}
        />
      </div>

      <button 
        className="add-event-button"
        onClick={() => setShowAddEvent(!showAddEvent)}
      >
        {showAddEvent ? 'Annuler' : 'Ajouter un événement'}
      </button>

      {showAddEvent && (
        <div className="event-form">
          <h2>{editingEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}</h2>
          <form onSubmit={handleSaveEvent}>
            <div className="form-group">
              <label>Type</label>
              <select
                value={newEvent.type}
                onChange={handleTypeChange}
                required
              >
                <option value="">Sélectionner un type</option>
                <option value="game">Jeu</option>
                <option value="twitch">Stream Twitch</option>
                <option value="other">Autre</option>
              </select>
            </div>

            {newEvent.type === 'game' && (
              <div className="form-group">
                <label>Sélectionner un jeu</label>
                <Select
                  options={gameOptions}
                  value={selectedGame ? {
                    value: selectedGame.id,
                    label: `${selectedGame.name} (${formatReleaseDate(selectedGame)})`,
                    game: selectedGame
                  } : null}
                  onChange={handleGameSelect}
                  isClearable
                  isSearchable
                  placeholder="Rechercher un jeu..."
                  noOptionsMessage={() => "Aucun jeu trouvé"}
                  className="game-select-container"
                  classNamePrefix="game-select"
                />
                {selectedGame && (
                  <div className="game-details">
                    <p className="release-date">Date de sortie : {formatReleaseDate(selectedGame)}</p>
                    <p className="platforms">Plateformes : {formatPlatforms(selectedGame.platforms)}</p>
                    {newEvent.gameImage && (
                      <div className="game-image-preview">
                        <img src={newEvent.gameImage} alt={newEvent.title} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {newEvent.type === 'twitch' && (
              <div className="form-group streamer-group">
                <label>Nom du Streamer</label>
                <Select
                  options={streamerOptions}
                  value={selectedStreamer ? {
                    value: selectedStreamer.id,
                    label: (
                      <div className="streamer-option">
                        <img src={selectedStreamer.image} alt={selectedStreamer.name} className="streamer-avatar" />
                        <div className="streamer-info">
                          <div className="streamer-name">
                            {selectedStreamer.name}
                            {selectedStreamer.isLive && <span className="live-badge">LIVE</span>}
                          </div>
                        </div>
                      </div>
                    )
                  } : null}
                  onChange={handleStreamerSelect}
                  onInputChange={(value) => {
                    handleStreamerSearch(value);
                  }}
                  filterOption={(option, input) => true}
                  isLoading={streamers.length === 0}
                  placeholder="Rechercher un streamer..."
                  isClearable
                  isSearchable
                  className="streamer-select"
                  classNamePrefix="select"
                  noOptionsMessage={() => streamers.length === 0 ? "Recherche en cours..." : "Aucun streamer trouvé"}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null
                  }}
                  menuIsOpen={streamers.length > 0}
                />
              </div>
            )}

            {newEvent.type === 'other' ? (
              <div className="form-group">
                <label>Date et heure</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>

            <button type="submit" className="submit-button">
              {editingEvent ? 'Modifier' : 'Ajouter'}
            </button>
          </form>
        </div>
      )}

      <div className="events-list">
        <h2>Événements du {format(date, 'dd/MM/yyyy')}</h2>
        {getEventsForDate(date).map((event) => renderEvent(event))}
      </div>
      {loading && <p>Chargement des jeux...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;
