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

btreset.onclick = reset;
btmode.onclick = changemode;
taille.onchange = rafraichit;
longueur.onchange = rafraichitlongueur;
btshare.onclick = partage;
btok.onclick = messageok;
btcancel.onclick = cancelGrid;

let totalScore = 0;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function cancelGrid() {
  abandonGrille();
  totalScore = Math.max(0, totalScore - 100)
}

function mkGenEnigme() {
  let taille = 0
  let niveau = 0

  function nextEnig() {
    let enigs = getEnigmes(taille, niveau)
    let i = getRandomInt(enigs.length)
    let enig = enigs[i]
    if (niveau == 2) {
      if (taille < 3) {
        taille++;
        niveau = 0
      }
    }
    else { niveau++ }
    return enig
  }

  return nextEnig
}

let genEnigme;

let maxTime;
let gameTimer;

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

function endGame() {
  let msg = 'Limite de temps atteinte ! Score final = ' + totalScore
  alert(msg)
  beginGame()
}

function restart(score) {
  totalScore += score;
  document.getElementById('score').innerHTML = 'Score total : ' + totalScore;

  let enig = genEnigme()

  start(enig, restart)
}

function beginGame() {
  maxTime = 10 * 60
  document.getElementById('spTempsRestant').innerHTML = maxTime + " s"
  totalScore = 0
  document.getElementById('score').innerHTML = ''
  genEnigme = mkGenEnigme();
  let enig = genEnigme()
  gameTimer = setInterval(decompteTemps, 1000)
  start(enig, restart)
}

beginGame()

