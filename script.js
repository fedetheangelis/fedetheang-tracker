// *** SOSTITUISCI QUESTO URL CON QUELLO CHE HAI OTTENUTO DA APPS SCRIPT ***
const appsScriptWebAppUrl = 'https://script.google.com/macros/s/AKfycbzvRbEUSPdekXiXom7SsrHCpaa09gKQyeEEECQ8e6Q/dev'; 

const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const platformFilter = document.getElementById('platformFilter');

let allGames = []; // Array per memorizzare tutti i giochi caricati

async function fetchGames() {
    try {
        gameListDiv.innerHTML = '<p class="loading">Caricamento giochi...</p>';
        const response = await fetch(appsScriptWebAppUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allGames = await response.json();
        // Filtra giochi senza titolo o con dati incompleti, se necessario
        allGames = allGames.filter(game => game.Titolo); // Assicurati che ogni gioco abbia un Titolo
        displayGames(allGames);
        populateFilters(allGames);
    } catch (error) {
        console.error("Errore nel recupero dei giochi:", error);
        gameListDiv.innerHTML = '<p class="loading error">Errore nel caricamento dei giochi. Controlla la console del browser per dettagli.</p>';
    }
}

function displayGames(gamesToDisplay) {
    gameListDiv.innerHTML = ''; // Pulisce la lista attuale

    if (gamesToDisplay.length === 0) {
        gameListDiv.innerHTML = '<p class="loading">Nessun gioco trovato con i filtri attuali.</p>';
        return;
    }

    gamesToDisplay.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
        
        // Aggiungi una classe per lo stato (es. status-Finito, status-Attivo)
        // Rimuove spazi e caratteri speciali dai nomi degli stati per renderli validi per le classi CSS
        if (game.Stato) {
            const statusClass = game.Stato.replace(/[^a-zA-Z0-9]/g, ''); 
            gameCard.classList.add(`status-${statusClass}`);
        }

        // Usa game.Cover per l'URL della copertina
        // Usa game.Titolo per il titolo del gioco
        // Usa game.Piattaforma per la piattaforma
        gameCard.innerHTML = `
            <img src="${game.Cover || 'placeholder.png'}" alt="${game.Titolo || 'No Image'}">
            <h2>${game.Titolo || 'Nome Sconosciuto'}</h2>
            <p>Piattaforma: ${game.Piattaforma || 'N/D'}</p>
            <p class="status">Stato: ${game.Stato || 'N/D'}</p>
            ${game.Voto ? `<p>Voto: ${game.Voto}</p>` : ''}
            ${game['Ora di gioco'] ? `<p>Ore: ${game['Ora di gioco']}</p>` : ''}
            ${game.Recensione ? `<p>Recensione: ${game.Recensione}</p>` : ''}
            ${game['% trofei'] ? `<p>Trofei: ${game['% trofei']}</p>` : ''}
            ${game['Platino/Completato'] ? `<p>Platino/Completato: ${game['Platino/Completato']}</p>` : ''}
            ${game['Prima volta finito'] ? `<p>Finito il: ${game['Prima volta finito']}</p>` : ''}
            ${game['Ultima volta finito'] ? `<p>Ultimo: ${game['Ultima volta finito']}</p>` : ''}
            ${game.Backlog ? `<p>Backlog: ${game.Backlog}</p>` : ''}
            ${game.Rank ? `<p>Rank: ${game.Rank}</p>` : ''}
            ${game.Costo ? `<p>Costo: ${game.Costo}</p>` : ''}
            ${game.Anno ? `<p>Anno: ${game.Anno}</p>` : ''}
            ${game.Genere ? `<p>Genere: ${game.Genere}</p>` : ''}
            `;
        gameListDiv.appendChild(gameCard);
    });
}

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPlatform = platformFilter.value;

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.Titolo ? game.Titolo.toLowerCase().includes(searchText) : false;
        const matchesStatus = selectedStatus ? game.Stato === selectedStatus : true;
        const matchesPlatform = selectedPlatform ? game.Piattaforma === selectedPlatform : true;
        return matchesSearch && matchesStatus && matchesPlatform;
    });

    displayGames(filteredGames);
}

function populateFilters(games) {
    const platforms = new Set();
    games.forEach(game => {
        if (game.Piattaforma) { 
            platforms.add(game.Piattaforma);
        }
    });

    platformFilter.innerHTML = '<option value="">Tutte le Piattaforme</option>'; // Reset
    // Ordina le piattaforme alfabeticamente
    Array.from(platforms).sort().forEach(platform => {
        const option = document.createElement('option');
        option.value = platform;
        option.textContent = platform;
        platformFilter.appendChild(option);
    });
}


// Event Listeners per i filtri
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
platformFilter.addEventListener('change', applyFilters);


// Carica i giochi all'avvio
fetchGames();

// Registra il Service Worker per le funzionalità PWA (offline, installazione)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch(error => {
                console.error('Registrazione Service Worker fallita:', error);
            });
    });
}