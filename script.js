// Costanti
const RAWG_API_KEY = 'b06700683ebe479fa895f1db55b1abb8'; // LA TUA CHIAVE API RAWG È QUI!
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
// const updateCoversBtn = document.getElementById('updateCoversBtn'); // Commentato: non più necessario con l'approccio attuale

// NUOVO ELEMENTO DOM: Pulsante per eliminare tutti i giochi
const clearAllGamesBtn = document.getElementById('clearAllGamesBtn');


let allGames = []; // Array per memorizzare tutti i giochi caricati
let db; // Variabile per il database IndexedDB

// --- Data di aggiornamento dell'app ---
// AGGIORNA QUESTA DATA OGNI VOLTA CHE FAI UN CAMBIO SIGNIFICATIVO AL CODICE FRONTEND
const appLastUpdated = "07/06/2025 14:00"; 

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
                <h2>${game.Titolo || 'Nome Sconosciuto'}</h2>
                <span class="status-badge">${game.Stato || 'N/D'}</span>
            </div>
            <div class="platform-info">
                <span><i class="fas fa-desktop"></i> ${game.Piattaforma || 'N/D'}</span>
                ${game.Digitale === true ? ' | <i class="fas fa-download"></i> Digitale' : ''}
            </div>
            <div class="card-stats-header">
                ${gameHeaderContent || '<span class="no-stats-info">Nessun dato statistico</span>'}
            </div>
            <img src="${game.Cover || './placeholder.png'}" alt="${game.Titolo || 'No Image'}">

            <div class="stats-row">
                ${game.VotoTotale ? `<div class="stat-item"><span class="stat-icon" style="color: ${starsColor};"><i class="fas fa-star"></i></span> ${game.VotoTotale}</div>` : ''}
                ${game.VotoDifficolta ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-dumbbell"></i></span> ${game.VotoDifficolta}</div>` : ''}
            </div>

            ${game.Recensione ? `<p class="description">${game.Recensione}</p>` : ''}

            <div class="footer-info">
                <span>
                    ${game.Anno ? `<i class="fas fa-calendar-alt"></i> ~${game.Anno}` : ''}
                    ${game.Genere ? ` | <i class="fas fa-gamepad"></i> ${game.Genere}` : ''}
                    ${game.Costo ? ` | <i class="fas fa-euro-sign"></i> ${game.Costo}` : ''}
                </span>
                <span class="footer-icons">
                    ${game.PercentualeTrofei ? `<span title="Percentuale Trofei"><i class="fas fa-trophy"></i> ${game.PercentualeTrofei}%</span>` : ''}
                    ${game.PlatinoCompletato ? `<span title="Platino/Completato"><i class="fas fa-check-circle"></i></span>` : ''}
                    ${game.Backlog ? `<span title="Nel Backlog"><i class="fas fa-book"></i></span>` : ''}
                    ${game.Rank ? `<span title="Rank"><i class="fas fa-medal"></i> ${game.Rank}</span>` : ''}
                </span>
            </div>
            <button class="delete-game-btn">Elimina</button> `;
        gameListDiv.appendChild(gameCard);

        // Aggiungi event listener per la modifica della card
        gameCard.addEventListener('click', (event) => {
            // Evita che il click sul bottone di eliminazione apra il modale di modifica
            if (!event.target.classList.contains('delete-game-btn')) {
                editGame(game.id);
            }
        });
        
        // Aggiungi event listener per il bottone di eliminazione
        gameCard.querySelector('.delete-game-btn').addEventListener('click', (event) => {
            event.stopPropagation(); // Evita che il click si propaghi alla card
            if (confirm(`Sei sicuro di voler eliminare ${game.Titolo}?`)) {
                deleteGame(game.id);
            }
        });
    });
}

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPlatform = platformFilter.value;

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.Titolo ? game.Titolo.toLowerCase().includes(searchText) : false;
        const matchesStatus = selectedStatus ? game.Stato === selectedStatus : true;
        const matchesPlatform = selectedPlatform ? game.Piattaforma && game.Piattaforma.toLowerCase().includes(selectedPlatform.toLowerCase()) : true; // Modificato per contenere
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

    platformFilter.innerHTML = '<option value="">Tutte le Piattaforme</option>';
    Array.from(platforms).sort().forEach(platform => {
        const option = document.createElement('option');
        option.value = platform;
        option.textContent = platform;
        platformFilter.appendChild(option);
    });
}

// --- Funzioni Modale Form ---

function openModal(game = null) {
    gameForm.reset();
    rawgSearchResults.innerHTML = ''; // Pulisci i risultati RAWG precedenti
    previewCover.src = './placeholder.png'; // Reimposta l'immagine placeholder
    formCover.value = ''; // Pulisci il campo cover nascosto

    if (game) {
        formGameId.value = game.id;
        formTitle.value = game.Titolo || '';
        formStatus.value = game.Stato || 'Backlog';
        formPlatform.value = game.Piattaforma || '';
        formVotoTotale.value = game.VotoTotale || '';
        formVotoAesthetic.value = game.VotoAesthetic || '';
        formVotoOST.value = game.VotoOST || '';
        formOreDiGioco.value = game.OreDiGioco || '';
        formAnno.value = game.Anno || '';
        formGenere.value = game.Genere || '';
        formCosto.value = game.Costo || '';
        formRecensione.value = game.Recensione || '';
        formVotoDifficolta.value = game.VotoDifficolta || '';
        formPercentualeTrofei.value = game.PercentualeTrofei || '';
        // Utilizza il campo corretto per il checkbox
        formPlatinoCompletato.checked = game.PlatinoCompletato || false; 
        formDigitale.checked = game.Digitale || false;
        formBacklog.checked = game.Backlog || false;
        formRank.value = game.Rank || '';
        
        if (game.Cover) {
            previewCover.src = game.Cover;
            formCover.value = game.Cover;
        }
    } else {
        formGameId.value = ''; // Nuovo gioco
    }
    gameModal.style.display = 'block';
}

function closeModal() {
    gameModal.style.display = 'none';
}

async function searchRawgGame() {
    const title = formTitle.value.trim();
    if (!title) {
        rawgSearchResults.innerHTML = '<p>Inserisci un titolo per la ricerca.</p>';
        return;
    }
    rawgSearchResults.innerHTML = '<p>Ricerca...</p>';

    try {
        const response = await fetch(`${RAWG_API_URL}?search=${encodeURIComponent(title)}&key=${RAWG_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Errore RAWG API: ${response.status}`);
        }
        const data = await response.json();

        rawgSearchResults.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(game => {
                const item = document.createElement('div');
                item.classList.add('rawg-result-item');
                item.innerHTML = `
                    <img src="${game.background_image || './placeholder.png'}" alt="${game.name}">
                    <span>${game.name} (${game.released ? game.released.substring(0,4) : 'N/D'})</span>
                `;
                item.addEventListener('click', () => {
                    previewCover.src = game.background_image || './placeholder.png';
                    formCover.value = game.background_image || '';
                    formTitle.value = game.name || ''; // Aggiorna il titolo con quello RAWG
                    formAnno.value = game.released ? game.released.substring(0, 4) : ''; // Anno di uscita RAWG
                    if (game.genres && game.genres.length > 0) {
                        formGenere.value = game.genres.map(g => g.name).join(', '); // Genere RAWG
                    }
                    rawgSearchResults.innerHTML = ''; // Chiudi i risultati dopo la selezione
                });
                rawgSearchResults.appendChild(item);
            });
        } else {
            rawgSearchResults.innerHTML = '<p>Nessun risultato trovato su RAWG.</p>';
        }

    } catch (error) {
        console.error("Errore ricerca RAWG:", error);
        rawgSearchResults.innerHTML = `<p class="error">Errore nella ricerca RAWG: ${error.message}</p>`;
    }
}

async function saveGame(event) {
    event.preventDefault();

    const gameData = {
        id: formGameId.value ? parseInt(formGameId.value) : undefined, // Undefined per nuovi giochi, l'ID viene auto-incrementato
        Titolo: formTitle.value.trim(),
        Cover: formCover.value.trim(),
        Stato: formStatus.value,
        Piattaforma: formPlatform.value.trim(),
        VotoTotale: formVotoTotale.value ? parseInt(formVotoTotale.value) : null,
        VotoAesthetic: formVotoAesthetic.value ? parseInt(formVotoAesthetic.value) : null,
        VotoOST: formVotoOST.value ? parseInt(formVotoOST.value) : null,
        OreDiGioco: formOreDiGioco.value ? parseInt(formOreDiGioco.value) : null,
        Anno: formAnno.value ? parseInt(formAnno.value) : null,
        Genere: formGenere.value.trim(),
        Costo: formCosto.value ? parseFloat(formCosto.value) : null,
        Recensione: formRecensione.value.trim(),
        VotoDifficolta: formVotoDifficolta.value ? parseInt(formVotoDifficolta.value) : null,
        PercentualeTrofei: formPercentualeTrofei.value ? parseInt(formPercentualeTrofei.value) : null,
        PlatinoCompletato: formPlatinoCompletato.checked,
        Digitale: formDigitale.checked,
        Backlog: formBacklog.checked,
        Rank: formRank.value ? parseInt(formRank.value) : null
    };

    if (!gameData.Titolo) {
        alert('Il titolo è obbligatorio!');
        return;
    }

    try {
        if (gameData.id) {
            await updateGameInDB(gameData);
            console.log('Gioco aggiornato:', gameData);
        } else {
            await addGameToDB(gameData);
            console.log('Gioco aggiunto:', gameData);
        }
        closeModal();
        loadGames(); // Ricarica e visualizza i giochi dopo l'aggiornamento
    } catch (error) {
        console.error("Errore nel salvataggio del gioco:", error);
        alert("Errore nel salvataggio del gioco. Controlla la console per dettagli.");
    }
}

async function editGame(gameId) {
    const gameToEdit = allGames.find(game => game.id === gameId);
    if (gameToEdit) {
        openModal(gameToEdit);
    }
}

async function deleteGame(gameId) {
    try {
        await deleteGameFromDB(gameId);
        console.log(`Gioco con ID ${gameId} eliminato.`);
        loadGames(); // Ricarica i giochi dopo l'eliminazione
    } catch (error) {
        console.error("Errore nell'eliminazione del gioco:", error);
        alert("Errore nell'eliminazione del gioco. Controlla la console per dettagli.");
    }
}

// --- Funzione di Importazione da CSV/TSV ---
async function importGamesFromCsvOrTsv() {
    const file = csvFileInput.files[0];
    if (!file) {
        alert("Seleziona un file CSV o TSV da importare.");
        return;
    }

    if (!confirm(`Sei sicuro di voler importare i dati dal file "${file.name}"? Questa operazione aggiungerà nuovi giochi al tuo tracker.`)) {
        return;
    }

    csvImportStatus.textContent = 'Lettura del file in corso...';
    startCsvImportBtn.disabled = true;
    csvFileInput.disabled = true;

    const reader = new FileReader();

    reader.onload = async (e) => {
        const text = e.target.result;
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const delimiter = isCsv ? ',' : '\t';

        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            alert("Il file è vuoto o non contiene dati.");
            csvImportStatus.textContent = 'Errore: File vuoto.';
            startCsvImportBtn.disabled = false;
            csvFileInput.disabled = false;
            return;
        }

        // Mappa gli header, assicurandosi che siano puliti da spazi extra
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const sheetGames = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length !== headers.length) {
                console.warn(`Riga ${i + 1} saltata: numero di colonne non corrispondente all'intestazione.`);
                continue; // Salta righe malformate
            }
            const rowObject = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index];
            });
            sheetGames.push(rowObject);
        }

        if (sheetGames.length === 0) {
            alert("Nessun dato valido trovato nel file per l'importazione dopo l'analisi.");
            csvImportStatus.textContent = 'Errore: Nessun dato valido.';
            startCsvImportBtn.disabled = false;
            csvFileInput.disabled = false;
            return;
        }

        console.log("Dati letti dal file:", sheetGames);
        csvImportStatus.textContent = `Analizzati ${sheetGames.length} giochi. Salvataggio in corso...`;

        try {
            await openDatabase(); // Assicurati che IndexedDB sia aperto
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            let importedCount = 0;

            for (const sheetGame of sheetGames) {
                const gameData = {
                    // id: verrà auto-incrementato da IndexedDB
                    Titolo: sheetGame.Titolo || '',
                    Cover: sheetGame['Link copertina:'] || '', // <-- Ora usa il nome esatto della colonna!
                    Stato: sheetGame.Stato || 'Backlog',
                    Piattaforma: sheetGame.Piattaforma || '',
                    OreDiGioco: sheetGame['Ore di gioco'] ? parseInt(sheetGame['Ore di gioco']) : null,
                    VotoTotale: sheetGame['Voto Totale'] ? parseInt(sheetGame['Voto Totale']) : null,
                    VotoAesthetic: sheetGame['Voto Aesthetic'] ? parseInt(sheetGame['Voto Aesthetic']) : null,
                    VotoOST: sheetGame['Voto OST'] ? parseInt(sheetGame['Voto OST']) : null,
                    VotoDifficolta: sheetGame['Difficoltà'] ? parseInt(sheetGame['Difficoltà']) : null, // Mappa 'Difficoltà' come numerico
                    Recensione: sheetGame.Recensione || '',
                    PercentualeTrofei: sheetGame['% Trofei'] ? parseInt(sheetGame['% Trofei']) : null,
                    // 'Platino/Masterato in' come plain text
                    PlatinoMasteratoIn: sheetGame['Platino/Masterato in'] || '', 
                    // 'Prima volta giocato' e 'Ultima volta finito' come plain text
                    PrimaVoltaGiocato: sheetGame['Prima volta giocato'] || '',
                    UltimaVoltaFinito: sheetGame['Ultima volta finito'] || '',
                    
                    // Altri campi, se presenti nel tuo TSV e desideri mappali
                    Anno: sheetGame.Anno ? parseInt(sheetGame.Anno) : null,
                    Genere: sheetGame.Genere || '',
                    Costo: sheetGame.Costo ? parseFloat(sheetGame.Costo) : null,
                    Digitale: sheetGame.Digitale === true || sheetGame.Digitale === 'TRUE' || sheetGame.Digitale === '1', // Assumi se hai una colonna 'Digitale'
                    Backlog: sheetGame.Backlog === true || sheetGame.Backlog === 'TRUE' || sheetGame.Backlog === '1', // Assumi se hai una colonna 'Backlog'
                    Rank: sheetGame.Rank ? parseInt(sheetGame.Rank) : null, // Assumi se hai una colonna 'Rank'
                    ReplayCompletati: sheetGame['Replay completati'] ? parseInt(sheetGame['Replay completati']) : null, // Mappa Replay completati come numerico
                };

                // Aggiungi solo se ha un titolo valido
                if (gameData.Titolo) {
                    const request = store.add(gameData);
                    request.onsuccess = () => {
                        importedCount++;
                    };
                    request.onerror = (e) => {
                        console.warn(`Errore aggiungendo "${gameData.Titolo}":`, e.target.error.name);
                    };
                }
            }

            await new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    resolve();
                };
                transaction.onerror = (event) => {
                    reject(event.target.error);
                };
            });

            csvImportStatus.textContent = `Importazione completata! ${importedCount} giochi aggiunti a IndexedDB.`;
            alert(`Importazione completata! ${importedCount} giochi aggiunti.`);
            loadGames(); // Ricarica e visualizza i giochi

            // Rimuovi gli elementi di importazione dopo il successo
            csvFileInput.style.display = 'none';
            startCsvImportBtn.style.display = 'none';
            csvImportStatus.style.display = 'none';

        } catch (dbError) {
            console.error("Errore nel salvataggio in IndexedDB:", dbError);
            csvImportStatus.textContent = `Errore di salvataggio: ${dbError.message}`;
        } finally {
            startCsvImportBtn.disabled = false;
            csvFileInput.disabled = false;
        }
    };

    reader.onerror = (e) => {
        console.error("Errore nella lettura del file:", e);
        csvImportStatus.textContent = `Errore nella lettura del file: ${e.message}`;
        startCsvImportBtn.disabled = false;
        csvFileInput.disabled = false;
    };

    reader.readAsText(file);
}

// --- Nuova Funzione per Eliminare Tutti i Giochi ---
async function clearAllGames() {
    if (!confirm("SEI SICURO DI VOLER ELIMINARE TUTTI I GIOCHI DAL TUO TRACKER?\nQuesta azione è irreversibile e non può essere annullata!")) {
        return;
    }

    try {
        await openDatabase(); // Assicurati che IndexedDB sia aperto
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear(); // Il metodo clear() elimina tutti gli oggetti dallo store

        request.onsuccess = () => {
            console.log('Tutti i giochi sono stati eliminati da IndexedDB.');
            alert('Tutti i giochi sono stati eliminati con successo!');
            loadGames(); // Ricarica la lista dei giochi (che ora sarà vuota)
        };

        request.onerror = (event) => {
            console.error('Errore durante l\'eliminazione di tutti i giochi:', event.target.error);
            alert('Errore durante l\'eliminazione di tutti i giochi. Controlla la console per i dettagli.');
        };
    } catch (error) {
        console.error("Errore nell'apertura del database per l'eliminazione:", error);
        alert("Errore nell'apertura del database per l'eliminazione.");
    }
}


// --- Event Listeners ---
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
platformFilter.addEventListener('change', applyFilters);
addGameBtn.addEventListener('click', () => openModal()); // Apre il modale per aggiungere un nuovo gioco
closeButton.addEventListener('click', closeModal);
window.addEventListener('click', (event) => { // Chiude il modale cliccando fuori
    if (event.target == gameModal) {
        closeModal();
    }
});
searchRawgBtn.addEventListener('click', searchRawgGame);
gameForm.addEventListener('submit', saveGame);

// Event listener per l'importazione CSV/TSV
if (startCsvImportBtn) { // Controlla se il bottone esiste nel DOM
    startCsvImportBtn.addEventListener('click', importGamesFromCsvOrTsv);
}

// NUOVO EVENT LISTENER: Eliminazione di tutti i giochi
if (clearAllGamesBtn) {
    clearAllGamesBtn.addEventListener('click', clearAllGames);
}


// Scroll to Top Button logic
window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
        scrollToTopBtn.style.display = 'flex';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Carica i giochi all'avvio
loadGames();

// Registra il Service Worker per le funzionalità PWA (offline, installazione)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Nota: il percorso del service worker deve essere relativo alla radice del sito GitHub Pages
        // Se il tuo repository è 'fedetheang.github.io/fedetheang-tracker/', il percorso è '/fedetheang-tracker/service-worker.js'
        // Se il tuo repository è 'fedetheang.github.io/', il percorso è '/service-worker.js'
        // Ho messo il percorso per un repo 'nomeutente.github.io/nome-repo/'
        navigator.serviceWorker.register('/fedetheang-tracker/service-worker.js') 
            .then(registration => {
                console.log('Service Worker registrato con successo:', registration);
            })
            .catch(error => {
                console.error('Registrazione Service Worker fallita:', error);
            });
    });
}
