/*
gamePlay_training.js

Ce fichier définit la mécanique du jeu du calisson en mode entraînement

# Auteur : Martial Tarizzo
#
# Licence : CC BY-NC-SA 4.0 DEED
# https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr
*/

// Importation des grilles de jeu
import { enigme_3_1 } from '../grids-training/enigmes_3_1.js';
import { enigme_3_2 } from '../grids-training/enigmes_3_2.js';
import { enigme_3_3 } from '../grids-training/enigmes_3_3.js';
import { enigme_4_1 } from '../grids-training/enigmes_4_1.js';
import { enigme_4_2 } from '../grids-training/enigmes_4_2.js';
import { enigme_4_3 } from '../grids-training/enigmes_4_3.js';
import { enigme_5_1 } from '../grids-training/enigmes_5_1.js';
import { enigme_5_2 } from '../grids-training/enigmes_5_2.js';
import { enigme_5_3 } from '../grids-training/enigmes_5_3.js';
import { enigme_6_1 } from '../grids-training/enigmes_6_1.js';
import { enigme_6_2 } from '../grids-training/enigmes_6_2.js';
import { enigme_6_3 } from '../grids-training/enigmes_6_3.js';

/******************
 * les importations permettant de jouer une grille
 *****************/
import {
  start,
  back,
  reset,
  abandonGrille,
  chronoarret
} from "./playCalisson.js";

/***
 * Variables globales
 * Sauf initialisation explicite, ces variables doivent être initialisées à chaque début de partie
 */

// l'énigme en cours
let currentEnig = { taille: 0, niveau: 0, tab: "" }

/********
 * liaisons avec l'interface HTML
 */
btback.onclick = back;
btreset.onclick = reset;
btcancel.onclick = cancelGrid;

let enigmes = {
  "31": enigme_3_1,
  "32": enigme_3_2,
  "33": enigme_3_3,
  "41": enigme_4_1,
  "42": enigme_4_2,
  "43": enigme_4_3,
  "51": enigme_5_1,
  "52": enigme_5_2,
  "53": enigme_5_3,
  "61": enigme_6_1,
  "62": enigme_6_2,
  "63": enigme_6_3
}

/** Générateur de nombre aléatoire entier dans [0..max-1]
 * @param {int} max - borne supérieure
 * @returns - entier dans [0..max-1]
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Deux variables globales pour le tirage des énigmes :
// pour éviter une répétition trop proche du tirage au sort des énigmes,
//  on range dans une file les énigmes proposées pour le niveau en cours.
// Cette file fileEnigmes de taille maximale maxFileEnigmes conserve les index
// des énigmes tirées

let maxFileEnigmes = 20
let fileIdxEnigmes = []

// Pour les stats de fin de session d'entraînement, l'objet suivant
// permet de garder un historique des scores et des durées de chaque
// grille jouée
let scoresAndTimes = {
  // chaque tableau associée au niveau contient une liste d'objets
  // {score, durée} pour la grille jouée
  scoresByLevel: {
    "31": [],
    "32": [],
    "33": [],
    "41": [],
    "42": [],
    "43": [],
    "51": [],
    "52": [],
    "53": [],
    "61": [],
    "62": [],
    "63": [],
  },
  // initialisation de scoresByLevel
  initScores() {
    for (let k in this.scoresByLevel) {
      this.scoresByLevel[k] = []
    }
  },
  // méthode d'ajout d'un score et d'une durée pour une grille
  addScore(lvl, score, time) {
    this.scoresByLevel[lvl].push(
      {
        score: score,
        time: time
      }
    )
  },
  // Calcul de la moyenne des scores et des durées pour un niveau
  // retourne un objet {avg_score, avg_time}
  calcMeans(lvl) {
    let scores = this.scoresByLevel[lvl];
    if (scores.length > 0) {
      let tots = 0
      let mins = Number.MAX_SAFE_INTEGER
      let maxs = 0
      let mint = Number.MAX_SAFE_INTEGER
      let maxt = 0
      let tott = 0
      let n = 0
      for (let { score, time } of scores) {
        tots += score
        tott += time
        n += 1
        if (score < mins) { mins = score }
        if (score > maxs) { maxs = score }
        if (time < mint) { mint = time }
        if (time > maxt) { maxt = time }
      }
      return {
        nb_grids: n,
        avg_score: (tots / n).toFixed(2),
        avg_time: (tott / n).toFixed(2),
        min_score: mins,
        max_score: maxs,
        min_time: mint,
        max_time: maxt,
      }
    }
    else {
      return undefined
    }

  },

  calcAllMeans() {
    let r = {}
    for (let k in this.scoresByLevel) {
      r[k] = this.calcMeans(k)
    }
    return r
  },

  statsHTML() {
    let langue = localStorage.getItem("langue");
    if (langue == null) { langue = 'fr' }

    let stats = this.calcAllMeans()
    let s = ""
    let slvl
    let data
    let ng
    for (let lvl in stats) {
      let ss = stats[lvl]
      if (ss != undefined) {
        slvl = lvl[0] + '.' + lvl[1]
        data = stats[lvl]
        ng = data.nb_grids
        switch (langue) {
          case 'fr':
            if (ng == 1) {
              s += "<span  style='margin-left: 0em;color:green;'><strong>Niveau " + slvl + ` : ${data.nb_grids} grille </strong></span><br>`
              s += "<span  style='margin-left: 2em;color:blue;'>score &rarr;   " + `<strong>${data.avg_score}</strong>` + " pts</span><br>"
              s += "<span  style='margin-left: 2em;color:red;'>durée &rarr;   " + `<strong>${data.avg_time}</strong>` + " s</span><br><br>"

            }
            else {
              s += "<span  style='margin-left: 0em;color:green;'><strong>Niveau " + slvl + ` : ${data.nb_grids} grilles </strong></span><br>`
              s += "<span  style='margin-left: 2em;color:blue;'>score :  " + `<strong>${data.avg_score}</strong> [${data.min_score} &rarr; ${data.max_score}]` + " pts</span><br>"
              s += "<span  style='margin-left: 2em;color:red;'>durée :  " + `<strong>${data.avg_time}</strong> [${data.min_time} &rarr; ${data.max_time}]` + " s</span><br><br>"

            }
            break
          case 'en':
            if (ng == 1) {
              s += "<span  style='margin-left: 0em;color:green;'><strong>Level " + slvl + ` : ${data.nb_grids} grid </strong></span><br>`
              s += "<span  style='margin-left: 2em;color:blue;'>score &rarr;   " + `<strong>${data.avg_score}</strong>` + " pts</span><br>"
              s += "<span  style='margin-left: 2em;color:red;'>time &rarr;   " + `<strong>${data.avg_time}</strong>` + " s</span><br><br>"

            }
            else {
              s += "<span  style='margin-left: 0em;color:green;'><strong>Level " + slvl + ` : ${data.nb_grids} grids </strong></span><br>`
              s += "<span  style='margin-left: 2em;color:blue;'>score :  " + `<strong>${data.avg_score}</strong> [${data.min_score} &rarr; ${data.max_score}]` + " pts</span><br>"
              s += "<span  style='margin-left: 2em;color:red;'>time :  " + `<strong>${data.avg_time}</strong> [${data.min_time} &rarr; ${data.max_time}]` + " s</span><br><br>"

            }
            break
        }

      }
    }
    return s
  }
}

function genEnigme() {
  let niveau = document.getElementById('selNiveau').value
  let enigs = enigmes[niveau]
  enigs = enigs.split("\n")
  enigs.pop()

  // tirage d'un index qui n'est pas dans fileIdxEnigmes
  let i
  do { i = getRandomInt(enigs.length) } while (fileIdxEnigmes.includes(i))
  // enfilage de l'index
  fileIdxEnigmes.push(i)
  // retrait du premier index si la taille max est atteinte
  if (fileIdxEnigmes.length > maxFileEnigmes) {
    fileIdxEnigmes.shift()
  }
  // récupération de l'énigme et affectation à la variable globale currentEnig
  currentEnig = { taille: niveau[0], niveau: niveau[1], tab: enigs[i] }
}


/** fonction d'abandon
 * fonction appelée quand le joueur clique sur le bouton d'abandon
 * - affiche la solution pendant une durée fixée et lance la fonction 
 *   de callback avec un score nul (cf abandonGrille dans le fichier de résolution)
 * - retranche 60 s au temps (si possible)
 */
function cancelGrid() {

  // clearInterval(gameTimer)
  abandonGrille();
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
 * - affiche le popup de score
 * - relance l'interface de résolution sur une nouvelle grille
 */
function restart(objScore) {

  function displaypopupEndGrid() {
    // calcul du facteur de zoom
    function calcZoomFactor() {
      let screenH = window.innerHeight
      let screenW = window.innerWidth

      let popupW = getComputedStyle(document.getElementById('popupEndGrid')).width
      popupW = Number(popupW.match(/[0-9]+/g)[0])
      let popupH = getComputedStyle(document.getElementById('popupEndGrid')).height
      popupH = Number(popupH.match(/[0-9]+/g)[0])

      return 0.8 * Math.min(screenW / popupW, screenH / popupH)
    }

    // pour empêcher des clicks parasite pendant l'affichage du score (ça perturbait tout ...)
    let modalEndGrid = document.getElementById("modalEndGrid");
    modalEndGrid.style.display = "block"

    document.getElementById('pScoreFinal').innerHTML = 'Score : ' + score
    // l'animation suivante dure 2400 ms
    $('#popupEndGrid')
      .animate({
        'zoom': 1
      }, 0)
      .fadeIn(1000)
      .animate({
        'zoom': calcZoomFactor()
      }, 1000)
      .fadeOut(400)
      .animate({
        'zoom': 1
      }, 0);
  }

  let score = objScore.score
  if (score > 0) {
    scoresAndTimes.addScore(
      objScore.taille + objScore.niveau,
      score,
      objScore.chronofin)
    displaypopupEndGrid()

    setTimeout(() => {
      genEnigme()
      chronoarret()

      modalEndGrid.style.display = "none"

      start(currentEnig, restart, setLang)
    }, 2400)    // compatible (car >=) avec la durée de l'animation de popupEndGrid
  }
  else {
    chronoarret()
    setTimeout(() => start(currentEnig, restart, setLang), 0)
  }
}


/**
 * La fonction de lancement du jeu
 * appelée au chargement de la page et à chaque changement de niveau
 * 
 * - définitions des variables globales et des timers
 * - appel de la fonction start de l'interface de résolution, en lui fournissant
 *   la fonction 'callback' restart qui sera appelée en cas de réussite de la grille.
 *   Cette fonction restart appelant elle-même start, elle est responsable de la boucle
 *   de jeu ( <=> propositions des grilles successives)
 *   
 */
export function beginGame() {
  fileIdxEnigmes = []
  genEnigme()
  chronoarret()
  // scoresAndTimes.initScores()
  start(currentEnig, restart, setLang)
}

function showStatistics(msg) {
  let modalEndGame = document.getElementById("modalStatistics");
  let parMsg = document.getElementById("pStats");
  parMsg.innerHTML = msg;
  modalEndGame.style.display = "block";
}

document.getElementById('btNewGame').onclick = returnToHome

function goHome() {
  // clearInterval(gameTimer)
  chronoarret()
  let msg = scoresAndTimes.statsHTML()
  if (msg.length > 0) {
    showStatistics(msg)
  } else {
    returnToHome()
  }
}

function returnToHome() {
  let modalEndGame = document.getElementById("modalStatistics");
  modalEndGame.style.display = "";
  // verrouillage de l'interface ...
  let modalEndGrid = document.getElementById("modalWait");
  modalEndGrid.style.display = "block"
  setTimeout(() =>
    window.location.replace(homePageUrl()), 400)
}

document.getElementById('imgHome').onclick = goHome

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
    etiqFooter: "Entraînement au jeu du Calisson",
    etiqRetour: "Retour à l'accueil",
    mode_arete: "mode Arête",
    mode_losange: "mode Losange",
    modalEndGameTitle: "Statistiques de l'entraînement",
    pEndGameMessage: "<strong>Moyenne</strong> [Min &rarr; Max]"
  },
  "en": {
    btcancel: "Abort",
    etiqNiveau: "Level: ",
    etiqChrono: "Chrono:",
    etiqFooter: "Calisson Game Training",
    etiqRetour: "Return to Home Screen",
    mode_arete: "Edge mode",
    mode_losange: "Diamond mode",
    modalEndGameTitle: "Training statistics",
    pEndGameMessage: "<strong>Average</strong> [Min &rarr; Max]"
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

