// Costanti
const RAWG_API_KEY = 'b06700683ebe479fa895f1db55b1abb8'; // <--- INSERISCI LA TUA CHIAVE API RAWG QUI
const RAWG_API_URL = 'https://api.rawg.io/api/games';
const DB_NAME = 'GameTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'games';

// Elementi DOM
const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const platformFilter = document.getElementById('platformFilter');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const siteTitleElement = document.getElementById('siteTitle');
const addGameBtn = document.getElementById('addGameBtn');
const gameModal = document.getElementById('gameModal');
const closeButton = gameModal.querySelector('.close-button');
const gameForm = document.getElementById('gameForm');
const searchRawgBtn = document.getElementById('searchRawgBtn');
const rawgSearchResults = document.getElementById('rawgSearchResults');
const previewCover = document.getElementById('previewCover');

// Campi del form
const formGameId = document.getElementById('formGameId');
const formTitle = document.getElementById('formTitle');
const formCover = document.getElementById('formCover'); // Campo nascosto
const formStatus = document.getElementById('formStatus');
const formPlatform = document.getElementById('formPlatform');
const formVotoTotale = document.getElementById('formVotoTotale');
const formVotoAesthetic = document.getElementById('formVotoAesthetic');
const formVotoOST = document.getElementById('formVotoOST');
const formOreDiGioco = document.getElementById('formOreDiGioco');
const formAnno = document.getElementById('formAnno');
const formGenere = document.getElementById('formGenere');
const formCosto = document.getElementById('formCosto');
const formRecensione = document.getElementById('formRecensione');
const formVotoDifficolta = document.getElementById('formVotoDifficolta');
const formPercentualeTrofei = document.getElementById('formPercentualeTrofei');
const formPlatinoCompletato = document.getElementById('formPlatinoCompletato');
const formDigitale = document.getElementById('formDigitale');
const formBacklog = document.getElementById('formBacklog');
const formRank = document.getElementById('formRank');

// Elementi per l'importazione CSV/TSV
const csvFileInput = document.getElementById('csvFileInput');
const startCsvImportBtn = document.getElementById('startCsvImportBtn');
const csvImportStatus = document.getElementById('csvImportStatus');


let allGames = []; // Array per memorizzare tutti i giochi caricati
let db; // Variabile per il database IndexedDB

// --- Data di aggiornamento dell'app ---
// AGGIORNA QUESTA DATA OGNI VOLTA CHE FAI UN CAMBIO SIGNIFICATIVO AL CODICE FRONTEND
const appLastUpdated = "07/06/2025 13:20"; 

function formatAppUpdateDate(dateString) {
    return dateString;
}
// --- FINE Data di aggiornamento dell'app ---

// --- Funzioni IndexedDB ---
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

function addGameToDB(game) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(game);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function updateGameInDB(game) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(game); // put per aggiornare

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllGamesFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteGameFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// --- Logica dell'App ---

async function loadGames() {
    try {
        gameListDiv.innerHTML = '<p class="loading">Caricamento giochi...</p>';
        await openDatabase(); // Apre il database
        allGames = await getAllGamesFromDB(); // Carica i giochi da IndexedDB

        if (appLastUpdated) {
            siteTitleElement.innerHTML = `Tracker Videogiochi di FeF <span class="header-update-info">(Aggiornato: ${formatAppUpdateDate(appLastUpdated)})</span>`;
        } else {
            siteTitleElement.innerHTML = `Tracker Videogiochi di FeF`;
        }

        displayGames(allGames);
        populateFilters(allGames);
    } catch (error) {
        console.error("Errore nel caricamento dei giochi:", error);
        gameListDiv.innerHTML = '<p class="loading error">Errore nel caricamento dei giochi. Controlla la console del browser.</p>';
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
        gameCard.dataset.id = game.id; // Salva l'ID del gioco per la modifica/eliminazione

        if (game.Stato) {
            const statusClass = game.Stato.replace(/[^a-zA-Z0-9]/g, '');
            gameCard.classList.add(`status-${statusClass}`);
        }

        const starsColor = game.VotoTotale >= 90 ? 'gold' :
                           game.VotoTotale >= 70 ? 'silver' :
                           game.VotoTotale >= 50 ? 'bronze' : 'gray';

        const gameHeaderContent = `
            ${game.VotoTotale ? `⭐ ${game.VotoTotale}` : ''}
            ${game.VotoAesthetic ? ` 🌌 ${game.VotoAesthetic}` : ''}
            ${game.VotoOST ? ` 🎶 ${game.VotoOST}` : ''}
            ${game.OreDiGioco ? ` ⏳ ${game.OreDiGioco}h` : ''}
        `.trim();

        gameCard.innerHTML = `
            <div class="header-info">
                <h2><span class="math-inline">\{game\.Titolo \|\| 'Nome Sconosciuto'\}</h2\>
