const API_KEY = 'ad58e706b81ea69acfd43fb050a0940e408c23e6';

const fetchGamesPage = async (today, endOfYear, offset = 0) => {
    const url = `https://www.giantbomb.com/api/games/?api_key=${API_KEY}&format=json&filter=expected_release_date:${today.toISOString()}|${endOfYear.toISOString()}&sort=original_release_date:asc&offset=${offset}&limit=100&field_list=id,name,deck,image,expected_release_day,expected_release_month,expected_release_year,expected_release_date,platforms`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'GameCalendarExtension/1.0',
            'Accept': 'application/json',
            'Origin': 'chrome-extension://game-calendar'
        }
    });

    if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des jeux (${response.status})`);
    }

    return response.json();
};

export const fetchUpcomingGames = async () => {
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    
    try {
        let allGames = [];
        let offset = 0;
        let totalResults = null;

        do {
            const data = await fetchGamesPage(today, endOfYear, offset);
            
            if (totalResults === null) {
                totalResults = data.number_of_total_results;
            }

            if (!data.results) {
                break;
            }

            const pageGames = data.results.map(game => ({
                id: game.id,
                name: game.name,
                description: game.deck,
                image: game.image?.thumb_url || '',
                expected_release_day: game.expected_release_day,
                expected_release_month: game.expected_release_month,
                expected_release_year: game.expected_release_year,
                expected_release_date: game.expected_release_date,
                platforms: game.platforms
            }));

            allGames = [...allGames, ...pageGames];
            offset += 100;
        } while (offset < totalResults);

        return allGames;
    } catch (error) {
        console.error('Erreur lors de la récupération des jeux:', error);
        throw error;
    }
};
