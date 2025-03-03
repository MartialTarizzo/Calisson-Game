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
  back,
  reset,
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

// La taille maxi des grilles, conservée dans le localStorage
let maxGridSizeInStorage = localStorage.getItem('maxGridSize')
let maxGridSize = maxGridSizeInStorage ? Number(maxGridSizeInStorage) : 6

// Le coeff multiplicatif du score, lié à la taille maxi de grille
// Ces valeurs proviennent d'une étude statistique du nombre d'arêtes
// à placer par l'utilisateur selon le niveau de la grille :
// en passant de 3.1 -> 6.3, le nombre moyen d'arêtes à placer évolue comme suit 
// 12.4, 17.46, 21.90,   21.38, 29.7, 37.9,   33.8, 46.3, 59.9,   48.68, 65.04, 83.72
// On suppose que le temps mis pour résoudre une grille dépend linéairement de ce nombre.
// Pour que la durée de la partie soit approx. la même quellle que soit la taille maxi de
// grille, on multipliera le score calculé pour une taille max de 6 par le coeff suivant

let coeffGridSize = (new Map([[4, 37 / 83], [5, 60 / 83], [6, 1]])).get(maxGridSize)

/********
 * liaisons avec l'interface HTML
 */
btback.onclick = back;
btreset.onclick = reset;
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
function mkGenEnigme(idx_taille_max = 3) {
  // index de la taille et du niveau
  // décalage de 3 pour la taille et de 1 pour le niveau / aux valeurs vraies
  let idx_taille = 0
  let idx_niveau = 0
  // let idx_taille_max = 3
  let idx_niveau_max = 2

  // pour éviter une répétition trop proche du tirage au sort des énigmes de niveau 6.3,
  //  on range dans une file les index énigmes proposées pour ce niveau.
  // Cette file fileEnigmes est de taille maximale maxFileEnigmes  
  let maxFileEnigmes = 30
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
      if (idx_taille < idx_taille_max) {
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
  updateProgressBar()
}

/**
 * Mise à jour de la barre de progression du temps restant
 * la barre en pied de page voit sa longueur diminuer pendant la dernière minute du jeu
 */
function updateProgressBar() {
  let pb = document.getElementById("timeprogressbar")
  // p = pourcentage de temps restant pendant la dernière minute
  let p = (Math.min(maxTime, 300) / 3)

  // MAJ de la longueur de la barre
  pb.style.width = `calc(${p}% - 2px)`
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
    document.getElementById('spTempsRestant').innerHTML = "0 s"
    bonus = calcBonus()
    // affichage temporaire de la solution de la grille inachevée
    // pendant la durée définie dans la fonction abandonGrille
    abandonGrille()
    // La fonction abandonGrille appelle la fonction de callback restart
    // qui se chargera de l'affichage du dialogue de fin de partie
  }
  else {
    document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
    updateProgressBar()
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
      let durMoyenneGrille = totalResTime / listObjScore.length
      let durMoyenneArete = totalAretes / totalResTime

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

  const endDate = Date.now()

  // fonctions associées aux boutons de la fenête popup
  document.getElementById('btNewGame').onclick = function (event) {
    modalEndGame.style.display = "none";
    beginGame()
  }
  document.getElementById('btRazStats').onclick = function (event) {
    localStorage.removeItem('bestScore');
    localStorage.removeItem('bestScores');
    modalEndGame.style.display = "none";
    beginGame()
  }

  // Calcul du score final de la partie
  let scoreFinal = totalScore + bonus

  // récupération du meilleur score dans le storage
  const bestScoreInStorage = localStorage.getItem('bestScore')
  const bestScore = bestScoreInStorage ? JSON.parse(bestScoreInStorage) : 0
  // idem pour le tableau des meilleurs scores
  const bestScoresInStorage = localStorage.getItem('bestScores')
  let bestScores = bestScoresInStorage ? JSON.parse(bestScoresInStorage) : []

  // début de fabrication du message pour le score de la partie en cours
  let msg = format(langStrings["headerEndGame_1"], { scoreFinal: scoreFinal })

  // message additionnel du score en cours
  if (scoreFinal > bestScore) {
    msg += langStrings["headerEndGame_2"]
    localStorage.setItem('bestScore', JSON.stringify(scoreFinal))
  }
  else if (scoreFinal > (bestScores[bestScores.length - 1] ?? 0)) {
    msg += langStrings["headerEndGame_4"]
  }

  // affichage du message
  let parMsg = document.getElementById("pEndGameMessage");
  parMsg.innerHTML = msg

  // message des stats de la partie en cours
  let parStats = document.getElementById('pStats')
  parStats.innerHTML = calcMsgStats()

  // mise à jour du tableau des meilleurs scores :
  // ajout du best score si > 0
  if (bestScore > 0) { bestScores.push(bestScore) }
  // on ajoute le score courant si > 0
  if (scoreFinal > 0) { bestScores.push(scoreFinal) }
  // élimination des doublons en passant par un set
  let setScores = new Set()
  for (let s of bestScores) {
    setScores.add(s)
  }
  bestScores = Array.from(setScores)
  // tri en ordre décroissant, on garde les 6 premiers
  bestScores.sort((a, b) => b - a)
  bestScores = bestScores.slice(0, 6)
  // on sauve tout ça dans le storage local
  localStorage.setItem('bestScores', JSON.stringify(bestScores))
  // affichage des meilleurs scores
  if (bestScores.length > 1) {
    document.getElementById('bestScoresDiv').style.display = ""
    let strBestScores = bestScores.toString().replaceAll(',', ' - ')
    document.getElementById('bestScores').innerText = strBestScores

  } else {
    document.getElementById('bestScoresDiv').style.display = "none"
  }

  // affichage du popup de fin de partie
  let modalEndGame = document.getElementById("modalEndGame");
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
  // délai avant l'animation du score
  let scoreDelayInStorage = localStorage.getItem('scoreDelay')
  let scoreDelay = scoreDelayInStorage ? scoreDelayInStorage : 0
  let delai = 1000 * scoreDelay

  // affichage du popup d'affichage du score à la fin de chaque grille
  // durée de l'animation 2400 ms
  function displaypopupEndGrid() {
    // calcul de la hauteur du popup et du facteur de zoom
    // retourne une liste des deux valeurs correspondantes
    function calcZoomFactor() {
      let screenH = window.innerHeight
      let screenW = window.innerWidth

      let popupW = getComputedStyle(document.getElementById('popupEndGrid')).width
      popupW = Number(popupW.match(/[0-9]+/g)[0])
      let popupH = getComputedStyle(document.getElementById('popupEndGrid')).height
      popupH = Number(popupH.match(/[0-9]+/g)[0])

      return [popupH, 0.8 * Math.min(screenW / popupW, screenH / popupH)]
    }
    let zf = calcZoomFactor()

    // pour empêcher des clicks parasite pendant l'affichage du score (ça perturbait tout ...)
    let modalEndGrid = document.getElementById("modalEndGrid");
    modalEndGrid.style.display = "block"

    // Nettoyage de toute sélection parasite dans la popup
    document.getSelection().empty()
    document.getElementById('pScoreFinal').innerHTML = 'Score : ' + score

    // l'animation suivante dure 2400 + delai (en ms)
    $('#popupEndGrid')
      .stop(true, true)
      .delay(delai)
      .css('transform', 'translate(0px) scale(0)')
      .fadeIn(400)
      .animate({ transform: 1 },
        {
          duration: 1000,
          easing: 'swing',
          step: function (now, fx) {
            $(this).css('transform',
              "translate(0," + (window.innerHeight - zf[0]) / 2 * now +
              "px) scale(" + zf[1] * now + ")")
          }
        })
      .delay(400)
      .fadeOut(600)
  }

  // Affichage des confettis/bonus à chaque incrément de temps de jeu
  // L'animation dure 3s
  function displayBonus() {
    // animation du bonus, durée de 3s
    $('#divBonus')
      .fadeIn(1000)
      .delay(1000)
      .fadeOut(1000);
    confetti.start();
    setTimeout(() => confetti.stop(), 2000);
  }

  let score = objScore.score
  if (score > 0) {  // score non nul => grille résolue
    let popupDuration = 2400 // durée d'affichage du popup
    let bonusDuration = 0   // durée d'affichage du bonus éventuel

    // Arrêt du décompte de temps de la partie
    clearInterval(gameTimer)

    // on tient compte de la taille max des grilles pour ajuster le score
    score = Math.ceil(score * coeffGridSize)
    // on réduit le score si le total est déjà très important
    // pour s'assurer que la partie se terminera
    if (totalScore > 25000) {
      score = Math.ceil(score * 25000 / totalScore)
    }
    // MAJ du score
    objScore.score = score

    objScore['dateEndGrid'] = Date.now()
    listObjScore.push(objScore)
    displaypopupEndGrid()

    let timeBonus = timeBonif *
      (Math.floor((totalScore + score) / incScoreBonif) -
        Math.floor(totalScore / incScoreBonif))
    totalScore += score;

    if (timeBonus > 0) {
      // + 1 à la fin pour être certain de ne pas pénaliser le joueur
      // De plus, quand la dernière grille était validée dans la dernière seconde
      // ça provoquait un comportement incorrect (fin de partie alors que ce n'éest pas le cas)
      maxTime += timeBonus + 1

      document.getElementById("spTimeBonif").innerText = timeBonus
      bonusDuration = 3000
      // L'affichage des confettis pour le bonus démarre 600 ms avant la fin 
      // de l'affichage du score (au début du fadeout du score)
      setTimeout(displayBonus, popupDuration + delai - 600)
    }

    // MAJ des éléments d'information dans l'interface du joueur
    // se fait pendant l'affichage du popup de fin de grille
    setTimeout(() => {
      // le score total
      document.getElementById('valScore').innerHTML = totalScore;
      // affichage du badge de nombre de bonus si nécessaire
      if (totalScore > incScoreBonif) {
        document.getElementById('badge').style.display = 'flex'
        document.getElementById('badge-number').innerText = Math.floor(totalScore / incScoreBonif)
      }
      // affichage temps restant
      document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
    },
      delai + 1200) // 1200 = moitié du temps d'affichage du popup de fin de grille

    // on relance une nouvelle grille avec un délai compatible avec
    // la durée de l'animation du score (et du bonus éventuel)
    // L'affichage de la nouvelle grille se fait 600 ms (cf infra) avant la fin des confettis
    setTimeout(() => {
      genEnigme()
      modalEndGrid.style.display = "none"
      gameTimer = setInterval(decompteTemps, 1000)
      start(currentEnig, restart, setLang)
    }, bonusDuration == 0 ? popupDuration + delai : popupDuration + delai + bonusDuration - 600)
  }
  else {  // score nul => grille abandonnée
    if (maxTime > 0) {
      nbAbandons += 1
      gameTimer = setInterval(decompteTemps, 1000)
      setTimeout(() => {
        start(currentEnig, restart, setLang)
      }, 0)
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
  updateProgressBar()
  listObjScore = []
  nbAbandons = 0
  totalScore = 0
  bonus = 0
  incScoreBonif = 500
  timeBonif = 60   // 1 minute de plus !
  timePenalite = 60
  document.getElementById('badge').style.display = 'none'
  document.getElementById('valScore').innerHTML = '0'
  genEnigme = mkGenEnigme(maxGridSize - 3);
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
    etiqNiveau: "Niveau : ",
    etiqChrono: "Chrono :",
    etiqFooter: "Speedy Calisson",
    etiqRetour: "Retour à l'accueil",
    mode_arete: "mode Arête",
    mode_losange: "mode Losange",
    etiqTempsRestant: "Temps restant :",
    etiqScore: "Score total : ",
    modalEndGameTitle: "Partie terminée",
    btRazStats: "Effacement des scores<br>et nouvelle partie",
    btNewGame: "Nouvelle partie",
    bestScoresCaption: "Meilleurs scores",
    msgStats: `
    <p style="font-size:1.5em; text-align:center;">
    <strong>{nbSolvedGrids}</strong> grilles trouvées en <strong>{totalCumulTime}&nbsp;s</strong><br>
    Derniere grille résolue (taille.niveau)&nbsp;:&nbsp;<strong>{niveauMax}</strong><br>
    Durée moyenne par grille&nbsp;: <strong>{durMoyenneGrille}&nbsp;s</strong><br>
    </p>
    <hr>
    Durée de la partie : <strong>{dureePartie}&nbsp;s</strong><br>
    Bonus de dernière tentative : <strong>{bonus}&nbsp;pts </strong><br>
    Nombre d'arêtes correctes placées : <strong>{totalAretes}</strong><br>
    Durée moyenne par arête correcte : <strong>{durMoyenneArete}&nbsp;s</strong><br>
    Nombre total de losange utilisés : <strong>{totalLosanges}</strong><br>
    Nombre d'abandons : <strong>{nbAbandons}</strong>
    `,
    msgNoGridSolved: "Aucune grille résolue ...",
    headerEndGame_1: `- Limite de temps atteinte -<br>
     <strong>Score final = 
     <span style="color: red">{scoreFinal} pts</span>
     </strong>`,
    headerEndGame_2: '<br><strong>C\'est votre meilleur score !</strong>',
    headerEndGame_4: '<br>C\'est un des meilleurs scores !'
  },
  "en": {
    btcancel: "Abort",
    etiqNiveau: "Level: ",
    etiqChrono: "Chrono:",
    etiqFooter: "Speedy Calisson",
    etiqRetour: "Return to Home Screen",
    mode_arete: "Edge mode",
    mode_losange: "Diamond mode",
    etiqTempsRestant: "Time left:",
    etiqScore: "Total score: ",
    modalEndGameTitle: "Game Over",
    btRazStats: "Erase the scores<br>and play again",
    btNewGame: "Play again",
    bestScoresCaption: "Best scores",
    msgStats: `
    <p style="font-size:1.5em; text-align:center;">
    <strong>{nbSolvedGrids}</strong> grids found in <strong>{totalCumulTime}&nbsp;s</strong><br>
    Last grid solved (size.level): <strong>{niveauMax}</strong><br>
    Average time per grid: <strong>{durMoyenneGrille}&nbsp;s</strong><br>
    </p>
    <hr>
    Length of Game: <strong>{dureePartie}&nbsp;s</strong><br>
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
    headerEndGame_4: '<br>It\'s one of the best scores !'
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