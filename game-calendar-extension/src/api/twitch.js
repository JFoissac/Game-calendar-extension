import { getAccessToken, getAuthUrl } from './twitchAuth';

// Remplacez cette valeur par votre vrai Client ID de la console Twitch
const CLIENT_ID = 'n0x98lp65bl3op7wh5kbry8zejw92r';
const REDIRECT_URI = 'https://localhost:3000/callback';
const SCOPES = ['user:read:email'];

let accessToken = null;

// Écouter les messages d'authentification
window.addEventListener('message', (event) => {
    if (event.data.type === 'TWITCH_AUTH_SUCCESS') {
        accessToken = event.data.accessToken;
        localStorage.setItem('twitch_access_token', accessToken);
    }
});

export const authenticate = () => {
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${SCOPES.join('+')}`;
    
    // Ouvrir dans une nouvelle fenêtre
    window.open(authUrl, 'TwitchAuth', 'width=600,height=600');
};

export const searchStreamers = async (query) => {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        // Vérifier si nous avons un token
        const token = localStorage.getItem('twitch_access_token');
        if (!token) {
            authenticate();
            return [];
        }

        const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}`, {
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('twitch_access_token');
                authenticate();
                return [];
            }
            throw new Error('Erreur lors de la recherche de streamers');
        }

        const data = await response.json();
        return data.data.map(streamer => ({
            id: streamer.id,
            login: streamer.broadcaster_login,
            name: streamer.display_name,
            description: streamer.title || '',
            image: streamer.thumbnail_url,
            isLive: streamer.is_live,
            game: streamer.game_name || ''
        }));
    } catch (error) {
        return [];
    }
};
