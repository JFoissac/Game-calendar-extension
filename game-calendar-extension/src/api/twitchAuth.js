const CLIENT_ID = 'n0x98lp65bl3op7wh5kbry8zejw92r';
const REDIRECT_URI = 'https://localhost:3000/callback';
const SCOPES = ['user:read:email'];

// Générer un état aléatoire pour la sécurité
const generateState = () => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0].toString(36);
};

// Obtenir l'URL d'autorisation
export const getAuthUrl = () => {
    const state = generateState();
    localStorage.setItem('twitch_oauth_state', state);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'token',
        scope: SCOPES.join(' '),
        state: state
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
};

// Vérifier et extraire le token d'accès de l'URL
export const handleAuthCallback = () => {
    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const state = fragment.get('state');
    const storedState = localStorage.getItem('twitch_oauth_state');
    const accessToken = fragment.get('access_token');

    if (!state || state !== storedState) {
        throw new Error('État OAuth invalide');
    }

    localStorage.removeItem('twitch_oauth_state');
    return accessToken;
};

// Gérer le token d'accès
export const setAccessToken = (token) => {
    localStorage.setItem('twitch_access_token', token);
};

export const getAccessToken = () => {
    return localStorage.getItem('twitch_access_token');
};

export const removeAccessToken = () => {
    localStorage.removeItem('twitch_access_token');
};

// Vérifier si l'utilisateur est authentifié
export const isAuthenticated = () => {
    return !!getAccessToken();
};
