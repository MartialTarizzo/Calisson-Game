/*
gamePlay.js

Ce fichier définit la mécanique du jeu du calisson

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
  reset,
  changemode,
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
btreset.onclick = reset;
btmode.onclick = (() => changemode(langStrings));
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
  start(currentEnig, restart, setLang)
}
function goHome() {
  // clearInterval(gameTimer)
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
    etiqFooter: "Entraînement au jeu du Calisson",
    etiqRetour: "Retour à l'accueil",
    mode_arete: "mode Arête",
    mode_losange: "mode Losange"
  },
  "en": {
    btcancel: "Abort",
    btmode: "Edge mode",
    etiqNiveau: "Level: ",
    etiqChrono: "Chrono:",
    etiqFooter: "Calisson Game Training",
    etiqRetour: "Return to Home Screen",
    mode_arete: "Edge mode",
    mode_losange: "Diamond mode"
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

