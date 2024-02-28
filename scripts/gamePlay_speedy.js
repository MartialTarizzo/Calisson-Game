/*
gamePlay.js

Ce fichier définit la mécanique du jeu du calisson

# Auteur : Martial Tarizzo
#
# Licence : CC BY-NC-SA 4.0 DEED
# https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr
*/

// Importation des grilles de jeu
import { enigme_3_1 } from '../grids-speedy/enigmes_3_1.js';
import { enigme_3_2 } from '../grids-speedy/enigmes_3_2.js';
import { enigme_3_3 } from '../grids-speedy/enigmes_3_3.js';
import { enigme_4_1 } from '../grids-speedy/enigmes_4_1.js';
import { enigme_4_2 } from '../grids-speedy/enigmes_4_2.js';
import { enigme_4_3 } from '../grids-speedy/enigmes_4_3.js';
import { enigme_5_1 } from '../grids-speedy/enigmes_5_1.js';
import { enigme_5_2 } from '../grids-speedy/enigmes_5_2.js';
import { enigme_5_3 } from '../grids-speedy/enigmes_5_3.js';
import { enigme_6_1 } from '../grids-speedy/enigmes_6_1.js';
import { enigme_6_2 } from '../grids-speedy/enigmes_6_2.js';
import { enigme_6_3 } from '../grids-speedy/enigmes_6_3.js';

/******************
 * les importations permettant de jouer une grille
 *****************/
import {
  start,
  reset,
  changemode,
  abandonGrille,
  chronoarret,
  dessinerSolution,
  calcBonus
} from "./playCalisson.js";

/***
 * Variables globales
 * Sauf initialisation explicite, ces variables doivent être initialisées à chaque début de partie
 */
// Le générateur d'énigme
let genEnigme;

// l'énigme en cours
let currentEnig;

// Le score total de la partie en cours
let totalScore;

// le nombre d'abandons
let nbAbandons;

// le score permettant une bonification en temps
let scoreBonif;
// l'incrément de score permettant une bonification en temps
let incScoreBonif;

// La bonification en temps
let timeBonif;
// La pénalité en temps
let timePenalite;

// La durée du jeu
let maxTime;
// Le timer du jeu
let gameTimer;

// la date depart de la partie
let startDate;

let listObjScore = []

//le bonus pour la dernière grille inachevée
let bonus = 0

/********
 * liaisons avec l'interface HTML
 */
btreset.onclick = reset;
btmode.onclick = (() => changemode(langStrings));
btcancel.onclick = cancelGrid;

/** pour retourner la liste des énigmes d'une taille et d'un niveau donnés
 * 
 * @param {int} idx_taille 
 * la taille de la grille désirée, dans [0..3] pour les tailles réelles [3..6] 
 * @param {int} idx_niveau 
 * le niveau des grilles dans [0..2] pour le niveau réel [1..3]
 * @returns
 * un tableau de chaînes, chaque chaîne codant une énigme
 */
function getEnigmes(idx_taille, idx_niveau) {
  let e = [
    [enigme_3_1, enigme_3_2, enigme_3_3],
    [enigme_4_1, enigme_4_2, enigme_4_3],
    [enigme_5_1, enigme_5_2, enigme_5_3],
    [enigme_6_1, enigme_6_2, enigme_6_3]
  ]
  let enigmes = e[idx_taille][idx_niveau].split("\n")
  enigmes.pop()
  return enigmes
}

/** Générateur de nombre aléatoire entier dans [0..max-1]
 * @param {int} max - borne supérieure
 * @returns - entier dans [0..max-1]
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/** Fonction de fabrication d'un générateur d'énigme
 * @returns 
 * la valeur de retour est une fonction nextEnig sans arguments qui agit comme un générateur.
 * 
 * les appels successifs à nextEnig fournissent une grille choisie aléatoirement et ayant des
 * niveaux croissants de 3.1 à 6.3 :
 * 3.1, 3.2, 3.3, 4.1, 4.2, ... , 6.1, 6.2, 6.3, 6.3, 6.3 , ... 
 * La valeur de retour de la fonction nextEnig est un objet contenant 
 * trois champs : taille (3..6), niveau (1..3) et enigme (chaîne représentant l'énigme)
 * effet de bord : la variable globale currentEnig contient la dernière énigme générée 
 */
function mkGenEnigme() {
  // index de la taille et du niveau
  // décalage de 3 pour la taille et de 1 pour le niveau / aux valeurs vraies
  let idx_taille = 0
  let idx_niveau = 0
  let idx_taille_max = 3
  let idx_niveau_max = 2

  // pour éviter une répétition trop proche du tirage au sort des énigmes de niveau 6.3,
  //  on range dans une file les index énigmes proposées pour ce niveau.
  // Cette file fileEnigmes est de taille maximale maxFileEnigmes  
  let maxFileEnigmes = 20
  let fileIdxEnigmes = []

  function nextEnig() {
    // choix au hasard d'une énigme dans la taille et le niveau courants
    let enigs = getEnigmes(idx_taille, idx_niveau)

    // l'index de l'énigme qui sera proposée
    let i

    if (idx_taille == idx_taille_max && idx_niveau == idx_niveau_max) {
      // il faut éviter une répétition trop proche des mêmes énigmes

      // tirage au sort d'un nouvel index non présent dans les derniers tirages
      do { i = getRandomInt(enigs.length) } while (fileIdxEnigmes.includes(i))

      // enfilage de l'index
      fileIdxEnigmes.push(i)

      // retrait du premier index si la taille max est atteinte
      if (fileIdxEnigmes.length > maxFileEnigmes) {
        fileIdxEnigmes.shift()
      }

    } else {
      // dans les niveaux intermédiaires, une seule énigme est tirée au hasard
      // pour chaque couple taille/niveau
      // pas besoin de tester si elle a déjà été proposée dans cette partie !
      i = getRandomInt(enigs.length)
    }

    let r = {
      taille: idx_taille + 3,
      niveau: idx_niveau + 1,
      tab: enigs[i]
    }
    // incrémentation du couple taille/niveau : 0/0 -> 3/2 (grilles 3/1 -> 6/3)
    if (idx_niveau == 2) {
      if (idx_taille < 3) {
        idx_taille++;
        idx_niveau = 0
      }
    }
    else { idx_niveau++ }

    // déf de currentEnig et valeur retournée
    currentEnig = r;
    // MAJ affichage
    document.getElementById('spLevel').innerHTML = currentEnig.taille + '.' + currentEnig.niveau
    return r
  }

  return nextEnig
}


/** fonction d'abandon
 * fonction appelée quand le joueur clique sur le bouton d'abandon
 * - affiche la solution pendant une durée fixée et lance la fonction 
 *   de callback avec un score nul (cf abandonGrille dans le fichier de résolution)
 * - retranche 60 s au temps (si possible)
 */
function cancelGrid() {

  clearInterval(gameTimer)
  abandonGrille();
  maxTime = Math.max(0, maxTime - timePenalite)
  document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
}

/** Chronométrage du jeu
 * Mise à jour l'affichage du temps restant et déclenchement de l'arrêt de la partie 
 * si le temps imparti est écoulé
 */
function decompteTemps() {
  maxTime--
  //  console.log(maxTime)
  if (maxTime <= 0) {
    clearInterval(gameTimer)
    chronoarret()
    bonus = calcBonus()
    // affichage temporaire de la solution de la grille inachevée
    // pendant la durée définie dans la fonction abandonGrille
    abandonGrille()
    // dialogue de fin de partie, différé d'une durée compatible 
    // avec la précédente
    setTimeout(endGame, 1900)
  }
  else {
    document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
  }
}

/** Fin de partie
 * - calcul du message  et affichage dans le popup modal de fin de partie
 */
function endGame() {

  function calcMsgStats() {
    // la durée totale de la partie
    let dureePartie = Math.floor((endDate - startDate) / 1000)

    // la somme des durées effectives de résolution 
    // C'est la somme des chronos des grilles résolues, ne tient donc pas compte 
    // du temps perdu lors des Reset, Abandon, et de la dernière grille inachevée
    let totalResTime

    // la durée cumulée de résolution : durée totale de résolution des grilles achevées
    // elle comprend donc le temps perdu par reset et abandon, mais pas
    // la dernière grille inachevée
    let totalCumulTime

    // le nombre total d'arêtes placées (grilles résolues)
    let totalAretes
    // idem pour les losanges
    let totalLosanges
    // le message d'infos sur les perfs qui sera affiché
    let msg

    if (listObjScore.length > 0) {
      let lastScore = listObjScore[listObjScore.length - 1]
      let niveauMax = lastScore.taille + "." + lastScore.niveau

      totalCumulTime = Math.floor((lastScore['dateEndGrid'] - startDate) / 1000)

      totalResTime = 0
      totalAretes = 0
      totalLosanges = 0
      for (let os of listObjScore) {
        totalResTime += os.chronofin
        totalAretes += os.nbAretesJoueur
        totalLosanges += os.nbLosanges
      }
      let durMoyenneGrille = totalCumulTime / listObjScore.length
      let durMoyenneArete = totalAretes / totalCumulTime

      // temps perdu (Reset, Abandon, dernière grille inachevée)
      let tempsPerdu = (totalCumulTime - totalResTime) +
        Math.floor((endDate - lastScore['dateEndGrid']) / 1000)

      msg = format(langStrings["msgStats"], {
        dureePartie: dureePartie,
        niveauMax: niveauMax,
        nbSolvedGrids: listObjScore.length,
        totalCumulTime: totalCumulTime,
        durMoyenneGrille: durMoyenneGrille.toFixed(1),
        tempsPerdu: tempsPerdu,
        bonus: bonus,
        totalAretes: totalAretes,
        durMoyenneArete: durMoyenneArete.toFixed(1),
        totalLosanges: totalLosanges,
        nbAbandons: nbAbandons
      })
    } else {
      msg = langStrings["msgNoGridSolved"]
    }
    return msg
  }

  const bestScoreInStorage = localStorage.getItem('bestScore')
  const bestScore = bestScoreInStorage ? JSON.parse(bestScoreInStorage) : 0
  const endDate = Date.now()

  document.getElementById('btNewGame').onclick = function (event) {
    modalEndGame.style.display = "none";
    beginGame()
  }
  document.getElementById('btRazStats').onclick = function (event) {
    localStorage.removeItem('bestScore');
    modalEndGame.style.display = "none";
    beginGame()
  }

  let parStats = document.getElementById('pStats')
  parStats.innerHTML = calcMsgStats()

  let scoreFinal = totalScore + bonus

  let msg = format(langStrings["headerEndGame_1"], {scoreFinal: scoreFinal})

  if (scoreFinal > bestScore) {
    msg += langStrings["headerEndGame_2"]

    localStorage.setItem('bestScore', JSON.stringify(scoreFinal))
  }
  else {
    msg += format(langStrings["headerEndGame_3"], {bestScore: bestScore})
  }

  let modalEndGame = document.getElementById("modalEndGame");
  let parMsg = document.getElementById("pEndGameMessage");
  parMsg.innerHTML = msg
  modalEndGame.style.display = "block";
}

/**
 * fonction de callback en cas de succès de la résolution d'une grille
 * @param objScore
 * objet contenant au moins un champ score (entier)
 * - Si le score est nul, le joueur a abandonné la résolution
 * 
 * - Si le score est non nul, on a aussi les champs suivants :
  taille: taille de l'énigme,
  niveau: niveau de l'énigme,
  nbAretesJoueur: nbr d'arêtes placées par le joueur,
  nbLosanges: nombre de losanges utilisés,
  chronofin: durée de la résolution,
  score: score final obtenu
 * Tout ça doit permettre de faire des stats intéressantes ... 

 * La fonction
 * - ajoute dans l'objet score la date de fin de grille (champ dateEndGrid)
 * - met à jour listObjScore
 * - affiche le popup de score
 * - met à jour le score du joueur
 * - relance l'interface de résolution sur une nouvelle grille
 */
function restart(objScore) {

  function displaypopupEndGrid() {
    // pour empêcher des clicks parasite pendant l'affichage du score (ça perturbait tout ...)
    let modalEndGrid = document.getElementById("modalEndGrid");
    modalEndGrid.style.display = "block"

    document.getElementById('pScoreFinal').innerHTML = 'Score : ' + score
    // l'animation suivante dure 0+20+1000+400+0 = 1420 ms
    $('#popupEndGrid').css('display', 'flex').animate({
      'zoom': 1
    }, 0).fadeIn(10).animate({
      'zoom': 4
    }, 1000).fadeOut(400)
      .animate({
        'zoom': 1
      }, 0);
  }

  let score = objScore.score
  if (score > 0) {
    objScore['dateEndGrid'] = Date.now()
    listObjScore.push(objScore)
    displaypopupEndGrid()
    // on relance une nouvelle grille avec un délai compatible avec
    // la durée de l'animation du score
    setTimeout(() => {
      totalScore += score;
      if (totalScore >= scoreBonif) {
        scoreBonif += incScoreBonif
        maxTime += timeBonif
      }
      document.getElementById('valScore').innerHTML = totalScore;
      genEnigme()

      modalEndGrid.style.display = "none"

      start(currentEnig, restart, setLang)
    }, 1000)
  }
  else {
    nbAbandons += 1
    if (maxTime > 0) {
      gameTimer = setInterval(decompteTemps, 1000)
      setTimeout(() => {
        start(currentEnig, restart, setLang)
      }
        , 0)
    }
    else {
      endGame()
    }
  }
}


/**
 * La fonction de lancement du jeu
 * - définitions des variables globales et des timers
 * - appel de la fonction start de l'interface de résolution, en lui fournissant
 *   la fonction 'callback' restart qui sera appelée en cas de réussite de la grille.
 *   Cette fonction restart appelant elle-même start, elle est responsable de la boucle
 *   de jeu ( <=> propositions des grilles successives)
 *   
 */
export function beginGame() {
  maxTime = 5 * 60
  document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
  listObjScore = []
  nbAbandons = 0
  totalScore = 0
  bonus = 0
  scoreBonif = 500
  incScoreBonif = 500
  timeBonif = 60   // 1 minute de plus !
  timePenalite = 60
  document.getElementById('valScore').innerHTML = '0'
  genEnigme = mkGenEnigme();
  genEnigme()
  gameTimer = setInterval(decompteTemps, 1000)
  startDate = Date.now()
  start(currentEnig, restart, setLang)
}

function goHome() {
  clearInterval(gameTimer)
  chronoarret()
  // verrouillage de l'interface ...
  let modalEndGrid = document.getElementById("modalWait");
  modalEndGrid.style.display = "block"
  setTimeout(() =>
    window.location.replace(homePageUrl()), 400)
}
document.getElementById('imgHome').onclick = goHome



/*** Utilitaire de formatage de chaîne
 * Usage :
 * format("i can speak {language} since i was {age}",{language:'javascript',age:10});
 * format("i can speak {0} since i was {1}",'javascript',10});
 */

let format = function (str, col) {
  col = typeof col === 'object' ? col : Array.prototype.slice.call(arguments, 1);

  return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return col[n];
  });
};


function homePageUrl() {
  let langue = localStorage.getItem("langue");

  if (langue == null || langue == 'fr') {
    return `./index.html`
  }
  else {
    return `./index.${langue}.html`
  }
}

let dico = {
  "fr": {
    btcancel: "Abandon",
    btmode: "mode arête",
    etiqNiveau: "Niveau : ",
    etiqChrono: "Chrono :",
    etiqFooter: "Speedy Calisson",
    etiqRetour: "Retour à l'accueil",
    mode_arete: "mode Arête",
    mode_losange: "mode Losange",
    etiqTempsRestant: "Temps restant :",
    etiqScore: "Score total : ",
    modalEndGameTitle: "Partie terminée",
    btRazStats: "Effacement du score à battre<br>et nouvelle partie",
    btNewGame: "Nouvelle partie",
    msgStats: `
    Durée de la partie : <strong>{dureePartie} s</strong><br>
    Dernier niveau résolu : <strong>{niveauMax}</strong><br>
    <strong>{nbSolvedGrids}</strong> grilles trouvées en <strong>{totalCumulTime} s</strong><br>
    Durée moyenne par grille : <strong>{durMoyenneGrille} s</strong><br>
    <hr>
    Temps perdu (Reset, Abandon, dernière grille inachevée) : <strong> {tempsPerdu} s</strong><br>
    Bonus de dernière tentative : <strong>{bonus} pts </strong><br>
    Nombre d'arêtes correctes placées : <strong>{totalAretes}</strong><br>
    Durée moyenne par arête correcte : <strong>{durMoyenneArete} s</strong><br>
    Nombre total de losange utilisés : <strong>{totalLosanges}</strong><br>
    Nombre d'abandons : <strong>{nbAbandons}</strong>
    `,
    msgNoGridSolved: "Aucune grille résolue ...",
    headerEndGame_1: `- Limite de temps atteinte -<br>
     <strong>Score final = 
     <span style="color: red">{scoreFinal} pts</span>
     </strong>`,
    headerEndGame_2: '<br><strong>C\'est votre meilleur score !</strong>',
    headerEndGame_3: `<br><strong>Le score à battre est toujours de <br>
     <span style="color: red">{bestScore} pts</span></strong>`,
  },
  "en": {
    btcancel: "Abort",
    btmode: "Edge mode",
    etiqNiveau: "Level: ",
    etiqChrono: "Chrono:",
    etiqFooter: "Speedy Calisson",
    etiqRetour: "Return to Home Screen",
    mode_arete: "Edge mode",
    mode_losange: "Diamond mode",
    etiqTempsRestant: "Time left:",
    etiqScore: "Total score: ",
    modalEndGameTitle: "Game Over",
    btRazStats: "Erase the best score<br>and play again",
    btNewGame: "Play again",
    msgStats: `
    Length of Game: <strong>{dureePartie} s</strong><br>
    Last level solved: <strong>{niveauMax}</strong><br>
    <strong>{nbSolvedGrids}</strong> grids found in <strong>{totalCumulTime} s</strong><br>
    Average time per grid: <strong>{durMoyenneGrille} s</strong><br>
    <hr>
    Lost time (Reset, Abort, last unfinished grid): <strong> {tempsPerdu} s</strong><br>
    Last attempt bonus: <strong>{bonus} pts </strong><br>
    Number of correct edges placed: <strong>{totalAretes}</strong><br>
    Average time per correct edge: <strong>{durMoyenneArete} s</strong><br>
    Total number of Diamonds used: <strong>{totalLosanges}</strong><br>
    Number of abandonments: <strong>{nbAbandons}</strong>
    `,
    msgNoGridSolved: "No grid solved ...",
    headerEndGame_1: `- Time limit reached -<br>
    <strong>Final Score = 
    <span style="color: red">{scoreFinal} pts</span>
    </strong>`,
   headerEndGame_2: '<br><strong>This is your best score!</strong>',
   headerEndGame_3: `<br><strong>The score to beat is still <br>
    <span style="color: red">{bestScore} pts</span></strong>`,
  }
}

let langStrings;

export function setLang() {
  let langue = localStorage.getItem("langue");

  if (langue == null) { langue = 'fr' }

  langStrings = dico[langue]

  let trads = dico[langue];
  for (const [k, v] of Object.entries(trads)) {
    try {
      document.getElementById(k).innerHTML = v;
    } catch (err) { }
  }

}