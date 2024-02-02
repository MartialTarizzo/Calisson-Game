/*
gamePlay.js

Ce fichier définit la mécanique du jeu du calisson

# Auteur : Martial Tarizzo
#
# Licence : CC BY-NC-SA 4.0 DEED
# https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr
*/


// Importation des grilles de jeu
import { enigme_3_1 } from '../grids/enigmes_3_1.js';
import { enigme_3_2 } from '../grids/enigmes_3_2.js';
import { enigme_3_3 } from '../grids/enigmes_3_3.js';
import { enigme_4_1 } from '../grids/enigmes_4_1.js';
import { enigme_4_2 } from '../grids/enigmes_4_2.js';
import { enigme_4_3 } from '../grids/enigmes_4_3.js';
import { enigme_5_1 } from '../grids/enigmes_5_1.js';
import { enigme_5_2 } from '../grids/enigmes_5_2.js';
import { enigme_5_3 } from '../grids/enigmes_5_3.js';
import { enigme_6_1 } from '../grids/enigmes_6_1.js';
import { enigme_6_2 } from '../grids/enigmes_6_2.js';
import { enigme_6_3 } from '../grids/enigmes_6_3.js';

/**
 * 
 * @param {int} taille 
 * la taille de la grille désirée, dans [0..4] pour les tailles réelles [3..6] 
 * @param {int} niveau 
 * le niveau des grilles dans [0..2] pour le niveau réel [1..3]
 * @returns
 * un tableau de chaînes, chaque chaîne codant une énigme
 */
function getEnigmes(taille, niveau) {
  let e = [
    [enigme_3_1, enigme_3_2, enigme_3_3],
    [enigme_4_1, enigme_4_2, enigme_4_3],
    [enigme_5_1, enigme_5_2, enigme_5_3],
    [enigme_6_1, enigme_6_2, enigme_6_3]
  ]
  let enigmes = e[taille][niveau].split("\n")
  enigmes.pop()
  return enigmes
}

/******************
 * les importations permettant de jouer une grille
 *****************/
import {
  start,
  reset,
  changemode,
  rafraichit,
  rafraichitlongueur,
  partage,
  messageok,
  abandonGrille,
  chronoarret,
  dessinerSolution
} from "./javascript.js";

/********
 * liaisons avec l'interface HTML
 */
btreset.onclick = reset;
btmode.onclick = changemode;
taille.onchange = rafraichit;
longueur.onchange = rafraichitlongueur;
btshare.onclick = partage;
btok.onclick = messageok;
btcancel.onclick = cancelGrid;

/**
 * Générateur de nombre aléatoire entier dans [0..max-1]
 * @param {int} max - borne supérieure
 * @returns - entier dans [0..max-1]
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Fonction de fabrication d'un générateur d'énigme
 * @returns 
 * la valeur de retour est une fonction nextEnig sans arguments qui agit comme un générateur.
 * les appels successifs à nextEnig fournissent une grille choisie aléatoirement et ayant des
 * niveaux croissants de 3.1 à 6.3 :
 * 3.1, 3.2, 3.3, 4.1, 4.2, ... , 6.1, 6.2, 6.3, 6.3, 6.3 , ... 
 * 
 */
function mkGenEnigme() {
  let taille = 0
  let niveau = 0

  function nextEnig() {
    // choix au hasard d'une énigme dans la taille et le niveau courants
    let enigs = getEnigmes(taille, niveau)
    let i = getRandomInt(enigs.length)
    let enig = enigs[i]
    // incrémentation du couple taille/niveau : 0/0 -> 3/2 (grilles 3/1 -> 6/3)
    if (niveau == 2) {
      if (taille < 3) {
        taille++;
        niveau = 0
      }
    }
    else { niveau++ }

    // déf de currentEnig et valeur retournée
    currentEnig = enig;
    return enig
  }

  return nextEnig
}

/***
 * Variables globales
 * Sauf initialisation explicite, ces variables doivent être initialisées à chaque début de partie
 */
// Le générateur d'énigme
let genEnigme;

// l'énigme en cours
let currentEnig;

// Le score total de la partie en cours
let totalScore = 0;

// le score permettant une bonification en temps
let scoreBonif;
// l'incrément de score permettant une bonification en temps
let incScoreBonif;

// La bonification en temps
let timeBonif;

// La durée du jeu
let maxTime;
// Le timer du jeu
let gameTimer;

/**
 * fonction appelée quand le joueur clique sur le bouton d'abandon
 * - affiche la solution pendant une durée fixée et lance la fonction 
 *   de callback avec un score nul (cf abandonGrille dans le fichier de résolution)
 * - retranche 100 pts au score (si possible)
 */
function cancelGrid() {
  abandonGrille();
  totalScore = Math.max(0, totalScore - 100)
}

/**
 * fonction de chrométrage du jeu
 * Mise à jour l'affichage du temps restant et déclenchement de l'arrête de la partie 
 * si le temps imparti est écoulé
 */
function decompteTemps() {
  maxTime--
  //  console.log(maxTime)
  if (maxTime < 0) {
    clearInterval(gameTimer)
    chronoarret()
    dessinerSolution()
    setTimeout(endGame, 0)
  }
  else {
    document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
  }
}

/**
 * Fin de partie
 */
function endGame() {
  let msg = '- Limite de temps atteinte -<br> <strong>Score final = ' + totalScore + "</strong>"
  let modal = document.getElementById("modalEndGame");
  let parMsg = document.getElementById("pEndGameMessage");
  parMsg.innerHTML = msg
  modal.style.display = "block";

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
      beginGame()
    }
  }
}

/**
 * fonction de callback en cas de succès de la résolution d'une grille
 * @param {int} score 
 * - mets à jour le scoree du joueur
 * - relance l'interface de résolution sur une nouvelle grille
 */
function restart(score) {
  totalScore += score;
  document.getElementById('score').innerHTML = 'Score total : ' + totalScore;

  if (totalScore > scoreBonif) {
    scoreBonif += incScoreBonif
    maxTime += timeBonif
  }

  (score > 0) ? start(genEnigme(), restart) : start(currentEnig, restart)
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
  maxTime = 10 * 60
  document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
  totalScore = 0
  scoreBonif = 400
  incScoreBonif = 400
  timeBonif = 120   // 2 mniutes de plus !
  document.getElementById('score').innerHTML = ''
  genEnigme = mkGenEnigme();
  let enig = genEnigme()
  gameTimer = setInterval(decompteTemps, 1000)
  start(enig, restart)
}

// lancement du jeu au chargement de la page HTML
//beginGame()

