// Costanti
const RAWG_API_KEY = 'b06700683ebe479fa895f1db55b1abb8'; // LA TUA CHIAVE API RAWG È QUI!
const RAWG_API_URL = 'https://api.rawg.io/api/games';

// IMPORTAZIONI FIREBASE FIRESTORE AGGIORNATE PER SDK MODULARE
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged saranno gestiti tramite window dopo firebase-config.js
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Elementi DOM
const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const siteTitleElement = document.getElementById('siteTitle');
const addGameBtn = document.getElementById('addGameBtn');
const gameModal = document.getElementById('gameModal');
const closeButton = gameModal.querySelector('.close-button');
const gameForm = document.getElementById('gameForm');
const searchRawgBtn = document.getElementById('searchRawgBtn');
const rawgSearchResults = document.getElementById('rawgSearchResults');
const previewCover = document.getElementById('previewCover');
const deleteGameInModalBtn = document.getElementById('deleteGameInModalBtn');

// Campi del form
const formGameId = document.getElementById('formGameId');
const formTitle = document.getElementById('formTitle');
const formCover = document.getElementById('formCover');
const formStatus = document.getElementById('formStatus');
const formPlatform = document.getElementById('formPlatform');
const formVotoTotale = document.getElementById('formVotoTotale');
const formVotoAesthetic = document.getElementById('formVotoAesthetic');
const formVotoOST = document.getElementById('formVotoOST');
const formOreDiGioco = document.getElementById('formOreDiGioco'); // Testo
const formAnno = document.getElementById('formAnno');
const formGenere = document.getElementById('formGenere');
const formCosto = document.getElementById('formCosto');
const formRecensione = document.getElementById('formRecensione');
const formVotoDifficolta = document.getElementById('formVotoDifficolta');
const formPercentualeTrofei = document.getElementById('formPercentualeTrofei');

// NUOVI CAMPI
const formReplayCompletati = document.getElementById('formReplayCompletati'); // Numerico
const formPrimaVoltaGiocato = document.getElementById('formPrimaVoltaGiocato'); // Testo
const formUltimaVoltaFinito = document.getElementById('formUltimaVoltaFinito'); // Testo

// Elementi per l'importazione CSV/TSV
const csvFileInput = document.getElementById('csvFileInput');
const startCsvImportBtn = document.getElementById('startCsvImportBtn');
const csvImportStatus = document.getElementById('csvImportStatus');

// Elemento per eliminare tutti i giochi
const clearAllGamesBtn = document.getElementById('clearAllGamesBtn');

// Elementi per l'autenticazione
const authButton = document.getElementById('authButton');
const userStatus = document.getElementById('userStatus');

let allGames = []; // Array per memorizzare tutti i giochi caricati
let currentUser = null; // Memorizza l'utente Firebase attualmente loggato

// --- Data di aggiornamento dell'app ---
const appLastUpdated = "07/06/2025 14:00"; 

function formatAppUpdateDate(dateString) {
    return dateString;
}
// --- FINE Data di aggiornamento dell'app ---

// --- Funzioni Firebase (sostituiscono IndexedDB) ---
function getGamesCollectionRef() {
    if (!currentUser) {
        return null;
    }
    return collection(window.firestore_db, `users/${currentUser.uid}/games`);
}

async function addGameToFirestore(game) {
    const gamesCollectionRef = getGamesCollectionRef();
    if (!gamesCollectionRef) throw new Error("Utente non autenticato. Impossibile aggiungere gioco.");
    const docRef = await addDoc(gamesCollectionRef, game);
    return { id: docRef.id, ...game };
}

async function updateGameInFirestore(game) {
    const gamesCollectionRef = getGamesCollectionRef();
    if (!gamesCollectionRef) throw new Error("Utente non autenticato. Impossibile aggiornare gioco.");
    const gameDocRef = doc(gamesCollectionRef, game.id);
    await updateDoc(gameDocRef, game);
    return game;
}

async function getAllGamesFromFirestore() {
    const gamesCollectionRef = getGamesCollectionRef();
    if (!gamesCollectionRef) return [];
    const querySnapshot = await getDocs(gamesCollectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function deleteGameFromFirestore(id) {
    const gamesCollectionRef = getGamesCollectionRef();
    if (!gamesCollectionRef) throw new Error("Utente non autenticato. Impossibile eliminare gioco.");
    const gameDocRef = doc(gamesCollectionRef, id);
    await deleteDoc(gameDocRef);
}

// --- Logica dell'App (adattata per Firebase) ---

async function loadGames() {
    gameListDiv.innerHTML = '<p class="loading">Caricamento giochi...</p>';
    
    if (appLastUpdated) {
        siteTitleElement.innerHTML = `Tracker Videogiochi di FeF <span class="header-update-info">(Aggiornato: ${formatAppUpdateDate(appLastUpdated)})</span>`;
    } else {
        siteTitleElement.innerHTML = `Tracker Videogiochi di FeF`;
    }

    if (currentUser) {
        try {
            allGames = await getAllGamesFromFirestore();
            // Ordina i giochi per titolo A-Z di default
            allGames.sort((a, b) => {
                const titleA = (a.Titolo || '').toLowerCase();
                const titleB = (b.Titolo || '').toLowerCase();
                if (titleA < titleB) return -1;
                if (titleA > titleB) return 1;
                return 0;
            });
            displayGames(allGames);
            // Abilita i bottoni se utente loggato
            addGameBtn.style.display = 'inline-block';
            startCsvImportBtn.style.display = 'inline-block';
            csvFileInput.style.display = 'inline-block';
            csvImportStatus.style.display = 'block';
            clearAllGamesBtn.style.display = 'inline-block';
        } catch (error) {
            console.error("Errore nel caricamento dei giochi da Firestore:", error);
            gameListDiv.innerHTML = '<p class="loading error">Errore nel caricamento dei giochi. Assicurati di aver configurato Firestore correttamente e di essere autenticato.</p>';
            // Disabilita i bottoni se c'è un errore o non si carica
            addGameBtn.style.display = 'none';
            startCsvImportBtn.style.display = 'none';
            csvFileInput.style.display = 'none';
            csvImportStatus.style.display = 'none';
            clearAllGamesBtn.style.display = 'none';
        }
    } else {
        allGames = [];
        displayGames([]);
        gameListDiv.innerHTML = '<p class="loading">Effettua l\'accesso con Google per visualizzare e gestire i tuoi giochi.</p>';
        // Disabilita i bottoni se non loggato
        addGameBtn.style.display = 'none';
        startCsvImportBtn.style.display = 'none';
        csvFileInput.style.display = 'none';
        csvImportStatus.style.display = 'none';
        clearAllGamesBtn.style.display = 'none';
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
        gameCard.dataset.id = game.id;

        if (game.Stato) {
            const statusClass = game.Stato.replace(/[^a-zA-Z0-9]/g, '');
            gameCard.classList.add(`status-${statusClass}`);
        }

        const starsColor = game.VotoTotale >= 90 ? 'gold' :
                               game.VotoTotale >= 70 ? 'silver' :
                               game.VotoTotale >= 50 ? 'bronze' : 'gray';

        const platformsText = Array.isArray(game.Piattaforma) && game.Piattaforma.length > 0
            ? game.Piattaforma.join(', ')
            : 'N/D';

        gameCard.innerHTML = `
            <div class="header-info">
                <h2>${game.Titolo || 'Nome Sconosciuto'}</h2>
                <span class="status-badge">${game.Stato || 'N/D'}</span>
            </div>
            <div class="platform-info">
                <span><i class="fas fa-desktop"></i> ${platformsText}</span>
            </div>
            <div class="card-stats-header">
                ${game.VotoTotale ? `⭐ ${game.VotoTotale}` : ''}
                ${game.VotoAesthetic ? ` 🌌 ${game.VotoAesthetic}` : ''}
                ${game.VotoOST ? ` 🎶 ${game.VotoOST}` : ''}
                ${game.OreDiGioco ? ` ⏳ ${game.OreDiGioco}` : ''}
            </div>
            <img src="${game.Cover || './placeholder.png'}" alt="${game.Titolo || 'No Image'}">

            <div class="stats-row">
                ${game.VotoTotale ? `<div class="stat-item"><span class="stat-icon" style="color: ${starsColor};"><i class="fas fa-star"></i></span> ${game.VotoTotale}</div>` : ''}
                ${game.VotoDifficolta ? `<div class="stat-item"><span class="stat-icon"><i class="fas fa-dumbbell"></i></span> ${game.VotoDifficolta}</div>` : ''}
                ${game.PercentualeTrofei ? `<div class="stat-item"><span title="Percentuale Trofei"><i class="fas fa-trophy"></i> ${game.PercentualeTrofei}%</span></div>` : ''}
                ${game.ReplayCompletati ? `<div class="stat-item"><span title="Replay Completati"><i class="fas fa-redo"></i> ${game.ReplayCompletati}</span></div>` : ''}
            </div>
            
            <div class="dates-info">
                ${game.PrimaVoltaGiocato ? `<span><i class="fas fa-play-circle"></i> Iniziato: ${game.PrimaVoltaGiocato}</span>` : ''}
                ${game.UltimaVoltaFinito ? `<span><i class="fas fa-flag-checkered"></i> Finito: ${game.UltimaVoltaFinito}</span>` : ''}
            </div>

            ${game.Recensione ? `<p class="description">${game.Recensione}</p>` : ''}

            <div class="footer-info">
                <span>
                    ${game.Anno ? `<i class="fas fa-calendar-alt"></i> ~${game.Anno}` : ''}
                    ${game.Genere ? ` | <i class="fas fa-gamepad"></i> ${game.Genere}` : ''}
                    ${game.Costo ? ` | <i class="fas fa-euro-sign"></i> ${game.Costo}` : ''}
                </span>
            </div>
        `;
        gameListDiv.appendChild(gameCard);

        gameCard.addEventListener('click', (event) => {
            // Evita che il click si propaghi ad elementi figli se ce ne fossero di interattivi
            // Anche se per ora l'intera card è il target, è buona pratica.
            event.stopPropagation(); 
            editGame(game.id);
        });
    });
}

function applyFilters() {
    let filteredGames = [...allGames];

    const searchValue = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;

    if (searchValue) {
        filteredGames = filteredGames.filter(game =>
            (game.Titolo && game.Titolo.toLowerCase().includes(searchValue)) ||
            (game.Genere && game.Genere.toLowerCase().includes(searchValue)) ||
            (game.Piattaforma && (Array.isArray(game.Piattaforma) ? game.Piattaforma.some(p => p.toLowerCase().includes(searchValue)) : game.Piattaforma.toLowerCase().includes(searchValue)))
        );
    }

    if (selectedStatus && selectedStatus !== 'Tutti') {
        filteredGames = filteredGames.filter(game => game.Stato === selectedStatus);
    }
    
    // Riordina i giochi filtrati per titolo A-Z
    filteredGames.sort((a, b) => {
        const titleA = (a.Titolo || '').toLowerCase();
        const titleB = (b.Titolo || '').toLowerCase();
        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
    });

    displayGames(filteredGames);
}

function openModal(game = null) {
    gameForm.reset();
    previewCover.src = './placeholder.png'; // Reset preview
    rawgSearchResults.innerHTML = ''; // Clear RAWG results
    formPlatform.value = ''; // Reset select-multiple

    if (game) {
        formGameId.value = game.id; // Firestore ID
        formTitle.value = game.Titolo || '';
        formCover.value = game.Cover || '';
        previewCover.src = game.Cover || './placeholder.png';

        formStatus.value = game.Stato || 'In Corso';

        if (Array.isArray(game.Piattaforma)) {
            Array.from(formPlatform.options).forEach(option => {
                option.selected = game.Piattaforma.includes(option.value);
            });
        } else if (typeof game.Piattaforma === 'string' && game.Piattaforma) {
            Array.from(formPlatform.options).forEach(option => {
                if (option.value === game.Piattaforma) {
                    option.selected = true;
                }
            });
        }

        formVotoTotale.value = game.VotoTotale || '';
        formVotoAesthetic.value = game.VotoAesthetic || '';
        formVotoOST.value = game.VotoOST || '';
        formOreDiGioco.value = game.OreDiGioco || '';
        formAnno.value = game.Anno || '';
        formGenere.value = game.Genere || '';
        formCosto.value = game.Costo ? parseFloat(game.Costo) : '';
        formRecensione.value = game.Recensione || '';
        formVotoDifficolta.value = game.VotoDifficolta || '';
        formPercentualeTrofei.value = game.PercentualeTrofei || '';
        
        formReplayCompletati.value = game.ReplayCompletati || '';
        formPrimaVoltaGiocato.value = game.PrimaVoltaGiocato || '';
        formUltimaVoltaFinito.value = game.UltimaVoltaFinito || '';

        // Se si sta modificando un gioco esistente, mostra il pulsante Elimina e imposta il suo data-id
        deleteGameInModalBtn.style.display = 'block';
        deleteGameInModalBtn.dataset.id = game.id;

    } else {
        formGameId.value = '';
        formStatus.value = 'In Corso';
        deleteGameInModalBtn.style.display = 'none'; // Nascondi il pulsante Elimina per un nuovo gioco
        deleteGameInModalBtn.dataset.id = ''; // Pulisci il data-id
    }
    gameModal.style.display = 'block';
}


function closeModal() {
    gameModal.style.display = 'none';
}

async function saveGame(event) {
    event.preventDefault();

    const selectedPlatforms = Array.from(formPlatform.selectedOptions).map(option => option.value);

    const gameData = {
        Titolo: formTitle.value.trim(),
        Cover: formCover.value.trim(),
        Stato: formStatus.value,
        Piattaforma: selectedPlatforms, // Salva come array
        VotoTotale: parseFloat(formVotoTotale.value) || null,
        VotoAesthetic: parseFloat(formVotoAesthetic.value) || null,
        VotoOST: parseFloat(formVotoOST.value) || null,
        OreDiGioco: formOreDiGioco.value.trim(), // Testo
        Anno: parseInt(formAnno.value) || null,
        Genere: formGenere.value.trim(),
        Costo: parseFloat(formCosto.value) || null,
        Recensione: formRecensione.value.trim(),
        VotoDifficolta: parseFloat(formVotoDifficolta.value) || null,
        PercentualeTrofei: parseFloat(formPercentualeTrofei.value) || null,
        ReplayCompletati: parseInt(formReplayCompletati.value) || null,
        PrimaVoltaGiocato: formPrimaVoltaGiocato.value.trim(),
        UltimaVoltaFinito: formUltimaVoltaFinito.value.trim()
    };

    try {
        if (formGameId.value) {
            // Modifica gioco esistente
            await updateGameInFirestore({ id: formGameId.value, ...gameData });
            console.log("Gioco aggiornato con successo!");
        } else {
            // Nuovo gioco
            await addGameToFirestore(gameData);
            console.log("Gioco aggiunto con successo!");
        }
        closeModal();
        await loadGames(); // Ricarica la lista dei giochi
    } catch (error) {
        console.error("Errore nel salvataggio del gioco:", error);
        alert("Errore nel salvataggio del gioco: " + error.message);
    }
}

async function editGame(id) {
    const gameToEdit = allGames.find(game => game.id === id);
    if (gameToEdit) {
        openModal(gameToEdit);
    } else {
        alert('Gioco non trovato!');
    }
}

async function deleteGame(id) {
    try {
        await deleteGameFromFirestore(id);
        console.log("Gioco eliminato con successo!");
        await loadGames(); // Ricarica la lista dei giochi
    } catch (error) {
        console.error("Errore nell'eliminazione del gioco:", error);
        alert("Errore nell'eliminazione del gioco: " + error.message);
    }
}

// Funzione per cercare giochi su RAWG API
async function searchRawgGame() {
    const query = formTitle.value.trim();
    if (!query) {
        rawgSearchResults.innerHTML = '<p>Inserisci un titolo per la ricerca RAWG.</p>';
        return;
    }

    rawgSearchResults.innerHTML = '<p>Ricerca in corso...</p>';
    try {
        const response = await fetch(`${RAWG_API_URL}?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`);
        const data = await response.json();

        rawgSearchResults.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(game => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('rawg-result-item');
                resultItem.innerHTML = `
                    <img src="${game.background_image || './placeholder.png'}" alt="${game.name}">
                    <span>${game.name} (${game.released ? game.released.substring(0, 4) : 'N/D'})</span>
                `;
                resultItem.addEventListener('click', () => {
                    formTitle.value = game.name;
                    formCover.value = game.background_image || '';
                    previewCover.src = game.background_image || './placeholder.png';
                    formAnno.value = game.released ? game.released.substring(0, 4) : '';
                    formGenere.value = game.genres.map(g => g.name).join(', ') || '';
                    
                    // Seleziona piattaforme se corrispondono ai valori esistenti nel select
                    const gamePlatforms = game.platforms ? game.platforms.map(p => p.platform.name) : [];
                    Array.from(formPlatform.options).forEach(option => {
                        option.selected = gamePlatforms.includes(option.value);
                    });

                    rawgSearchResults.innerHTML = ''; // Clear results after selection
                });
                rawgSearchResults.appendChild(resultItem);
            });
        } else {
            rawgSearchResults.innerHTML = '<p>Nessun risultato trovato su RAWG.</p>';
        }
    } catch (error) {
        console.error("Errore durante la ricerca RAWG:", error);
        rawgSearchResults.innerHTML = '<p>Errore nella ricerca RAWG. Riprova più tardi.</p>';
    }
}

// Funzione per l'importazione CSV/TSV
async function importGamesFromCsvOrTsv(event) {
    event.preventDefault();
    const file = csvFileInput.files[0];
    if (!file) {
        csvImportStatus.textContent = 'Seleziona un file CSV o TSV.';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== ''); // Filtra righe vuote
        if (lines.length === 0) {
            csvImportStatus.textContent = 'File vuoto o non valido.';
            return;
        }

        const delimiter = text.includes('\t') ? '\t' : ','; //rileva automaticamente se è csv o tsv
        const headers = lines[0].split(delimiter).map(h => h.trim());

        // Mappatura nomi colonne nel file CSV/TSV ai nomi dei campi del nostro modello
        const headerMap = {
            'Titolo': 'Titolo',
            'Cover': 'Cover',
            'Stato': 'Stato',
            'Piattaforma': 'Piattaforma',
            'VotoTotale': 'VotoTotale',
            'VotoAesthetic': 'VotoAesthetic',
            'VotoOST': 'VotoOST',
            'OreDiGioco': 'OreDiGioco',
            'Anno': 'Anno',
            'Genere': 'Genere',
            'Costo': 'Costo',
            'Recensione': 'Recensione',
            'VotoDifficolta': 'VotoDifficolta',
            'PercentualeTrofei': 'PercentualeTrofei',
            'ReplayCompletati': 'ReplayCompletati',
            'PrimaVoltaGiocato': 'PrimaVoltaGiocato',
            'UltimaVoltaFinito': 'UltimaVoltaFinito'
        };

        const gamesToImport = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            const game = {};
            headers.forEach((header, index) => {
                const propName = headerMap[header];
                if (propName) {
                    let value = values[index];
                    // Conversione tipi di dato
                    if (['VotoTotale', 'VotoAesthetic', 'VotoOST', 'Costo', 'VotoDifficolta', 'PercentualeTrofei'].includes(propName)) {
                        game[propName] = parseFloat(value) || null;
                    } else if (['Anno', 'ReplayCompletati'].includes(propName)) {
                        game[propName] = parseInt(value) || null;
                    } else if (propName === 'Piattaforma') {
                        // Supponiamo che le piattaforme siano separate da ; o , nel CSV
                        game[propName] = value ? value.split(';').map(p => p.trim()) : [];
                    } else {
                        game[propName] = value;
                    }
                }
            });
            // Assicurati che il titolo esista
            if (game.Titolo) {
                gamesToImport.push(game);
            }
        }

        if (gamesToImport.length === 0) {
            csvImportStatus.textContent = 'Nessun gioco valido trovato nel file.';
            return;
        }

        csvImportStatus.textContent = `Importazione di ${gamesToImport.length} giochi...`;
        try {
            const batch = writeBatch(window.firestore_db);
            const gamesCollectionRef = getGamesCollectionRef();
            if (!gamesCollectionRef) throw new Error("Utente non autenticato. Impossibile importare giochi.");

            gamesToImport.forEach(game => {
                const docRef = doc(gamesCollectionRef); // Crea un nuovo riferimento al documento con ID automatico
                batch.set(docRef, game);
            });

            await batch.commit();
            csvImportStatus.textContent = `Importazione completata: ${gamesToImport.length} giochi aggiunti.`;
            await loadGames(); // Ricarica la lista dei giochi
        } catch (error) {
            console.error("Errore durante l'importazione:", error);
            csvImportStatus.textContent = `Errore durante l'importazione: ${error.message}`;
        }
    };
    reader.onerror = () => {
        csvImportStatus.textContent = 'Errore nella lettura del file.';
    };
    reader.readAsText(file);
}

// Funzione per eliminare tutti i giochi (attenzione!)
async function clearAllGames() {
    if (!currentUser) {
        alert("Devi essere autenticato per eliminare tutti i giochi.");
        return;
    }
    if (!confirm("Sei sicuro di voler ELIMINARE TUTTI i tuoi giochi? Questa azione è irreversibile!")) {
        return;
    }

    try {
        gameListDiv.innerHTML = '<p class="loading">Eliminazione di tutti i giochi...</p>';
        const gamesCollectionRef = getGamesCollectionRef();
        if (!gamesCollectionRef) throw new Error("Errore: Collezione giochi non disponibile.");
        const querySnapshot = await getDocs(gamesCollectionRef);
        
        const batch = writeBatch(window.firestore_db);
        querySnapshot.docs.forEach(docSnapshot => {
            batch.delete(doc(gamesCollectionRef, docSnapshot.id));
        });
        await batch.commit();
        
        alert("Tutti i giochi sono stati eliminati con successo!");
        await loadGames();
    } catch (error) {
        console.error("Errore durante l'eliminazione di tutti i giochi:", error);
        alert("Errore durante l'eliminazione di tutti i giochi: " + error.message);
        await loadGames(); // Ricarica per mostrare lo stato corrente
    }
}


// --- Autenticazione Firebase ---
const auth = window.firebase_auth; // Accede all'istanza auth esposta da firebase-config.js
const provider = new GoogleAuthProvider(); // GoogleAuthProvider è ancora importato direttamente

authButton.addEventListener('click', async () => {
    if (currentUser) {
        // Log out
        try {
            await signOut(auth);
            console.log("Utente disconnesso.");
        } catch (error) {
            console.error("Errore durante il logout:", error);
        }
    } else {
        // Log in
        try {
            await signInWithPopup(auth, provider);
            console.log("Accesso Google riuscito.");
        } catch (error) {
            console.error("Errore durante l'accesso Google:", error);
            alert("Errore durante l'accesso Google: " + error.message);
        }
    }
});

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        userStatus.textContent = `Loggato come: ${user.displayName || user.email}`;
        authButton.textContent = 'Logout';
    } else {
        userStatus.textContent = 'Non loggato';
        authButton.textContent = 'Login con Google';
    }
    await loadGames(); // Ricarica i giochi ogni volta che lo stato di autenticazione cambia
});


// --- Event Listeners ---
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
addGameBtn.addEventListener('click', () => openModal());
closeButton.addEventListener('click', closeModal);
window.addEventListener('click', (event) => {
    if (event.target == gameModal) {
        closeModal();
    }
});
searchRawgBtn.addEventListener('click', searchRawgGame);
gameForm.addEventListener('submit', saveGame);

deleteGameInModalBtn.addEventListener('click', () => {
    const gameIdToDelete = deleteGameInModalBtn.dataset.id;
    if (gameIdToDelete && confirm('Sei sicuro di voler eliminare questo gioco?')) {
        deleteGame(gameIdToDelete);
        closeModal(); // Chiudi il modale dopo l'eliminazione
    }
});

if (startCsvImportBtn) { // Controlla se l'elemento esiste prima di aggiungere l'event listener
    startCsvImportBtn.addEventListener('click', importGamesFromCsvOrTsv);
}

if (clearAllGamesBtn) { // Controlla se l'elemento esiste
    clearAllGamesBtn.addEventListener('click', clearAllGames);
}

// Scroll to top button functionality
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollToTopBtn.style.display = "flex"; // Usa flex per centrare l'icona
    } else {
        scrollToTopBtn.style.display = "none";
    }
}

scrollToTopBtn.addEventListener('click', () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
});

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    // Il caricamento dei giochi ora avviene in onAuthStateChanged
    // Ma possiamo impostare la data di aggiornamento qui
    if (appLastUpdated) {
        siteTitleElement.innerHTML = `Tracker Videogiochi di FeF <span class="header-update-info">(Aggiornato: ${formatAppUpdateDate(appLastUpdated)})</span>`;
    }
});
