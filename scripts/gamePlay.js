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
// taille.onchange = rafraichit;
// longueur.onchange = rafraichitlongueur;
// btshare.onclick = partage;
// btok.onclick = messageok;
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
 * La valeur de retour de la fonction nextEnig est un objet contenant 
 * trois champs : taille (3..6), niveau (1..3) et enigme (chaîne représentant l'énigme)
 */
function mkGenEnigme() {
  let taille = 0
  let niveau = 0

  function nextEnig() {
    // choix au hasard d'une énigme dans la taille et le niveau courants
    let enigs = getEnigmes(taille, niveau)
    let i = getRandomInt(enigs.length)
    let r = {
      taille : taille + 3, 
      niveau : niveau + 1, 
      enigme : enigs[i]
    }
    // incrémentation du couple taille/niveau : 0/0 -> 3/2 (grilles 3/1 -> 6/3)
    if (niveau == 2) {
      if (taille < 3) {
        taille++;
        niveau = 0
      }
    }
    else { niveau++ }

    // déf de currentEnig et valeur retournée
    currentEnig = r;
    // MAJ affichage
    document.getElementById('spLevel').innerHTML = currentEnig.taille + '.' + currentEnig.niveau
    return r
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
let totalScore;

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

/**
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

/**
 * fonction de chrométrage du jeu
 * Mise à jour l'affichage du temps restant et déclenchement de l'arrête de la partie 
 * si le temps imparti est écoulé
 */
function decompteTemps() {
  maxTime--
  //  console.log(maxTime)
  if (maxTime <= 0) {
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

  const bestScoreInStorage = localStorage.getItem('bestScore')
  const bestScore = bestScoreInStorage ? JSON.parse(bestScoreInStorage) : 0

  let msg = '- Limite de temps atteinte -<br> <strong>Score final = ' + totalScore + " pts</strong>"

  if (totalScore > bestScore) {
    msg += '<br><strong>C\'est votre meilleur score !</strong>'
    localStorage.setItem('bestScore', JSON.stringify(totalScore))
  }
  else {
    msg += '<br><strong>Le score à battre est toujours de ' + bestScore + ' pts</strong>'
  }


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

  function displaypopupEndGrid() {
    document.getElementById('pScoreFinal').innerHTML = 'Score : ' + score
    $('#popupEndGrid').css('display', 'flex').animate({
      'zoom': 1
    }, 10).fadeIn(10).animate({
      'zoom': 3
    }, 1000).fadeOut(400).animate({
      'zoom': 1
    }, 100);
  }

  if (score > 0) {
    displaypopupEndGrid()
    setTimeout(() => {
      totalScore += score;
      if (totalScore >= scoreBonif) {
        scoreBonif += incScoreBonif
        maxTime += timeBonif
      }
      document.getElementById('score').innerHTML = 'Score total : ' + totalScore;
      genEnigme()
      start(currentEnig.enigme, restart)
    }, 1000)
  }
  else {
    if (maxTime > 0) {
      gameTimer = setInterval(decompteTemps, 1000)
      start(currentEnig.enigme, restart)
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
  totalScore = 0
  scoreBonif = 500
  incScoreBonif = 500
  timeBonif = 60   // 1 minute de plus !
  timePenalite = 60
  document.getElementById('score').innerHTML = ''
  genEnigme = mkGenEnigme();
  genEnigme()
  gameTimer = setInterval(decompteTemps, 1000)
  start(currentEnig.enigme, restart)
}

// lancement du jeu au chargement de la page HTML
//beginGame()

