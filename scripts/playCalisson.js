/* 
playCalisson.js pour la page HTML permettant de jouer au jeu de Calisson
*/
// TODO : nettoyer ce fichier de tout ce qui ne sert plus à rien (résidus de la version d'origine)

////////////////////////////////////////////////////
// Réglage de l'interface et initialisations diverses
////////////////////////////////////////////////////
// Les variables globales
// voir les commentaires dans la fonction init
let taille, longueur, marge, mode, v1x, v1y, v2x, v2y, v3x, v3y, centrex, centrey;
let jeuPossible;
let tabsegment, tabmilieu, solution;
let historique;
let modejeu;
let solutionpresente;
let nblosangeutilise;
let chrono;
let dateDebutResolution;
let chronointerval;
let is_touch_device;
let canvas, context;


let currentEnigme;

// l'index du dernier segment survolé par le curseur (pointeur souris)
// Pour ne dessiner la grille que si nécessaire lors du déplacement
// du curseur
let lastCursorIndex = -1


// les largeurs des tracés
let dashLineWidth = 1
let gridLineWidth = 3
let borderLineWidth = 4

// les couleurs
let borderColor = "black"
let enigmaEdgeColor = "black"
let userEdgeColor = "blue"
let leftDiamodColor = "#ffe32e40"
let horizDiamodColor = "#2eb3ff40"
let rightDiamondColor = "#ff2e2e40"
let dotEdgeColor = "black"
let dotFillColor = "white"
let dotHoverColor = "black"
let undoDotColor = "red"

// réglage de l'interface sur un écran tactile 
try {
    document.createEvent("TouchEvent");
    is_touch_device = true;
} catch (e) {
    is_touch_device = false;
}


// pour empêcher le clignotement du canvas lors d'un toucher sur le canvas (interface tactile)
document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });

document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });

function init() {
    marge = 5;
    mode = "mode_arete";
    drawModeButtonsBorders()
    // document.getElementById("btmode").innerHTML = "Mode arête";

    // valeurs utilisées pour le calcul des coordonnées des points/segments
    v1x = -Math.sqrt(3) * longueur / 2
    v1y = longueur / 2;
    v2x = 0;
    v2y = longueur;
    v3x = Math.sqrt(3) * longueur / 2
    v3y = longueur / 2;
    centrex = Math.sqrt(3) / 2 * longueur * taille + marge
    centrey = marge;

    // définit le type d'interaction avec le jeu 
    // true -> on peut modifier la grille
    // false -> grille non modifiable, on peut téléverser la solution trouvée, etc.
    // vestige du script initial permettant de créer les grilles à la main
    // ne sert plus maintenant que lors de l'affichage lors de l'abandon

    jeuPossible = true;

    // on cache le bouton de téléchargement de la solution
    // document.getElementById('terminedl').style.display = "none";

    // Les 3 tableaux de travail, unidimentionnels
    // pour les arêtes, contient des [[xa,ya],[xb,yb]], coord des extrémités des segments
    tabsegment = []

    /****************************************************
     tabmilieu est Le tableau fondamental, contenant la plus grande partie des infos sur la grille
     ce tableau contient des tableaux de la forme [x, y, traceSegment, typeLosange, affichelosange]
    
    - x, y : coordonnées du milieu de l'arête
    - traceSegment : valeur parmi (true, false, 'bloquee', 'solution')
        true -> segment présent tracé en noir avec point médian pour modification
        false -> segment absent tracé en pointillés avec point médian pour modification
        bloquee -> segment de l'énigme, tracé en noir et non modifiable
        solution -> tracé en rouge, permet de définir la solution de l'énigme lors de la conception de la grille
      En mode jeu, seules les trois première valeurs sont utilisées.
    - typeLosange : valeur parmi ('gauche', 'hori', 'droite') en fonction de l'orientation du losange
    - afficheLosange : booléen définissant l'affichage ou non du losange
    *****************************************************/
    tabmilieu = []

    // solution contient true, false ou "bloquee"
    // "bloquee" -> arête fixée non modifiable. Fait partie de la solution 
    //      <=> arête de l'énigme toujours affichée dans la page web
    //  true -> arête de la solution, non affichée pendant le jeu (ça serait trop facile !)
    // false -> arête ne faisant pas partie de la solution
    solution = [];

    // la pile de gestion de l'historique, permettant le retour en arrière
    // lors de la résolution
    historique = []

    // modejeu est un drapeau permettant de savoir si on est mode jeu ou design
    modejeu = false;
    // la chaine contenue dans l'url contient-elle la solution ?
    solutionpresente = false;

    // différents compteurs
    nblosangeutilise = 0;
    chrono = 0;
    dateDebutResolution = Date.now()
    chronointerval;

    // le numéro de la grille si présent à la fin de l'url
    // numerogrille = '';

}

if (is_touch_device) {
    // document.getElementById('btmode').style.display = '';
    document.getElementById("butEdge").style.display = '';
    document.getElementById("butDiamond").style.display = '';
} else {
    // document.getElementById('btmode').style.display = 'none';
    document.getElementById("butEdge").style.display = 'none';
    document.getElementById("butDiamond").style.display = 'none';
}

// variables permettant les dessins dans la page du navigateur
// canvas principal 
canvas = document.getElementById('canvas');
if (!canvas) {
    alert("Impossible de récupérer le canvas");
}
// et son contexte
context = canvas.getContext('2d');
if (!context) {
    alert("Impossible de récupérer le context du canvas");
}

if (canvas.getAttribute('listenerYetAdded') !== 'true') {
    canvas.setAttribute('listenerYetAdded', 'true');
    canvas.addEventListener('pointerdown', function (evt) {
        ajouterenleversegment(evt)
    }, false);

    canvas.addEventListener('pointermove', function (evt) {
        curseur(evt)
    }, false);
    canvas.addEventListener('pointerout', function (evt) {
        lastCursorIndex = -1;
        dessinerlafigure()
    }, false);
}
// empêche l'affichage du menu contextuel en cas de clic-droit sur la figure
canvas.oncontextmenu = function (event) {
    event.preventDefault();
}
window.onresize = () => { setZoomFactor(); rafraichitlongueur() }

/** fonction retournant la taille des points dessinés au mileu des arêtes */
function calcTaillePoint() {
    return longueur / 15
}

/** le point de coordonnées (x, y) dans le canvas est-il assez proche du point d'indice i dans tabmileu ? */
function curseurProcheMilieu(x, y, i) {
    return ((x - tabmilieu[i][0]) ** 2 + (y - tabmilieu[i][1]) ** 2 < (longueur / 4) ** 2)
}

// effacement de la zone de jeu
function clearCanvas() {
    context.beginPath();
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.closePath();
}

// remet tout dans l'état de départ et dessine la figure
function rafraichit() {
    canvas.width = Math.sqrt(3) * taille * longueur + 2 * marge;
    canvas.height = taille * longueur * 2 + 2 * marge;

    v1x = -Math.sqrt(3) * longueur / 2
    v1y = longueur / 2;
    v2x = 0;
    v2y = longueur;
    v3x = Math.sqrt(3) * longueur / 2
    v3y = longueur / 2;
    centrex = Math.sqrt(3) / 2 * longueur * taille + marge
    centrey = marge;
    lastCursorIndex = -1;

    miseajourpoint();   // remplit les tableaux de travail
    dessinerlafigure()  // puis affichage
}

// recalcule toutes les grandeurs géométriques dans tabsegment et tabmilieu
function recalcGeoData() {
    let cpt = 0;
    // console.log(taille)
    //côté gauche avec diagonale verticale
    for (let j = 0; j < 2 * taille; j++) {

        for (let i = 0; i < Math.min(taille + 1, 2 * taille - j); i++) {
            if ((j > 0) && (i < taille)) {
                tabsegment[cpt] = [
                    [centrex + i * v1x + j * v2x, centrey + i * v1y + j * v2y],
                    [centrex + (i + 1) * v1x + j * v2x, centrey + (i + 1) * v1y + j * v2y]
                ];
                tabmilieu[cpt][0] = centrex + (i + 0.5) * v1x + j * v2x;
                tabmilieu[cpt][1] = centrey + (i + 0.5) * v1y + j * v2y;
                cpt++
            }
            if (i < taille) {
                tabsegment[cpt] = [
                    [centrex + i * v1x + j * v2x, centrey + i * v1y + j * v2y],
                    [centrex + i * v1x + (j + 1) * v2x, centrey + i * v1y + (j + 1) * v2y]
                ];
                tabmilieu[cpt][0] = centrex + i * v1x + (j + 0.5) * v2x;
                tabmilieu[cpt][1] = centrey + i * v1y + (j + 0.5) * v2y;
                cpt++
            }
            if (i > 0) {
                tabsegment[cpt] = [
                    [centrex + i * v1x + j * v2x, centrey + i * v1y + j * v2y],
                    [centrex + i * v1x + j * v2x + v3x, centrey + i * v1y + j * v2y + v3y]
                ];
                tabmilieu[cpt][0] = centrex + i * v1x + j * v2x + v3x / 2;
                tabmilieu[cpt][1] = centrey + i * v1y + j * v2y + v3y / 2;
                cpt++
            }
        }
    }
    //côté droite sans diagonale verticale
    for (let j = 0; j < 2 * taille; j++) {
        for (let k = 0; k < Math.min(taille + 1, 2 * taille - j); k++) {

            if ((j > 0) && (k < taille)) {
                tabsegment[cpt] = [
                    [centrex + j * v2x + k * v3x, centrey + j * v2y + k * v3y],
                    [centrex + j * v2x + (k + 1) * v3x, centrey + j * v2y + (k + 1) * v3y]
                ];
                tabmilieu[cpt][0] = centrex + j * v2x + (k + 0.5) * v3x;
                tabmilieu[cpt][1] = centrey + j * v2y + (k + 0.5) * v3y;
                cpt++
            }
            if ((k < taille) && (k > 0)) {

                tabsegment[cpt] = [
                    [centrex + j * v2x + k * v3x, centrey + j * v2y + k * v3y],
                    [centrex + (j + 1) * v2x + k * v3x, centrey + (j + 1) * v2y + k * v3y]
                ];
                tabmilieu[cpt][0] = centrex + (j + 0.5) * v2x + k * v3x;
                tabmilieu[cpt][1] = centrey + (j + 0.5) * v2y + k * v3y;
                cpt++
            }

            if (k > 0) {

                tabsegment[cpt] = [
                    [centrex + j * v2x + k * v3x, centrey + j * v2y + k * v3y],
                    [centrex + v1x + j * v2x + k * v3x, centrey + v1y + j * v2y + k * v3y]
                ];
                tabmilieu[cpt][0] = centrex + v1x / 2 + j * v2x + k * v3x;
                tabmilieu[cpt][1] = centrey + v1y / 2 + j * v2y + k * v3y;
                cpt++
            }
        }
    }
}

// Remet les trois tableaux de travail dans l'état de départ
function miseajourpoint(chaine) {
    if (chaine == undefined) {
        tabsegment = [];
        tabmilieu = [];
        //côté gauche avec diagonale verticale
        for (let j = 0; j < 2 * taille; j++) {
            for (let i = 0; i < Math.min(taille + 1, 2 * taille - j); i++) {
                let k = 0;
                if ((j > 0) && (i < taille)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + (i + 1) * v1x + j * v2x + k * v3x, centrey + (i + 1) * v1y + j * v2y + k * v3y]
                    ])
                    tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, false, "gauche", false])

                }
                if (i < taille) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + (j + 1) * v2x + k * v3x, centrey + i * v1y + (j + 1) * v2y + k * v3y]
                    ])
                    tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, false, "hori", false])
                }
                if (i > 0) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + j * v2x + (k + 1) * v3x, centrey + i * v1y + j * v2y + (k + 1) * v3y]
                    ])
                    tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, false, "droite", false])
                }
            }
        }
        //côté droit sans diagonale verticale
        for (let j = 0; j < 2 * taille; j++) {
            for (let k = 0; k < Math.min(taille + 1, 2 * taille - j); k++) {
                let i = 0;
                if ((j > 0) && (k < taille)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + j * v2x + (k + 1) * v3x, centrey + i * v1y + j * v2y + (k + 1) * v3y]
                    ])
                    tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, false, "droite", false])
                }
                if ((k < taille) && (k > 0)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + (j + 1) * v2x + k * v3x, centrey + i * v1y + (j + 1) * v2y + k * v3y]
                    ])
                    tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, false, "hori", false])
                }
                if (k > 0) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + (i + 1) * v1x + j * v2x + k * v3x, centrey + (i + 1) * v1y + j * v2y + k * v3y]
                    ])
                    tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, false, "gauche", false])
                }
            }
        }
    } else {
        var p = 0;
        tabsegment = [];
        tabmilieu = [];
        solution = []
        //côté gauche avec diagonale verticale
        for (let j = 0; j < 2 * taille; j++) {
            for (let i = 0; i < Math.min(taille + 1, 2 * taille - j); i++) {
                let k = 0;
                if ((j > 0) && (i < taille)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + (i + 1) * v1x + j * v2x + k * v3x, centrey + (i + 1) * v1y + j * v2y + k * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, "bloquee", "gauche", false])
                        solution.push('bloquee')
                    } else {

                        tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, false, "gauche", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
                if (i < taille) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + (j + 1) * v2x + k * v3x, centrey + i * v1y + (j + 1) * v2y + k * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, 'bloquee', "hori", false])
                        solution.push('bloquee')
                    } else {
                        tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, false, "hori", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
                if (i > 0) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + j * v2x + (k + 1) * v3x, centrey + i * v1y + j * v2y + (k + 1) * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, 'bloquee', "droite", false])
                        solution.push('bloquee')
                    } else {
                        tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, false, "droite", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
            }
        }
        //côté droite sans diagonale verticale
        for (let j = 0; j < 2 * taille; j++) {
            for (let k = 0; k < Math.min(taille + 1, 2 * taille - j); k++) {
                let i = 0;
                if ((j > 0) && (k < taille)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + j * v2x + (k + 1) * v3x, centrey + i * v1y + j * v2y + (k + 1) * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, 'bloquee', "droite", false])
                        solution.push('bloquee')
                    } else {
                        tabmilieu.push([centrex + i * v1x + j * v2x + (k + 0.5) * v3x, centrey + i * v1y + j * v2y + (k + 0.5) * v3y, false, "droite", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
                if ((k < taille) && (k > 0)) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + i * v1x + (j + 1) * v2x + k * v3x, centrey + i * v1y + (j + 1) * v2y + k * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, 'bloquee', "hori", false])
                        solution.push('bloquee')
                    } else {
                        tabmilieu.push([centrex + i * v1x + (j + 0.5) * v2x + k * v3x, centrey + i * v1y + (j + 0.5) * v2y + k * v3y, false, "hori", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
                if (k > 0) {
                    tabsegment.push([
                        [centrex + i * v1x + j * v2x + k * v3x, centrey + i * v1y + j * v2y + k * v3y],
                        [centrex + (i + 1) * v1x + j * v2x + k * v3x, centrey + (i + 1) * v1y + j * v2y + k * v3y]
                    ])
                    if (chaine[p] == 't') {
                        tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, 'bloquee', "gauche", false])
                        solution.push('bloquee')
                    } else {
                        tabmilieu.push([centrex + (i + 0.5) * v1x + j * v2x + k * v3x, centrey + (i + 0.5) * v1y + j * v2y + k * v3y, false, "gauche", false])
                        if (chaine[p] == 's') {
                            solution.push(true)
                        } else {
                            solution.push(false)
                        }
                    }
                    p++;
                }
            }
        }
    }
}

function commencergrille() {

    // document.getElementById('messagediv').style.display = "none";
    modejeu = true;
    chrono = 0;
    dateDebutResolution = Date.now()
    nblosangeutilise = 0;
    chronomarche();
    var tab = currentEnigme.tab;

    historique = []

    // MT - zoom automatique à la bonne valeur
    setZoomFactor();
    rafraichit()
    solutionpresente = true;

    // document.getElementById("chronospan").style.display = '';
    document.getElementById("chrono").innerHTML = chrono + ' s'

    v1x = -Math.sqrt(3) * longueur / 2
    v1y = longueur / 2;
    v2x = 0;
    v2y = longueur;
    v3x = Math.sqrt(3) * longueur / 2
    v3y = longueur / 2;
    centrex = Math.sqrt(3) / 2 * longueur * taille + marge
    centrey = marge;

    miseajourpoint(tab)
    dessinerlafigure()
}

function calcTaille(tab) {
    let i = 0, taillei;
    let pastrouve = true;
    while ((pastrouve) && (i < 30)) {
        i++;
        taillei = 3 * (3 * i * i - i);
        pastrouve = (taillei != tab.length);
    }
    taille = i;
}

function setZoomFactor() {
    let divControleHeight = document.getElementById('controle').clientHeight;
    let clw = document.documentElement.clientWidth - 4 * marge;
    let clh = document.documentElement.clientHeight - divControleHeight - 8 * marge;
    let dw = clw / (2 * taille) * 2 / Math.sqrt(3);
    let dh = clh / (2 * taille);
    longueur = Math.floor(Math.min(dw, dh));
    gridLineWidth = Math.max(1, Math.floor(longueur / 20))
    borderLineWidth = gridLineWidth + 1
    dashLineWidth = Math.max(1, Math.floor(gridLineWidth / 2))
}

// retour arrière danss l'historique
function back() {
    if (historique.length < 1) return;

    let v = historique.pop();
    tabmilieu[v.indx][v.type] = v.prec;

    // dessin du point médian pour indiquer où s'est produite l'annulation
    // marquée par un "gros" point rouge !
    dessinerlafigure()

    let taillePoint = calcTaillePoint()
    context.beginPath();
    context.lineWidth = 1;
    context.arc(tabmilieu[v.indx][0], tabmilieu[v.indx][1], taillePoint + 2, 0, 2 * Math.PI);
    context.fillStyle = undoDotColor;
    context.fill();
    context.closePath();
}

// Associée au bouton 'Reset' : annule les actions de l'utilisateur
function reset() {
    chronoarret();
    commencergrille()
}

// associée au bouton 'Ma grille est terminée'
function termine() {

    jeuPossible = !jeuPossible;

    // dessinerlafigure();
}

function dessinerlafigure() {

    let taillePoint = calcTaillePoint()

    clearCanvas();
    for (let i = 0; i < tabsegment.length; i++) {
        context.beginPath();
        context.lineWidth = dashLineWidth;
        context.setLineDash([5, 10]);
        context.moveTo(tabsegment[i][0][0], tabsegment[i][0][1]);
        context.lineTo(tabsegment[i][1][0], tabsegment[i][1][1]);
        context.stroke();
        context.closePath();
    }

    //affichage des milieu et dessin du segments si doit être tracé.
    for (let i = 0; i < tabmilieu.length; i++) {
        {
            if ((tabmilieu[i][2] == true) || (tabmilieu[i][2] == 'bloquee') || (tabmilieu[i][2] == 'solution')) { //on trace le segment si vrai
                context.beginPath();
                context.setLineDash([]);
                context.moveTo(tabsegment[i][0][0], tabsegment[i][0][1])
                context.lineTo(tabsegment[i][1][0], tabsegment[i][1][1])
                if ((tabmilieu[i][2] == 'bloquee')) {
                    context.strokeStyle = enigmaEdgeColor;
                    context.lineWidth = gridLineWidth;
                } else {
                    context.strokeStyle = userEdgeColor;
                    context.lineWidth = 1.2 * gridLineWidth;
                }
                context.stroke();
                context.closePath();
            }
            if ((tabmilieu[i][2] != 'bloquee') && (jeuPossible)) {
                context.beginPath();
                context.lineWidth = 1;
                context.setLineDash([]);
                context.arc(tabmilieu[i][0], tabmilieu[i][1], taillePoint, 0, 2 * Math.PI);
                context.fillStyle = dotFillColor;
                context.strokeStyle = dotEdgeColor;
                context.fill();
                context.stroke();
                context.closePath();
            }
            // if ((tabmilieu[i][4]) && (jeuPossible==jeuPossible)) {
            if (tabmilieu[i][4]) {
                var x = tabmilieu[i][0];
                var y = tabmilieu[i][1];
                let x1, y1, x2, y2, x3, y3, x4, y4, couleur;
                switch (tabmilieu[i][3]) {
                    case "gauche":
                        x1 = x - 0.5 * v3x - 0.5 * v2x;
                        y1 = y - 0.5 * v3y - 0.5 * v2y;
                        x2 = x + 0.5 * v3x - 0.5 * v2x;
                        y2 = y + 0.5 * v3y - 0.5 * v2y;
                        x4 = x - 0.5 * v3x + 0.5 * v2x;
                        y4 = y - 0.5 * v3y + 0.5 * v2y;
                        x3 = x + 0.5 * v3x + 0.5 * v2x;
                        y3 = y + 0.5 * v3y + 0.5 * v2y;
                        couleur = leftDiamodColor;
                        break;
                    case "droite":
                        x1 = x + 0.5 * v2x - 0.5 * v1x;
                        y1 = y + 0.5 * v2y - 0.5 * v1y;
                        x3 = x - 0.5 * v2x + 0.5 * v1x;
                        y3 = y - 0.5 * v2y + 0.5 * v1y;
                        x2 = x - 0.5 * v2x - 0.5 * v1x;
                        y2 = y - 0.5 * v2y - 0.5 * v1y;
                        x4 = x + 0.5 * v2x + 0.5 * v1x;
                        y4 = y + 0.5 * v2y + 0.5 * v1y;
                        couleur = rightDiamondColor;
                        break;
                    case "hori":
                        x2 = x - 0.5 * v1x - 0.5 * v3x
                        y2 = y - 0.5 * v1y - 0.5 * v3y
                        x1 = x + 0.5 * v1x - 0.5 * v3x
                        y1 = y + 0.5 * v1y - 0.5 * v3y
                        x3 = x - 0.5 * v1x + 0.5 * v3x
                        y3 = y - 0.5 * v1y + 0.5 * v3y
                        x4 = x + 0.5 * v1x + 0.5 * v3x
                        y4 = y + 0.5 * v1y + 0.5 * v3y
                        couleur = horizDiamodColor;
                        break;

                }
                context.beginPath();
                context.fillStyle = couleur;
                context.lineWidth = gridLineWidth;
                context.moveTo(x1, y1)
                context.lineTo(x2, y2)
                context.lineTo(x3, y3)
                context.lineTo(x4, y4)
                context.lineTo(x1, y1)
                context.fill();
                context.closePath();
            }
        }
    }
    //bordure
    for (let i = 0; i < taille; i++) {
        context.beginPath();
        context.lineWidth = borderLineWidth;
        context.strokeStyle = borderColor;
        context.setLineDash([]);
        context.moveTo(centrex + i * v1x, centrey + i * v1y)
        context.lineTo(centrex + (i + 1) * v1x, centrey + (i + 1) * v1y)
        context.moveTo(centrex + i * v1x + taille * v2x + taille * v3x, centrey + i * v1y + taille * v2y + taille * v3y)
        context.lineTo(centrex + (i + 1) * v1x + taille * v2x + taille * v3x, centrey + (i + 1) * v1y + taille * v2y + taille * v3y)

        context.moveTo(centrex + i * v2x + taille * v1x, centrey + i * v2y + taille * v1y)
        context.lineTo(centrex + (i + 1) * v2x + taille * v1x, centrey + (i + 1) * v2y + taille * v1y)
        context.moveTo(centrex + i * v2x + taille * v3x, centrey + i * v2y + taille * v3y)
        context.lineTo(centrex + (i + 1) * v2x + taille * v3x, centrey + (i + 1) * v2y + taille * v3y)

        context.moveTo(centrex + i * v3x, centrey + i * v3y)
        context.lineTo(centrex + (i + 1) * v3x, centrey + (i + 1) * v3y)
        context.moveTo(centrex + i * v3x + taille * v2x + taille * v1x, centrey + i * v3y + taille * v2y + taille * v1y)
        context.lineTo(centrex + (i + 1) * v3x + taille * v2x + taille * v1x, centrey + (i + 1) * v3y + taille * v2y + taille * v1y)

        context.stroke();
        context.closePath();
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

document.getElementById("butEdge").addEventListener(
    "click",
    () => {
        mode = "mode_arete";
        drawModeButtonsBorders()
    })
document.getElementById("butDiamond").addEventListener(
    "click",
    () => {
        mode = "mode_losange";
        drawModeButtonsBorders()
    })

function drawModeButtonsBorders() {
    if (mode == "mode_arete") {
        document.getElementById("butEdge").style.borderColor = "navy"
        document.getElementById("butDiamond").style.borderColor = "white"
    }
    else {
        document.getElementById("butEdge").style.borderColor = "white"
        document.getElementById("butDiamond").style.borderColor = "navy"
    }
}

function ajouteunlosange(x, y) {
    var orientation;
    var booldejadessine;
    var s1, s2, s3, s4;
    booldejadessine = true;
    for (var i = 0; i < tabmilieu.length; i++) {
        if (curseurProcheMilieu(x, y, i)) {
            if (tabmilieu[i][2] != 'bloquee') {
                let etat = tabmilieu[i][4];

                if ((!etat) && (solutionpresente)) {
                    nblosangeutilise++;
                }
                tabmilieu[i][4] = !tabmilieu[i][4]
                orientation = tabmilieu[i][3]

                historique.push({ 'indx': i, 'type': 4, 'prec': etat });
            }

        }
    }

    //calculs des milieux des segments périphériques
    dessinerlafigure();

}

function dessinerSolution() {
    // MAJ de tabmilieu en fonction de solution
    for (var i = 0; i < solution.length; i++) {
        switch (solution[i]) {
            case true: tabmilieu[i][2] = 'solution'; break;
            case false: tabmilieu[i][2] = false; break;
            case 'bloquee': tabmilieu[i][2] = 'bloquee';
        }
    }
    remplirLosanges()
    dessinerlafigure()
}

/*
Comment dans le code javascript du jeu du calisson dessiner les losanges de couleur ?
On ne peut pas faire comme en Python, car on ne travaille pas à partir de la modélisation 3D.
On dispose des données géométriques dans les tableaux tabmilieu et tabsegment. De plus,
le tableau solution contient l'état du tracé de la solution pour tous les points :
- Si true ou "bloquee", le segment fait partie du tracé de la solution 
- Si false, il ne faut pas tracer de segment -> on peut alors avoir un losange rempli 
centré sur le point en question. 
Pour cela, il faut qu'on connaisse deux segments bordant le losange formant un angle aigu.

Idée : 
- fabriquer à partir de tabmilieu et de solution un nouveau tableau (nommé tabmilbor)
  ressemblant à tabmilieu sauf : 
  - le deuxième champ (2) mis à jour à partir de solution
  - ajout d'un champ d'index pointant vers la position dans le tableau d'origine
    (ceci est nécessaire pour le repérage des points voisins)
  - de plus, on ajoute les segments du bord de l'hexagone à ce tableau

le but final est de mettre à jour le champ (4) de chaque élément de tabmilieu
pour un dessin correct des losanges à colorier : ceci est fait en appelant 
la fonction remplirLosanges
*/
function remplirLosanges() {
    // Les coordonnées des points dans tabmilieu sont des nombres flottants.
    // pour éviter les erreurs de comparaison entre nombres flottants, 
    // on convertit dans les tableaux les coordonnées (avec n décimales) 
    // en entiers (x -> round(10**n * x))
    // La fonction suivante effectue cette transformation pour tous les 
    // nombres contenus dans l'argument x (ou sur x lui même si c'est un nombre)
    function ar(x, n = 2) {
        if (Array.isArray(x)) {
            return x.map((e) => ar(e, n))
        } else if (typeof x === "number") {
            return Math.round(10 ** n * x)
        } else {
            return x
        }
    }

    /*
    Les points milieux des losanges candidats à être coloriés sont extraits de
    tabmilbor : ce sont ceux pour lesquels le champ 2 est ni "true", ni "bloquee" 
    donc "false".

    Parmi ces points, seuls ceux vérifiant la règle de l'angle aigu 
    (deux de ses côtés formés par une arête tracée ou le bord d'un losange
    colorié forment un angle aigu) sont à colorier
    */
    function losanges_a_remplir() {
        // mise à false du tracé du losange, et ajout de l'index
        function addLast(arrMilieu, index) {
            arrMilieu[4] = false
            arrMilieu.push(index)
            return arrMilieu
        }
        // la fonction ptsVoisins(a) retourne une liste de la forme [[p1, p2], [p3, p4]],
        // chaque p_ retourné donne le point dans tabmilbor du milieu d'un segment entourant
        //  le losange défini par le point milieu a.
        // a est un élément de tabmilbor
        // Les points sont regroupés par couples, chaque couple représentant deux arêtes formant
        // un angle aigu du losange de centre a.

        // les calculs internes sont effectués sur les coordonnées réelles des points contenues
        //  dans tabmilieu pour éviter les erreurs liées à la manipulation des flottants
        function ptsVoisins(a) {
            function samecoord(p, c) {
                let [x, y] = c
                return (p[0] == x) && (p[1] == y)
            }

            let pt1, pt2, pt3, pt4
            let index = a.at(-1)
            let ptX = tabmilieu[index][0]
            let ptY = tabmilieu[index][1]
            let orient = tabmilieu[index][3]

            switch (orient) {
                case 'hori':
                    pt1 = ar([ptX + v1x / 2, ptY - v1y / 2])
                    pt2 = ar([ptX + v1x / 2, ptY + v1y / 2])
                    pt3 = ar([ptX + v3x / 2, ptY - v3y / 2])
                    pt4 = ar([ptX + v3x / 2, ptY + v3y / 2])
                    break
                case 'gauche':
                    pt1 = ar([ptX + v1x / 2, ptY - v1y / 2])
                    pt2 = ar([ptX, ptY - v1y])
                    pt3 = ar([ptX + v3x / 2, ptY + v3y / 2])
                    pt4 = ar([ptX, ptY + v3y])
                    break
                case 'droite':
                    pt1 = ar([ptX + v3x / 2, ptY - v3y / 2])
                    pt2 = ar([ptX, ptY - v3y])
                    pt3 = ar([ptX + v1x / 2, ptY + v3y / 2])
                    pt4 = ar([ptX, ptY + v3y])
                    break
            }
            // Comme pt_i ne donne que les coordonnées, il faut retrouver les pts en parcourant tabmilbor

            let p1 = tabmilbor.find((p) => samecoord(p, pt1))
            let p2 = tabmilbor.find((p) => samecoord(p, pt2))
            let p3 = tabmilbor.find((p) => samecoord(p, pt3))
            let p4 = tabmilbor.find((p) => samecoord(p, pt4))
            return [[p1, p2], [p3, p4]]
        }

        // fabrication du tableau des bords de l'hexagone
        let bords = []
        for (let i = 0; i < taille; i++) {
            bords.push([centrex + (i + 1 / 2) * v1x, centrey + (i + 1 / 2) * v1y, "bloquee", "gauche", false])
            bords.push([centrex + (i + 1 / 2) * v3x, centrey + (i + 1 / 2) * v3y, "bloquee", "droite", false])

            bords.push([centrex + taille * v1x, centrey + taille * v1y + longueur * (i + 1 / 2), "bloquee", "hori", false])
            bords.push([centrex + taille * v3x, centrey + taille * v3y + longueur * (i + 1 / 2), "bloquee", "hori", false])

            bords.push([centrex + (i + 1 / 2) * v1x, 2 * taille * longueur + centrey - (i + 1 / 2) * v1y, "bloquee", "droite", false])
            bords.push([centrex + (i + 1 / 2) * v3x, 2 * taille * longueur + centrey - (i + 1 / 2) * v3y, "bloquee", "gauche", false])
        }

        // le tableau de travail principal tabmilbor
        // contient les points milieux de tous les segments en coordonnées entières
        // avec ajout des index, complété par les points milieux des segments
        // définissant l'hexagone
        let tabmilbor = ar(tabmilieu.concat(bords)).map(addLast)

        // dans tabmilbor, mise à jour du tracé du segment à partir du tableau solution
        for (let i = 0; i < tabmilieu.length; i++) {
            tabmilbor[i][2] = !!solution[i]
        }

        // le nombre de losanges peints. À la fin du travail, sera égal à 3*taille**2
        let nbLosPeints = 0

        // L'idée est de balayer tabmilbor pour tous les points p. 
        // Si p[2]=false, on n'a pas de segment => on doit peut être colorier le losange centré sur p.
        // Pour le savoir, on récupère les points voisins (ptsVoisins(p)->[[p1, p2], [p3, p4]]). 
        // On doit colorier le losange si les points [p1, p2] ou [p3, p4] forment un
        // couple dont les deux segments sont différents de false : on remplit le losange si
        // (p1[2] != false) && (p2[2] != false) ou la même chose pour p3,p4
        // Si on remplit le losange, tous les segments l'entourant qui étaient à false passent 
        // à "virtuel" permettant ainsi l'application de la règle de l'angle aigu.

        // Il y a plusieurs passes (boucle while) du balayage (boucle for), car la détermination
        // du coloriage d'un losange dépend du coloriage préalable des losanges voisins (pour
        // lesquels des arêtes vont passer à "virtuel")
        // Les passes sont terminées quand le nombre de losanges coloriés est égal au nombre
        // total de losanges à colorier  (3 * taille ** 2)
        while (nbLosPeints < 3 * taille ** 2) {
            // il reste des losanges non coloriés
            for (let p of tabmilbor) {
                // seuls les points internes sont à examiner (pas les bords)
                // et ces points ne doivent pas déjà être coloriés 
                if ((p.at(-1) < tabmilieu.length) && !p[4]) {
                    // seuls les points sans arête (réelle ou virtuelle) sont intéressants
                    if (!p[2]) {
                        // recherche des pts voisins
                        let [[p1, p2], [p3, p4]] = ptsVoisins(p)
                        if ((p1[2] && p2[2]) || (p3[2] && p4[2])) {
                            // au moins un des deux couples des points voisins forme
                            // un angle aigu : le losange doit être peint
                            nbLosPeints++
                            // peinture du losange
                            p[4] = true
                            // ajout des segments "virtuels"
                            for (let pp of [p1, p2, p3, p4]) {
                                if (!pp[2]) {
                                    pp[2] = "virtuel"
                                }
                            }
                        }
                    }
                }
            }
        }
        // C'est fini : on retourne le tableau de même taille que tabmilieu
        // contenant toutes les valeurs indiquant si le losange doit être colorié
        return tabmilbor.slice(0, tabmilieu.length).map((e) => e[4])
    }

    // calcul du tableau indiquant si le losange doit être rempli
    let tablos = losanges_a_remplir()

    // mise à jour dans tabmilieu de l'état de coloriage des losanges
    for (let i = 0; i < tabmilieu.length; i++) {
        tabmilieu[i][4] = tablos[i]
    }
}


function abandonGrille() {

    function restoreControlsAndCallback() {

        jeuPossible = true

        document.getElementById('btback').disabled = false;
        document.getElementById('btreset').disabled = false;
        // document.getElementById('btmode').disabled = false;
        document.getElementById('btcancel').disabled = false;
        if (is_touch_device) {
            document.getElementById('butEdge').style.display = "";
            document.getElementById('butDiamond').style.display = "";
        }
        funCallBack({ score: 0 })
    }

    document.getElementById('btback').disabled = true;
    document.getElementById('btreset').disabled = true;
    // document.getElementById('btmode').disabled = true;
    document.getElementById('btcancel').disabled = true;
    if (is_touch_device) {
        document.getElementById('butEdge').style.display = "none";
        document.getElementById('butDiamond').style.display = "none";
    }
    jeuPossible = false

    dessinerSolution();
    chronoarret();
    setTimeout(restoreControlsAndCallback, 2000)

}
// MT-

// La fonction appelée à chaque clic de souris sur le point mileu d'un segment
function ajouterenleversegment(evt) {

    let taillePoint = calcTaillePoint()
    if (jeuPossible) {
        var pos = getMousePos(canvas, evt)
        var x = pos.x
        var y = pos.y
        if ((evt.button == 0) && (mode == "mode_arete")) {
            //si clic gauche et mode arête
            for (var i = 0; i < tabmilieu.length; i++) {
                if (curseurProcheMilieu(x, y, i)) {

                    if (tabmilieu[i][2] != 'bloquee') {
                        let etat = tabmilieu[i][2];

                        tabmilieu[i][2] = !tabmilieu[i][2];

                        historique.push({ 'indx': i, 'type': 2, 'prec': etat });
                    }
                    dessinerlafigure()
                    context.beginPath();
                    context.lineWidth = gridLineWidth;
                    context.arc(tabmilieu[i][0], tabmilieu[i][1], taillePoint, 0, 2 * Math.PI);
                    context.fillStyle = dotHoverColor;
                    context.fill();
                    context.closePath();
                }
            }
        } else if (((evt.button == 0) && (mode == "mode_losange") || (evt.button == 2))) {
            // (clic gauche et mode losange) ou (clic droit)
            ajouteunlosange(x, y)
            dessinerlafigure()
        }

    }
    if (modejeu && solutionpresente) {
        if (testesolution()) {
            chronoarret()
            termine();
            setTimeout(() => { returnToGamePlay() }, 0)
        }
    }
}

function calcScore() {
    let nbTotLos = 3 * taille ** 2; // nbre max de losanges dans la grille
    let tab = currentEnigme.tab
    let nbArUser = 0;   // nb arêtes ajoutées par le joueur
    for (let s of tab) {
        if (s == 's') { nbArUser++ }
    }
    let nbAretes = 0;   // nb total d'arêtes de la solution
    for (let s of tab) {
        if (s == 't') { nbAretes++ }
    }
    nbAretes += nbArUser;
    // proportion de losanges utilisée. meilleure si faible, entre 0 et 1
    let propLos = Math.min(nblosangeutilise / nbTotLos, 1);
    // durée moyenne de placement d'une arête, > à 1 s 
    let dureeResolution = Math.floor((Date.now() - dateDebutResolution) / 1000)
    let durPlacArUser = Math.max(dureeResolution, 1) / nbArUser;
    // proportion d'arêtes à placer, entre 0 et 1. Croît avec la difficulté de la grille
    let perfAr = nbArUser / nbAretes;
    let durPlacAr = 2 // durée (en s) moyenne de placement d'une arête pour un bon joueur

    // calcul de la valeur de référence pour la grille en cours
    let scoreRef = 1 * taille ** 2 * 1.1
    // et de la valeur obtenue par le joueur
    let scorePlayer = 1 * taille ** 2 * (1.1 - propLos) * (durPlacAr / durPlacArUser) * (1 + perfAr / 2)
    // Calcul du score qui dépend de la taille de la grille et des variables précédentes
    let scoreFinal = Math.max(
        taille * 5,
        Math.round((taille - 2 + (currentEnigme.niveau - 1) / 3) * 50 * scorePlayer / scoreRef)
    )
    return {
        taille: currentEnigme.taille,
        niveau: currentEnigme.niveau,
        nbAretesJoueur: nbArUser,
        nbLosanges: nblosangeutilise,
        chronofin: dureeResolution,
        score: scoreFinal
    }
}

/** calcul du bonus en fin de partie 
 * La formule de calcul est inspirée de celle utilisée pour le score
 * avec un rapport scorePlayer / scoreRef égal à 1
 * Le bonus max est inférieur à (taille - 2 + (currentEnigme.niveau - 1) / 3) * 50
 * 
 * ce qui donne dans le cas où il ne manque qu'une seule arête pour finir la grille :
 * 3.1 -> bonus < 50
 * 4.1 -> bonus < 100
 * 5.1 -> bonus < 150
 * 6.1 -> bonus < 200 
 * 6.3 -> bonus < 266
*/
function calcBonus() {
    /* bilan du placement des arêtes
     * 
     * nbCorrectes est le nombre d'arête correctement placées
     * nbIncorrectes "    "          ""      incorrectement ""
     * nb_a_placer est le nombre d'arêtes à placer pour résoudre
     * 
     * @returns [nbCorrectes, nbIncorrectes, nb_a_placer]
     */
    function bilanPlacementAretes() {
        let nbCorrectes = 0
        let nbIncorrectes = 0
        let nb_a_Placer = 0
        for (let i = 0; i < tabmilieu.length; i++) {
            switch (solution[i]) {
                case true:
                    nb_a_Placer++
                    if (tabmilieu[i][2] === true) {
                        nbCorrectes++
                        break
                    }
                case false:
                    if (tabmilieu[i][2] === true) {
                        nbIncorrectes++
                    }
            }
        }
        return [nbCorrectes, nbIncorrectes, nb_a_Placer]
    }

    let [nbCorrectes, nbIncorrectes, nbaPlacer] = bilanPlacementAretes()
    return Math.max(
        0,
        Math.round((taille - 2 + (currentEnigme.niveau - 1) / 3) *
            50 * (nbCorrectes - nbIncorrectes) / nbaPlacer)
    )
}

function returnToGamePlay() {
    remplirLosanges()
    funCallBack(calcScore())
}

function curseur(evt) {
    let taillePoint = calcTaillePoint()
    if (jeuPossible) {
        var pos = getMousePos(canvas, evt)
        var x = pos.x
        var y = pos.y

        canvas.style.cursor = 'auto';

        for (var i = 0; i < tabmilieu.length; i++) {
            if (curseurProcheMilieu(x, y, i) && i != lastCursorIndex) {
                lastCursorIndex = i;
                canvas.style.cursor = 'pointer';
                dessinerlafigure();
                if (tabmilieu[i][2] != 'bloquee') {
                    context.beginPath();
                    context.lineWidth = 1;
                    context.arc(tabmilieu[i][0], tabmilieu[i][1], taillePoint, 0, 2 * Math.PI);
                    context.fillStyle = dotHoverColor;
                    context.fill();
                    context.closePath();
                }
                break;
            }
        }
    }
}

function chronomarche() {
    chronointerval = setInterval(
        function () {
            chrono++;
            document.getElementById("chrono").innerHTML = chrono + ' s'
        }, 1000);
}

function chronoarret() {
    clearInterval(chronointerval);
}


function testesolution() {
    var bool = true;
    var i = 0;
    // console.log(solution);
    // console.log(solution[i] + "==" + tabmilieu[i][2])
    while ((i < tabmilieu.length) && (bool)) {
        bool = (solution[i] == tabmilieu[i][2])
        i++;
    }
    return ((i == solution.length) && (bool))
}

/////////////////////////////////////////////
// point d'entrée effectif
/////////////////////////////////////////////
let funCallBack;

function start(enigme, callback, funSetLang) {
    let tab = enigme.tab
    currentEnigme = enigme
    funCallBack = callback;

    calcTaille(tab)
    setZoomFactor();
    funSetLang();
    init();
    modejeu = true;
    document.getElementById('btreset').style.display = "";

    rafraichit()
    commencergrille()

}

// on change la taille écran du graphique
function rafraichitlongueur() {
    v1x = -Math.sqrt(3) * longueur / 2
    v1y = longueur / 2;
    v2x = 0;
    v2y = longueur;
    v3x = Math.sqrt(3) * longueur / 2
    v3y = longueur / 2;
    centrex = Math.sqrt(3) / 2 * longueur * taille + marge
    centrey = marge;
    canvas.width = Math.sqrt(3) * taille * longueur + 2 * marge;
    canvas.height = taille * longueur * 2 + 2 * marge;
    lastCursorIndex = -1;

    recalcGeoData()
    dessinerlafigure()
}

export {
    start,
    back,
    reset,
    rafraichit,
    rafraichitlongueur,
    abandonGrille,
    chronoarret,
    dessinerSolution,
    calcBonus
};
