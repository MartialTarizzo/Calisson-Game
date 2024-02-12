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
  chronoarret,
  dessinerSolution
} from "./playCalisson.js";

/***
 * Variables globales
 * Sauf initialisation explicite, ces variables doivent être initialisées à chaque début de partie
 */

// l'énigme en cours
let currentEnig = {taille: 0, niveau: 0, tab: ""}

// Le score total de la partie en cours
// let totalScore;

// le nombre d'abandons
// let nbAbandons;

/********
 * liaisons avec l'interface HTML
 */
btreset.onclick = reset;
btmode.onclick = changemode;
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
  "61":enigme_6_1,
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


function genEnigme () {
  let niveau = document.getElementById('selNiveau').value
  let enigs = enigmes[niveau]
  enigs =enigs.split("\n")
  enigs.pop()

  // tirage d'une énigme différente de l'énigme courante
  let newEnig
  do {
    newEnig = {taille: niveau[0], niveau: niveau[1], tab: enigs[getRandomInt(enigs.length)]}
  } while (currentEnig.tab == newEnig.tab) 
  
  currentEnig = newEnig
  return currentEnig
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
 * - ajoute dans l'objet score la date de fin de grille (champ dateEndGrid)
 * - met à jour listObjScore
 * - affiche le popup de score
 * - met à jour le score du joueur
 * - relance l'interface de résolution sur une nouvelle grille
 */
function restart(objScore) {

  function displaypopupEndGrid() {
    document.getElementById('pScoreFinal').innerHTML = 'Score : ' + score
    $('#popupEndGrid').css('display', 'flex').animate({
      'zoom': 1
    }, 10).fadeIn(10).animate({
      'zoom': 4
    }, 1000).fadeOut(400).animate({
      'zoom': 1
    }, 100);
  }
  let score = objScore.score
  if (score > 0) {
    displaypopupEndGrid()

    setTimeout(() => {
      genEnigme()
      chronoarret()
      start(currentEnig, restart)
    }, 1000)
  }
  else {
      chronoarret()
      start(currentEnig, restart)
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
  genEnigme()
  chronoarret()
  start(currentEnig, restart)
}
