import { enigme_3_1 } from './enigmes_3_1.js';
import { enigme_3_2 } from './enigmes_3_2.js';
import { enigme_3_3 } from './enigmes_3_3.js';
import { enigme_4_1 } from './enigmes_4_1.js';
import { enigme_4_2 } from './enigmes_4_2.js';
import { enigme_4_3 } from './enigmes_4_3.js';
import { enigme_5_1 } from './enigmes_5_1.js';
import { enigme_5_2 } from './enigmes_5_2.js';
import { enigme_5_3 } from './enigmes_5_3.js';
import { enigme_6_1 } from './enigmes_6_1.js';
import { enigme_6_2 } from './enigmes_6_2.js';
import { enigme_6_3 } from './enigmes_6_3.js';

import { playGrid } from './playgrid.js';

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
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function playOneGrid() {
  let taille = getRandomInt(3)
  let niveau = getRandomInt(3)
  let enigs = getEnigmes(taille, niveau)
  let i = getRandomInt(enigs.length)
  document.getElementById("spTaille").innerText = taille+3
  document.getElementById("spNiveau").innerText = niveau+1

  playGrid(enigs[i])
}