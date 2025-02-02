import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthCallback, setAccessToken } from '../api/twitchAuth';

export default function TwitchCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const token = handleAuthCallback();
            if (token) {
                setAccessToken(token);
                navigate('/');
            }
        } catch (error) {
            console.error('Erreur lors de l\'authentification Twitch:', error);
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="twitch-callback">
            <h2>Authentification Twitch en cours...</h2>
            <p>Vous allez être redirigé automatiquement.</p>
        </div>
    );
}
