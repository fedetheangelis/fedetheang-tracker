// Costanti
const RAWG_API_KEY = 'b06700683ebe479fa895f1db55b1abb8'; // LA TUA CHIAVE API RAWG È QUI!
const RAWG_API_URL = 'https://api.rawg.io/api/games';

// IMPORTAZIONI FIREBASE FIRESTORE AGGIORNATE PER SDK MODULARE
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Elementi DOM
const gameListDiv = document.getElementById('gameList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
// Rimosso: const platformFilter = document.getElementById('platformFilter'); <-- Rimosso definitivamente
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
const formPlatform = document.getElementById('formPlatform'); // Questo rimane per il form di aggiunta/modifica
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
            // Rimosso: populateFilters(allGames);
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
        // Rimosso: populateFilters([]); // Pulisci i filtri
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
            <button class="delete-game-btn">Elimina</button>
        `;
        gameListDiv.appendChild(gameCard);

        gameCard.addEventListener('click', (event) => {
            if (!event.target.classList.contains('delete-game-btn')) {
                editGame(game.id);
            }
        });
        
        gameCard.querySelector('.delete-game-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            if (confirm(`Sei sicuro di voler eliminare ${game.Titolo}?`)) {
                deleteGame(game.id);
            }
        });
    });
}

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;
    // Rimosso: const selectedPlatform = platformFilter.value; // Non più necessario

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.Titolo ? game.Titolo.toLowerCase().includes(searchText) : false;
        const matchesStatus = selectedStatus ? game.Stato === selectedStatus : true;
        
        // Rimosso il controllo del filtro per piattaforma
        return matchesSearch && matchesStatus; // Modificato per non considerare il filtro piattaforma
    });

    displayGames(filteredGames);
}

// Rimosso: function populateFilters(games) { ... } <-- Rimosso definitivamente

// --- Funzioni Modale Form ---

function openModal(game = null) {
    if (!currentUser) {
        alert("Devi essere loggato per aggiungere o modificare giochi.");
        return;
    }
    gameForm.reset();
    rawgSearchResults.innerHTML = '';
    previewCover.src = './placeholder.png';
    formCover.value = '';

    Array.from(formPlatform.options).forEach(option => {
        option.selected = false;
    });

    if (game) {
        formGameId.value = game.id;
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
                    formTitle.value = game.name || '';
                    formAnno.value = game.released ? game.released.substring(0, 4) : '';
                    if (game.genres && game.genres.length > 0) {
                        formGenere.value = game.genres.map(g => g.name).join(', ');
                    }
                    rawgSearchResults.innerHTML = '';
                });
                rawgSearchResults.appendChild(item);
            });
        } else {
            rawgSearchResults.innerHTML = '<p>Nessun risultato trovato su RAWG.</p>';
        }

    }
    catch (error) {
        console.error("Errore ricerca RAWG:", error);
        rawgSearchResults.innerHTML = `<p class="error">Errore nella ricerca RAWG: ${error.message}</p>`;
    }
}

async function saveGame(event) {
    event.preventDefault();

    if (!currentUser) {
        alert("Devi essere loggato per salvare giochi.");
        return;
    }

    const selectedPlatforms = Array.from(formPlatform.selectedOptions).map(option => option.value);

    const gameData = {
        Titolo: formTitle.value.trim(),
        Cover: formCover.value.trim(),
        Stato: formStatus.value,
        Piattaforma: selectedPlatforms.length > 0 ? selectedPlatforms : null,
        VotoTotale: formVotoTotale.value ? parseInt(formVotoTotale.value) : null,
        VotoAesthetic: formVotoAesthetic.value ? parseInt(formVotoAesthetic.value) : null,
        VotoOST: formVotoOST.value ? parseInt(formVotoOST.value) : null,
        OreDiGioco: formOreDiGioco.value.trim(),
        Anno: formAnno.value ? parseInt(formAnno.value) : null,
        Genere: formGenere.value.trim(),
        Costo: formCosto.value ? parseFloat(formCosto.value) : null,
        Recensione: formRecensione.value.trim(),
        VotoDifficolta: formVotoDifficolta.value ? parseInt(formVotoDifficolta.value) : null,
        PercentualeTrofei: formPercentualeTrofei.value ? parseInt(formPercentualeTrofei.value) : null,
        
        ReplayCompletati: formReplayCompletati.value ? parseInt(formReplayCompletati.value) : null,
        PrimaVoltaGiocato: formPrimaVoltaGiocato.value.trim(),
        UltimaVoltaFinito: formUltimaVoltaFinito.value.trim(),
    };

    if (!gameData.Titolo) {
        alert('Il titolo è obbligatorio!');
        return;
    }

    try {
        if (formGameId.value) {
            gameData.id = formGameId.value;
            await updateGameInFirestore(gameData);
            console.log('Gioco aggiornato su Firestore:', gameData);
        } else {
            const newGame = await addGameToFirestore(gameData);
            console.log('Gioco aggiunto a Firestore:', newGame);
        }
        closeModal();
        loadGames();
    } catch (error) {
        console.error("Errore nel salvataggio del gioco su Firestore:", error);
        alert("Errore nel salvataggio del gioco. Controlla la console per dettagli e assicurati di essere loggato.");
    }
}

async function editGame(gameId) {
    if (!currentUser) {
        alert("Devi essere loggato per modificare giochi.");
        return;
    }
    const gameToEdit = allGames.find(game => game.id === gameId);
    if (gameToEdit) {
        openModal(gameToEdit);
    }
}

async function deleteGame(gameId) {
    if (!currentUser) {
        alert("Devi essere loggato per eliminare giochi.");
        return;
    }
    try {
        await deleteGameFromFirestore(gameId);
        console.log(`Gioco con ID ${gameId} eliminato da Firestore.`);
        loadGames();
    } catch (error) {
        console.error("Errore nell'eliminazione del gioco da Firestore:", error);
        alert("Errore nell'eliminazione del gioco. Controlla la console per dettagli.");
    }
}

// --- Funzione di Importazione da CSV/TSV (adattata per Firebase) ---
async function importGamesFromCsvOrTsv() {
    if (!currentUser) {
        alert("Devi essere loggato per importare giochi.");
        return;
    }

    const file = csvFileInput.files[0];
    if (!file) {
        alert("Seleziona un file CSV o TSV da importare.");
        return;
    }

    if (!confirm(`Sei sicuro di voler importare i dati dal file "${file.name}"?\nQuesta operazione aggiungerà nuovi giochi al tuo tracker di Firebase.`)) {
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

        const headers = lines[0].split(delimiter).map(h => h.trim());
        const sheetGames = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            if (values.length !== headers.length) {
                console.warn(`Riga ${i + 1} saltata: numero di colonne non corrispondente all'intestazione.`);
                continue;
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
        csvImportStatus.textContent = `Analizzati ${sheetGames.length} giochi. Salvataggio in corso su Firebase...`;

        try {
            const gamesCollectionRef = getGamesCollectionRef();
            if (!gamesCollectionRef) throw new Error("Utente non autenticato per l'importazione.");

            let importedCount = 0;
            const batch = writeBatch(window.firestore_db);

            for (const sheetGame of sheetGames) {
                let platforms = [];
                if (sheetGame.Piattaforma) {
                    platforms = sheetGame.Piattaforma.split(',').map(p => p.trim()).filter(p => p !== '');
                }

                const gameData = {
                    Titolo: sheetGame.Titolo || '',
                    Cover: sheetGame['Link copertina:'] || '', 
                    Stato: sheetGame.Stato || 'In Corso',
                    Piattaforma: platforms.length > 0 ? platforms : null,
                    OreDiGioco: sheetGame['Ore di gioco'] || '',
                    VotoTotale: sheetGame['Voto Totale'] ? parseInt(sheetGame['Voto Totale']) : null,
                    VotoAesthetic: sheetGame['Voto Aesthetic'] ? parseInt(sheetGame['Voto Aesthetic']) : null,
                    VotoOST: sheetGame['Voto OST'] ? parseInt(sheetGame['Voto OST']) : null,
                    VotoDifficolta: sheetGame['Difficoltà'] ? parseInt(sheetGame['Difficoltà']) : null, 
                    Recensione: sheetGame.Recensione || '',
                    PercentualeTrofei: sheetGame['% Trofei'] ? parseInt(sheetGame['% Trofei']) : null,
                    ReplayCompletati: sheetGame['Replay completati'] ? parseInt(sheetGame['Replay completati']) : null,
                    PrimaVoltaGiocato: sheetGame['Prima volta giocato'] || '',
                    UltimaVoltaFinito: sheetGame['Ultima volta finito'] || '',
                    Anno: sheetGame.Anno ? parseInt(sheetGame.Anno) : null,
                    Genere: sheetGame.Genere || '',
                    Costo: sheetGame.Costo ? parseFloat(sheetGame.Costo) : null,
                };

                if (gameData.Titolo) {
                    const newDocRef = doc(gamesCollectionRef);
                    batch.set(newDocRef, gameData);
                    importedCount++;
                }
            }

            await batch.commit();
            
            csvImportStatus.textContent = `Importazione completata! ${importedCount} giochi aggiunti a Firebase.`;
            alert(`Importazione completata! ${importedCount} giochi aggiunti.`);
            loadGames();

            // Nascondi gli elementi dopo l'importazione
            csvFileInput.style.display = 'none';
            startCsvImportBtn.style.display = 'none';
            csvImportStatus.style.display = 'none';

        } catch (firebaseError) {
            console.error("Errore nel salvataggio su Firebase:", firebaseError);
            csvImportStatus.textContent = `Errore di salvataggio: ${firebaseError.message}`;
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

// --- Funzione per Eliminare Tutti i Giochi (adattata per Firebase) ---
async function clearAllGames() {
    if (!currentUser) {
        alert("Devi essere loggato per eliminare tutti i giochi.");
        return;
    }

    if (!confirm("SEI SICURO DI VOLER ELIMINARE TUTTI I GIOCHI DAL TUO TRACKER DI FIREBASE?\nQuesta azione è irreversibile e non può essere annullata!")) {
        return;
    }

    try {
        const gamesCollectionRef = getGamesCollectionRef();
        if (!gamesCollectionRef) throw new Error("Utente non autenticato.");

        const querySnapshot = await getDocs(gamesCollectionRef);
        const batch = writeBatch(window.firestore_db);
        querySnapshot.docs.forEach((d) => {
            batch.delete(d.ref);
        });
        await batch.commit();

        console.log('Tutti i giochi sono stati eliminati da Firebase.');
        alert('Tutti i giochi sono stati eliminati con successo!');
        loadGames();
    } catch (error) {
        console.error('Errore durante l\'eliminazione di tutti i giochi da Firebase:', error);
        alert('Errore durante l\'eliminazione di tutti i giochi. Controlla la console per i dettagli.');
    }
}

// --- Gestione Autenticazione Firebase ---

// Funzione per il login con Google
async function signInWithGoogle() {
    const provider = new window.GoogleAuthProvider();
    try {
        await window.signInWithPopup(window.auth, provider);
    } catch (error) {
        console.error("Errore di accesso con Google:", error);
        alert("Errore durante l'accesso con Google: " + error.message);
    }
}

// Funzione per il logout
async function signOutUser() {
    try {
        await window.signOut(window.auth);
    } catch (error) {
        console.error("Errore durante il logout:", error);
        alert("Errore durante il logout: " + error.message);
    }
}

// Listener per lo stato di autenticazione
window.onAuthStateChanged(window.auth, (user) => {
    currentUser = user;
    if (user) {
        userStatus.textContent = `Loggato come: ${user.displayName || user.email}`;
        authButton.textContent = "Esci";
        authButton.onclick = signOutUser;
    } else {
        userStatus.textContent = "Non loggato";
        authButton.textContent = "Accedi con Google";
        authButton.onclick = signInWithGoogle;
    }
    loadGames();
});


// --- Event Listeners ---
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
// Rimosso: platformFilter.addEventListener('change', applyFilters); <-- Rimosso definitivamente
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

if (startCsvImportBtn) {
    startCsvImportBtn.addEventListener('click', importGamesFromCsvOrTsv);
}

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
