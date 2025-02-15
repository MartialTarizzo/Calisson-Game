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
  // Calcul des stats pour un niveau
  // retourne un objet contenant les résultats des calculs 
  // ou undefined si pas de grilles jouées dans ce niveau
  calcLevelStats(lvl) {
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
      /* l'objet retourné par la fonction */
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

  // calcul des stats pour tous les niveaux
  // regroupe dans un objet indexé par les niveaux
  calcAllStats() {
    let r = {}
    for (let k in this.scoresByLevel) {
      let s = this.calcLevelStats(k)
      if (s != undefined) {
        r[k] = this.calcLevelStats(k)
      }
    }
    return r
  },

  // Calcul de la chaîne HTML permettant d'afficher le récapitulatif 
  // à la fin de l'entraînement
  statsHTML() {
    let langue = localStorage.getItem("langue");
    if (langue == null) { langue = 'fr' }

    let stats = this.calcAllStats()
    let s = ""  /* valeur de retour */
    let slvl    /* chaîne par niveau */
    let data    /* données stat d'un niveau */
    let ng      /* nbre de grilles du niveau */

    for (let lvl in stats) {
      let ss = stats[lvl]
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

    // si s="", c'est qu'aucune partie n'a été jouée ...
    // on retourne la chaîne vide
    if (s.length == 0) {
      return s
    }

    // MAJ des stats cumulées
    let trainingStats = localStorage.getItem("trainingStats")
    let cumulStats = trainingStats ? JSON.parse(trainingStats) : {}

    for (let lvl in stats) {
      let data = stats[lvl]
      let ngd = data.nb_grids
      let asd = data.avg_score
      let atd = data.avg_time
      let cumulData = {}
      let ngc = 0 // suffixe 'c' pour les grandeurs cumulées, affectées ci-dessous
      let asc = 0
      let atc = 0

      if (lvl in cumulStats) {
        cumulData = cumulStats[lvl]
        ngc = cumulData.nb_grids
        asc = cumulData.avg_score
        atc = cumulData.avg_time
      }
      // MAJ des valeurs cumulées
      cumulData.nb_grids = ngc + ngd
      cumulData.avg_score = (ngd * asd + ngc * asc) / (ngd + ngc)
      cumulData.avg_time = (ngd * atd + ngc * atc) / (ngd + ngc)

      cumulStats[lvl] = cumulData
    }
    // sauvegarde des stats dans le stockage local
    localStorage.setItem('trainingStats', JSON.stringify(cumulStats))

    // code HTML de la mise en forme du tableau récapitulatif des stats 
    switch (langue) {
      case 'fr':
        s += "<table> <caption> Récapitulatif </caption> \
        <thead> <tr>\
            <th scope='col'>Niveau</th> <th scope='col'>Grilles jouées</th>\
            <th scope='col'>Score moyen</th> <th scope='col'>durée</th>\
          </tr> </thead>\
        <tbody>"
        break
      case 'en':
        s += "<table> <caption> Summary </caption> \
        <thead> <tr>\
            <th scope='col'>Level</th> <th scope='col'>Played grids</th>\
            <th scope='col'>Average Score</th> <th scope='col'>time</th>\
          </tr> </thead>\
        <tbody>"
        break
    }
    for (let lvl in cumulStats) { // remplissage du tableau
      let slvl = lvl[0] + '.' + lvl[1]
      let data = cumulStats[lvl]
      s += `<tr> <th scope='row'>${slvl}</th> <td>${data.nb_grids}</td>\
     <td>${data.avg_score.toFixed(0)}</td> <td>${data.avg_time.toFixed(1)}</td> </tr>`
    }
    s += "</tbody>  </table >"
    // fin du code HTML du tableau

    return s
  }
}

function genEnigme() {
  let niveau = document.getElementById('selNiveau').value
  let enigs = enigmes[niveau]
  enigs = enigs.split("\n")
  enigs.pop() /* retrait de la dernière ligne qui vaut "" */

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
 */
function cancelGrid() {
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
 * - enregistre le score/durée pour les stats
 * - relance l'interface de résolution sur une nouvelle grille
 */
function restart(objScore) {
  // délai avant l'animation du score
  let scoreDelayInStorage = localStorage.getItem('scoreDelay')
  let scoreDelay = scoreDelayInStorage ? scoreDelayInStorage : 0
  let delai = 1000 * scoreDelay

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
    }, 2400 + delai)    // compatible (car >=) avec la durée de l'animation de popupEndGrid
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

/**
 * affiche le dialogue modal des stats en fin d'entraînement
 * @param {string} msg 
 */
function showStatistics(msg) {
  let modalEndGame = document.getElementById("modalStatistics");
  let parMsg = document.getElementById("pStats");
  parMsg.innerHTML = msg;
  modalEndGame.style.display = "block";
}

// btNewGame est le bouton de fermeture du dialogue des stats
document.getElementById('btNewGame').onclick = returnToHome

/**
 * affichage de l'animation final et retour à la page d'index
 */
function returnToHome() {
  // retrait du dialogue de stats ...
  let modalEndGame = document.getElementById("modalStatistics");
  modalEndGame.style.display = "";

  // et affichage de l'animation finale ...
  let modalEndGrid = document.getElementById("modalWait");
  modalEndGrid.style.display = "block"

  // retour à l'index 
  setTimeout(() =>
    window.location.replace(homePageUrl()), 400)
}

// imgHome est l'image de la maison en haut à gauche
document.getElementById('imgHome').onclick = goHome

// script associé au bouton de RAZ des stats
document.getElementById('btRazStats').onclick = function (event) {
  localStorage.removeItem('trainingStats');
  returnToHome()
}
/**
 * retour à la page d'index, avec affichage des stats si nécessaire
 */
function goHome() {
  chronoarret()
  let msg = scoresAndTimes.statsHTML()
  if (msg.length > 0) {
    showStatistics(msg)
  } else {
    returnToHome()
  }
}

/**
 * calcul de l'url de la page d'index
 * @returns l'url dépendant de la langue courante
 */
function homePageUrl() {
  let langue = localStorage.getItem("langue");

  if (langue == null || langue == 'fr') {
    return `./index.html`
  }
  else {
    return `./index.${langue}.html`
  }
}

/**
 * dictionnaire pour la gestion des langues
 */
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
    pEndGameMessage: "<strong>Moyenne</strong> [Min &rarr; Max]",
    btRazStats: "Effacement des statistiques"
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
    pEndGameMessage: "<strong>Average</strong> [Min &rarr; Max]",
    btRazStats: "Clear statistics"
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

