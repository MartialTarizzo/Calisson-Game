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
} from "./javascript.js";

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

/********
 * liaisons avec l'interface HTML
 */
btreset.onclick = reset;
btmode.onclick = changemode;
btcancel.onclick = cancelGrid;

/** pour retourner la liste des énigmes d'une taille et d'un niveau donnés
 * 
 * @param {int} taille 
 * la taille de la grille désirée, dans [0..3] pour les tailles réelles [3..6] 
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
  let taille = 0
  let niveau = 0

  function nextEnig() {
    // choix au hasard d'une énigme dans la taille et le niveau courants
    let enigs = getEnigmes(taille, niveau)
    let i = getRandomInt(enigs.length)
    let r = {
      taille: taille + 3,
      niveau: niveau + 1,
      tab: enigs[i]
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
    dessinerSolution()
    setTimeout(endGame, 0)
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
    
    // le nombre total d'arêtes placées
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

      msg = `
    Durée de la partie : <strong>${dureePartie} s</strong><br>
    Dernier niveau résolu : <strong>${niveauMax}</strong><br>
    <strong>${listObjScore.length}</strong> grilles trouvées en <strong>${totalCumulTime} s</strong><br>
    Durée moyenne par grille : <strong>${durMoyenneGrille.toFixed(1)} s</strong><br>
    <hr>
    Temps perdu (Reset, Abandon, dernière grille inachevée) : <strong> ${tempsPerdu} s</strong><br>
    Nombre d'arêtes correctes placées : <strong>${totalAretes}</strong><br>
    Durée moyenne par arête correcte : <strong>${durMoyenneArete.toFixed(1)} s</strong><br>
    Nombre total de losange utilisés : <strong>${totalLosanges}</strong><br>
    Nombre d'abandons : <strong>${nbAbandons}</strong>
    `
    } else {
      msg = "Aucune grille résolue ..."
    }
    return msg
  }

  const bestScoreInStorage = localStorage.getItem('bestScore')
  const bestScore = bestScoreInStorage ? JSON.parse(bestScoreInStorage) : 0
  const endDate = Date.now()

  document.getElementById('btNewGame').onclick = function (event) {
    modal.style.display = "none";
    beginGame()
  }
  document.getElementById('btRazStats').onclick = function (event) {
    localStorage.removeItem('bestScore');
    modal.style.display = "none";
    beginGame()
  }

  let parStats = document.getElementById('pStats')
  parStats.innerHTML = calcMsgStats()


  let msg = '- Limite de temps atteinte -<br> <strong>Score final = <span style="color: red">' + totalScore + " pts</span></strong>"

  if (totalScore > bestScore) {
    msg += '<br><strong>C\'est votre meilleur score !</strong>'
    localStorage.setItem('bestScore', JSON.stringify(totalScore))
  }
  else {
    msg += '<br><strong>Le score à battre est toujours de <br><span style="color: red">' + bestScore + ' pts</span></strong>'
  }

  let modal = document.getElementById("modalEndGame");
  let parMsg = document.getElementById("pEndGameMessage");
  parMsg.innerHTML = msg
  modal.style.display = "block";
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
    objScore['dateEndGrid'] = Date.now()
    listObjScore.push(objScore)
    displaypopupEndGrid()
    setTimeout(() => {
      totalScore += score;
      if (totalScore >= scoreBonif) {
        scoreBonif += incScoreBonif
        maxTime += timeBonif
      }
      document.getElementById('score').innerHTML = 'Score total : ' + totalScore;
      genEnigme()
      start(currentEnig, restart)
    }, 1000)
  }
  else {
    nbAbandons += 1
    if (maxTime > 0) {
      gameTimer = setInterval(decompteTemps, 1000)
      start(currentEnig, restart)
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
  scoreBonif = 500
  incScoreBonif = 500
  timeBonif = 60   // 1 minute de plus !
  timePenalite = 60
  document.getElementById('score').innerHTML = ''
  genEnigme = mkGenEnigme();
  genEnigme()
  gameTimer = setInterval(decompteTemps, 1000)
  startDate = Date.now()
  start(currentEnig, restart)
}

