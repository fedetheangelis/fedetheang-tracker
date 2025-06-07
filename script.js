// *** SOSTITUISCI QUESTO URL CON QUELLO CHE HAI OTTENUTO DA APPS SCRIPT ***
const appsScriptWebAppUrl = 'https://script.google.com/macros/s/AKfycbxpjAET6mjwVDrEXyyFcrHqcKzwD156cNQSSd5dJ-ugS2C2ra3N63YXmYuCL172_r9y/exec'; 

const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const platformFilter = document.getElementById('platformFilter');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const siteTitleElement = document.getElementById('siteTitle'); // Nuovo riferimento all'elemento del titolo

let allGames = []; // Array per memorizzare tutti i giochi caricati

async function fetchGames() {
    try {
        gameListDiv.innerHTML = '<p class="loading">Caricamento giochi...</p>';
        const response = await fetch(appsScriptWebAppUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allGames = await response.json();
        allGames = allGames.filter(game => game.Titolo); 

        // NUOVA LOGICA: Recupera e imposta la data dell'ultimo aggiornamento nel titolo del sito
        // Assumiamo che la data sia nel primo gioco (riga 2 del tuo foglio) nella colonna "Ultimo aggiornamento"
        if (allGames.length > 0 && allGames[0]['Ultimo aggiornamento']) {
            siteTitleElement.innerHTML = `Tracker Videogiochi di FeF <span class="header-update-info">(Aggiornato: ${allGames[0]['Ultimo aggiornamento']})</span>`;
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

        gameCard.innerHTML = `
            <div class="header-info">
                <h2>${game.Titolo || 'Nome Sconosciuto'}</h2>
                <span class="status-badge">${game.Stato || 'N/D'}</span>
            </div>
            <div class="platform-info">
                <span><i class="fas fa-desktop"></i> ${game.Piattaforma || 'N/D'}</span>
                ${game.Digitale === true ? ' | <i class="fas fa-download"></i> Digitale' : ''}
            </div>
            <img src="${game.Cover || '/fedetheang-tracker/placeholder.png'}" alt="${game.Titolo || 'No Image'}">

            <div class="stats-row">
                ${game.Voto ? `<div class="stat-item"><span class="stat-icon" style="color: ${starsColor};"><i class="fas fa-star"></i></span> ${game.Voto}</div>` : ''}
                ${game['Voto Totale'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-chart-line"></i></span> ${game['Voto Totale']}</div>` : ''}
                ${game['Voto Ambientazione'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-tree"></i></span> ${game['Voto Ambientazione']}</div>` : ''}
                ${game['Voto Difficoltà'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-dumbbell"></i></span> ${game['Voto Difficoltà']}</div>` : ''}
                ${game['Ora di gioco'] ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-hourglass-half"></i></span> ~${game['Ora di gioco']}h</div>` : ''}
            </div>

            ${game.Recensione ? `<p class="description">${game.Recensione}</p>` : ''}
            
            <div class="footer-info">
                <span>
                    ${game.Anno ? `<i class="fas fa-calendar-alt"></i> ~${game.Anno}` : ''}
                    ${game.Genere ? ` | <i class="fas fa-gamepad"></i> ${game.Genere}` : ''}
                    ${game.Costo ? ` | <i class="fas fa-euro-sign"></i> ${game.Costo}` : ''}
                </span>
                <span class="footer-icons">
                    ${game['% trofei'] ? `<span title="Percentuale Trofei"><i class="fas fa-trophy"></i> ${game['% trofei']}</span>` : ''}
                    ${game['Platino/Completato'] ? `<span title="Platino/Completato"><i class="fas fa-check-circle"></i></span>` : ''}
                    ${game.Backlog ? `<span title="Nel Backlog"><i class="fas fa-book"></i></span>` : ''}
                    ${game.Rank ? `<span title="Rank"><i class="fas fa-medal"></i> ${game.Rank}</span>` : ''}
                </span>
            </div>
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


// Scroll to Top Button logic
window.addEventListener('scroll', () => {
    if (window.scrollY > 200) { // Mostra il bottone dopo 200px di scroll
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Animazione di scorrimento
    });
});


// Carica i giochi all'avvio
fetchGames();

// Registra il Service Worker per le funzionalità PWA (offline, installazione)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/fedetheang-tracker/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch(error => {
                console.error('Registrazione Service Worker fallita:', error);
            });
    });
}
