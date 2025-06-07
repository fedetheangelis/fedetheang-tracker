// *** SOSTITUISCI QUESTO URL CON QUELLO CHE HAI OTTENUTO DA APPS SCRIPT ***
const appsScriptWebAppUrl = 'https://script.google.com/macros/s/AKfycbxpjAET6mjwVDrEXyyFcrHqcKzwD156cNQSSd5dJ-ugS2C2ra3N63YXmYuCL172_r9y/exec'; 

const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const platformFilter = document.getElementById('platformFilter');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const siteTitleElement = document.getElementById('siteTitle'); 

let allGames = []; // Array per memorizzare tutti i giochi caricati

// --- NUOVA LOGICA: Data di aggiornamento dell'app ---
// Questa stringa rappresenta la data e ora dell'ultimo aggiornamento del codice dell'app.
// Ogni volta che carichi nuove modifiche a `script.js` (o ad altri file chiave) su GitHub,
// AGGIORNA MANUALMENTE questa stringa con la data e ora correnti.
// Esempio: "07/06/2025 12:55"
const appLastUpdated = "07/06/2025 12:55"; // Aggiorna questa data e ora ogni volta che fai un commit significativo

// Funzione per formattare la data (opzionale, se vuoi un formato diverso)
function formatAppUpdateDate(dateString) {
    // Puoi aggiungere qui logica di formattazione più complessa se necessario.
    // Per ora, ritorna la stringa così com'è.
    return dateString; 
}
// --- FINE NUOVA LOGICA ---


async function fetchGames() {
    try {
        gameListDiv.innerHTML = '<p class="loading">Caricamento giochi...</p>';
        const response = await fetch(appsScriptWebAppUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allGames = await response.json();
        allGames = allGames.filter(game => game.Titolo); 

        // Aggiorna il titolo del sito con la data di aggiornamento dell'app
        if (appLastUpdated) {
            siteTitleElement.innerHTML = `Tracker Videogiochi di FeF <span class="header-update-info">(Aggiornato: ${formatAppUpdateDate(appLastUpdated)})</span>`;
        } else {
            siteTitleElement.innerHTML = `Tracker Videogiochi di FeF`; // Torna al titolo base se non c'è una data
        }

        displayGames(allGames);
        populateFilters(allGames);
    } catch (error) {
        console.error("Errore nel recupero dei giochi:", error);
        gameListDiv.innerHTML = '<p class="loading error">Errore nel caricamento dei giochi. Controlla la console del browser per dettagli.</p>';
    }
}

function displayGames(gamesToDisplay) {
    gameListDiv.innerHTML = ''; 

    if (gamesToDisplay.length === 0) {
        gameListDiv.innerHTML = '<p class="loading">Nessun gioco trovato con i filtri attuali.</p>';
        return;
    }

    gamesToDisplay.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.classList.add('game-card');
        
        if (game.Stato) {
            const statusClass = game.Stato.replace(/[^a-zA-Z0-9]/g, ''); 
            gameCard.classList.add(`status-${statusClass}`);
        }

        const starsColor = game.Voto >= 90 ? 'gold' : 
                           game.Voto >= 70 ? 'silver' : 
                           game.Voto >= 50 ? 'bronze' : 'gray'; 

        // NON inserire qui alcuna data di aggiornamento specifica per la card
        gameCard.innerHTML = `
            <div class="header-info">
                <h2><span class="math-inline">\{game\.Titolo \|\| 'Nome Sconosciuto'\}</h2\>
<span class\="status\-badge"\></span>{game.Stato || 'N/D'}</span>
            </div>
            <div class="platform-info">
                <span><i class="fas fa-desktop"></i> ${game.Piattaforma || 'N/D'}</span>
                <span class="math-inline">\{game\.Digitale \=\=\= true ? ' \| <i class\="fas fa\-download"\></i\> Digitale' \: ''\}
</div\>
<img src\="</span>{game.Cover || '/fedetheang-tracker/placeholder.png'}" alt="${game.Titolo || 'No Image'}">

            <div class="stats-row">
                ${game.Voto ? `<div class="stat-item"><span class="stat-icon" style="color: ${starsColor};"><i class="fas fa-star"></i></span> ${game.Voto}</div>` : ''}
                ${game['Voto Totale'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-chart-line"></i></span> ${game['Voto Totale']}</div>` : ''}
                ${game['Voto Ambientazione'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-tree"></i></span> ${game['Voto Ambientazione']}</div>` : ''}
                ${game['Voto Difficoltà'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-dumbbell"></i></span> ${game['Voto Difficoltà']}</div>` : ''}
                ${game['Ora di gioco'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-hourglass-half"></i></span> ~${game['Ora di gioco']}h</div>` : ''}
            </div>

            ${game.Recensione ? `<p class="description">${game.Recensione}</p>` : ''}
            
            <div class="
