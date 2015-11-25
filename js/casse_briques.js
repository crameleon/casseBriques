/*********************/
/* JEU CASSE BRIQUES */
/*********************/

/*****************************************************************************************************************/
/* CONSTANTES */

	// Données du Terrain
	var TERRAIN_WIDTH = 400;
	var TERRAIN_HEIGHT = 300;
	var TERRAIN_COLOR = "#444";

	// Données de la raquette
	var RAQUETTE_WIDTH = 80; 
	var RAQUETTE_HEIGHT = 10;
	var RAQUETTE_COLOR = "#fe198e";
	var RAQUETTE_VITESSE = 5;
	var RAQUETTE_X = TERRAIN_WIDTH/2 - RAQUETTE_WIDTH/2;
	var RAQUETTE_Y = TERRAIN_HEIGHT - RAQUETTE_HEIGHT - 2;
	var RAQUETTE_TAILLE_POSITION = RAQUETTE_WIDTH/5;
	
	// Données de la balle
	var BALLE_COLOR = "#fff";
	var BALLE_DIAMETRE = 8;
	var BALLE_X = 100;
	var BALLE_Y = 100;
	var BALLE_COEFF_VITESSE = 1;
	var BALLE_VITESSE_X = 2 * BALLE_COEFF_VITESSE;
	var BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
	
	// Données des briques
	var BRIQUES_NB_LINES = 5;
	var BRIQUES_PER_LINE = 8;
	var BRIQUE_WIDTH = 48;
	var BRIQUE_HEIGHT = 15;
	var BRIQUE_SPACE = 2;
	var BRIQUES_COLOR = ["#898989", "#ABABAB", "#BCBCBC", "#DCDCDC", "#EBEBEB"];
	// Zone occupée par les briques
	var BRIQUES_LIMITE = (BRIQUE_SPACE + BRIQUE_HEIGHT) * BRIQUES_NB_LINES;

	// Données pour la victoire
	var SCORE_VICTOIRE_X = 50;
	var SCORE_VICTOIRE_Y = TERRAIN_HEIGHT/2;
	
	// Touches du clavier
	var CODE_TOUCHE_GAUCHE = 37;
	var CODE_TOUCHE_DROITE = 39;
	var CODE_BARRE_ESPACE = 32;
	
	// Musiques
	var SON_RENVOI = new Audio("./sounds/renvoi.mp3");
	var SON_REBOND = new Audio("./sounds/rebond.mp3");
	var SON_VICTOIRE = new Audio("./sounds/victoire.mp3");
	var SON_DEFAITE = new Audio("./sounds/defaite.mp3");

	// Position de la balle sur la raquette
	var RAQUETTE_POS_GAUCHE = "GAUCHE";
	var RAQUETTE_POS_MIGAUCHE = "MIGAUCHE";
	var RAQUETTE_POS_CENTRE = "CENTRE";
	var RAQUETTE_POS_MIDROITE = "MIDROITE";
	var RAQUETTE_POS_DROITE = "DROITE";
	
/*****************************************************************************************************************/
/* VARIABLES */	

	// Rafraichissement de la page
	var requestAnimId;

	// Contextes
	var terrainContext;
	var jeuContext;
	var victoireContext
	
	// Etat des briques
	var tableauBriques; // 1=brique présente, 0=brique disparue

	// Victoire / Défaite
	var victoire = 0;
	
	// Etat de la balle
	var balle_en_jeu = false;
	
	// Gestion du clavier
	var aller_gauche = false;
	var aller_droite = false;
	
/*****************************************************************************************************************/
/* FONCTION DE GESTION DES CANVAS */

	// Creation des Canvas
	var creerCanvasContext = function (name, width, height, zindex) {
		console.log("creerCanvas : Création du canvas "+name);
		var canvas = document.getElementById(name);
		if (!canvas || !canvas.getContext) {
			return;
		}
		canvas.width = width;
		canvas.height = height;
		canvas.style.zIndex = zindex;
		var context = canvas.getContext('2d');
		if (!context) {
			return;
		} else {
			return context;
		}
	}	

/*****************************************************************************************************************/
/* FONCTIONS DE DESSIN */
  
	// Dessin du terrain
	var dessinerTerrain = function () {
		terrainContext.fillStyle = TERRAIN_COLOR;
		terrainContext.fillRect(0,0,TERRAIN_WIDTH,TERRAIN_HEIGHT);
	}

	// Dessin de la raquette
	var dessinerRaquette = function () {
		jeuContext.fillStyle = RAQUETTE_COLOR;
		jeuContext.fillRect(RAQUETTE_X,RAQUETTE_Y,RAQUETTE_WIDTH,RAQUETTE_HEIGHT);
	}

	// Dessin de la balle
	var dessinerBalle = function () {
		jeuContext.fillStyle = BALLE_COLOR;
		jeuContext.fillRect(BALLE_X,BALLE_Y,BALLE_DIAMETRE,BALLE_DIAMETRE);
	}
	
	// Dessin des briques
	var dessinerBriques = function (init) {
		if (init) {
			tableauBriques = new Array(BRIQUES_NB_LINES);
		}
		for (var i=0; i < BRIQUES_NB_LINES; i++) {
			if (init) {
				tableauBriques[i] = new Array(BRIQUES_PER_LINE);
			}
			jeuContext.fillStyle = BRIQUES_COLOR[i];
			if (init) {
				for (var j=0; j < BRIQUES_PER_LINE; j++) {
					jeuContext.fillRect((j * (BRIQUE_WIDTH + BRIQUE_SPACE)),(i * (BRIQUE_HEIGHT + BRIQUE_SPACE)),BRIQUE_WIDTH,BRIQUE_HEIGHT);
					tableauBriques[i][j] = 1;
				}
			} else {
				for (var j=0; j < BRIQUES_PER_LINE; j++) {
					if (tableauBriques[i][j] == 1) {
						jeuContext.fillRect((j * (BRIQUE_WIDTH + BRIQUE_SPACE)),(i * (BRIQUE_HEIGHT + BRIQUE_SPACE)),BRIQUE_WIDTH,BRIQUE_HEIGHT);
					}
				}
			}
		}
	}
	
	// Dessin du message de victoire ou de défaite
	var dessinerVictoireOuDefaite = function () {
		terrainContext.clearRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);
		jeuContext.clearRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);
		victoireContext.fillStyle = TERRAIN_COLOR;
		victoireContext.font = "1.5em Helvetica, Arial, sans-serif";
		if (victoire == 1) {
			victoireContext.fillText("Vous avez gagné la partie !!!",SCORE_VICTOIRE_X,SCORE_VICTOIRE_Y);
			SON_VICTOIRE.play();
		} else if (victoire == -1) {
			victoireContext.fillText("Vous avez perdu la partie !!!",SCORE_VICTOIRE_X,SCORE_VICTOIRE_Y);
			SON_DEFAITE.play();
		}
	}
	
/*****************************************************************************************************************/
/* FONCTIONS DE GESTION DES ANIMATIONS */

	// Animation de la balle
	var animerBalle = function () {
		BALLE_X = BALLE_X + BALLE_VITESSE_X;
		if (BALLE_X + BALLE_DIAMETRE > TERRAIN_WIDTH || BALLE_X < 0) {
			BALLE_VITESSE_X = -BALLE_VITESSE_X;
			SON_REBOND.play();
		}
		BALLE_Y = BALLE_Y - BALLE_VITESSE_Y;
		if (BALLE_Y >= (TERRAIN_HEIGHT - BALLE_DIAMETRE) || BALLE_Y <= 0) {
			SON_REBOND.play();
			BALLE_VITESSE_Y = -BALLE_VITESSE_Y;
			if (BALLE_Y >= TERRAIN_HEIGHT-BALLE_DIAMETRE+1) {
				BALLE_Y--; 
			} else if (BALLE_Y <= 0) {
				BALLE_Y++; 
			}
		}
		dessinerBalle();
	}

	// Animation de la raquette
	var animerRaquette = function () {
		if (aller_droite && RAQUETTE_X + RAQUETTE_WIDTH < TERRAIN_WIDTH) {
			RAQUETTE_X += RAQUETTE_VITESSE;
			}
		else if (aller_gauche && RAQUETTE_X > 0)
			RAQUETTE_X -= RAQUETTE_VITESSE;
	}

	// Position de la balle sur la raquette
	var positionBalleSurRaquette = function () {
		if ( BALLE_X > RAQUETTE_X - RAQUETTE_WIDTH && BALLE_X < RAQUETTE_X + RAQUETTE_TAILLE_POSITION ) {
			return RAQUETTE_POS_GAUCHE;
		} else if ( BALLE_X >= RAQUETTE_X + RAQUETTE_TAILLE_POSITION && BALLE_X < RAQUETTE_X + RAQUETTE_TAILLE_POSITION*2 ) {
			return RAQUETTE_POS_MIGAUCHE;
		} else if ( BALLE_X >= RAQUETTE_X + RAQUETTE_WIDTH - RAQUETTE_TAILLE_POSITION*2 && BALLE_X < RAQUETTE_X + RAQUETTE_WIDTH - RAQUETTE_TAILLE_POSITION ) {
			return RAQUETTE_POS_MIDROITE;
		}else if ( BALLE_X >= RAQUETTE_X + RAQUETTE_WIDTH - RAQUETTE_TAILLE_POSITION && BALLE_X < RAQUETTE_X + RAQUETTE_WIDTH ) {
			return RAQUETTE_POS_DROITE;
		}
		return RAQUETTE_POS_CENTRE;
	}
	
	// Trajectoire de la balle
	var changerTrajectoireBalle = function () {
		// Collision de la balle avec la raquette
		if (testerCollisionBalleRaquette()) {
			SON_RENVOI.play();
			switch(positionBalleSurRaquette()) {
				case RAQUETTE_POS_GAUCHE:
					BALLE_VITESSE_X = -3 * BALLE_COEFF_VITESSE;
					BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
					break;
				case RAQUETTE_POS_MIGAUCHE:
					BALLE_VITESSE_X = -2 * BALLE_COEFF_VITESSE;
					BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
					break;
				case RAQUETTE_POS_CENTRE:
					BALLE_VITESSE_X = 1 * BALLE_COEFF_VITESSE;
					BALLE_VITESSE_Y = 3 * BALLE_COEFF_VITESSE;
					break;
				case RAQUETTE_POS_MIDROITE:
					BALLE_VITESSE_X = 2 * BALLE_COEFF_VITESSE;
					BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
					break;
				case RAQUETTE_POS_DROITE:
					BALLE_VITESSE_X = 3 * BALLE_COEFF_VITESSE;
					BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
					break;
			}
		}
		// Collision de la balle avec les briques
		testerCollisionBalleBriques();
		// Test de la victoire (plus aucune brique en jeu)
		testerVictoire();
	}
	
/*****************************************************************************************************************/
/* FONCTIONS DE GESTION DES COLLISIONS */

	var testerCollisionBalleRaquette = function () {
		if ( !( RAQUETTE_X > BALLE_X + BALLE_DIAMETRE
			|| RAQUETTE_X < BALLE_X - RAQUETTE_WIDTH 
			|| RAQUETTE_Y > BALLE_Y + BALLE_DIAMETRE
			|| RAQUETTE_Y < BALLE_Y - RAQUETTE_HEIGHT) ) {
			// Collision
			return true;
		}
		return false;
	}
	
	var testerCollisionBalleBriques = function () {
		if (BALLE_Y < BRIQUES_LIMITE) {
			// On est dans la zone des briques
			var LIGNE_Y = Math.floor(BALLE_Y/(BRIQUE_HEIGHT+BRIQUE_SPACE));
			var LIGNE_X = Math.floor(BALLE_X/(BRIQUE_WIDTH+BRIQUE_SPACE));
			if (LIGNE_Y >= 0 && LIGNE_Y < BRIQUES_NB_LINES && LIGNE_X >= 0 && LIGNE_X < BRIQUES_PER_LINE) {
				if (tableauBriques[LIGNE_Y][LIGNE_X] == 1) {
					tableauBriques[LIGNE_Y][LIGNE_X] = 0;
					BALLE_VITESSE_Y = -BALLE_VITESSE_Y;
					SON_REBOND.play();
				}
			}
		}
	}

/*****************************************************************************************************************/
/* FONCTIONS DEFAITE OU VICTOIRE */

	var testerBallePerdue = function () {
		if (BALLE_Y > RAQUETTE_Y) {
			console.log("Le Joueur perd la balle");
			valeurRetour = true;
			victoire = -1;
		}
	}
	
	var testerVictoire = function () {
		var testVictoire = true;
		for (var i=0; i < BRIQUES_NB_LINES; i++) {
			for (var j=0; j < BRIQUES_PER_LINE; j++) {
				if (tableauBriques[i][j] == 1) {
					testVictoire = false;
				}
			}
		}
		if (testVictoire) {
			victoire = 1;
		}
	}
	
/*****************************************************************************************************************/
/* FONCTIONS DE GESTION DES TOUCHES CLAVIER */

	var onKeyDown = function (event) {
		if (event.keyCode == CODE_TOUCHE_GAUCHE) {
			aller_gauche = true;
		} else if (event.keyCode == CODE_TOUCHE_DROITE) {
			aller_droite = true;
		} else if (event.keyCode == CODE_BARRE_ESPACE && balle_en_jeu==false) {
			initialiserEngagement();
		}
	}
	var onKeyUp = function (event) {
		if (event.keyCode == CODE_TOUCHE_GAUCHE) {
			aller_gauche = false;
		} else if (event.keyCode == CODE_TOUCHE_DROITE) {
			aller_droite = false;
		}
	}
	
/*****************************************************************************************************************/
/* FONCTION DE MISE EN JEU */

	var initialiserEngagement = function () {
		console.log("Engagement");
		balle_en_jeu = true;
		BALLE_X = RAQUETTE_X + RAQUETTE_WIDTH/2;
		BALLE_Y = RAQUETTE_Y - RAQUETTE_HEIGHT;
		BALLE_COEFF_VITESSE = 1;
		BALLE_VITESSE_X = 2 * BALLE_COEFF_VITESSE;
		BALLE_VITESSE_Y = 2 * BALLE_COEFF_VITESSE;
		SON_RENVOI.play();
	}
	
/*****************************************************************************************************************/
/* FONCTIONS DE GESTION DU JEU */

	// Initialisation 
	var initialisation = function () {
		// Récupération des contextes
		terrainContext = creerCanvasContext("canvasTerrain",TERRAIN_WIDTH,TERRAIN_HEIGHT,1);
		jeuContext = creerCanvasContext("canvasJeu",TERRAIN_WIDTH,TERRAIN_HEIGHT,2);
		victoireContext = creerCanvasContext("canvasVictoire",TERRAIN_WIDTH,TERRAIN_HEIGHT,3);
		// Dessin du terrain
		dessinerTerrain();
		// Initialisation des briques
		dessinerBriques(true);
		// Affichage après rafraichissement de la page
		requestAnimId = window.requestAnimationFrame(dessin);
	}

	// Code du jeu
	var dessin = function () {
		if (victoire == 0) {
				// Effacement des données du canvas de la raquette, de la balle et des briques
				jeuContext.clearRect(0,0,TERRAIN_WIDTH,TERRAIN_HEIGHT);
				// Dessin des briques
				dessinerBriques(false);
				// Animation de la balle
				if (balle_en_jeu) {
					animerBalle();
					testerBallePerdue();
				}
				// Animation de la raquette
				animerRaquette();
				// Dessin de la raquette
				dessinerRaquette();
				// Test de collision
				changerTrajectoireBalle();
				// Affichage après rafraichissement de la page
				requestAnimId = window.requestAnimationFrame(dessin);
		} else {
			dessinerVictoireOuDefaite();
		}
	}
	
	// Appel de la fonction d'initialisation au chargement de la page
	window.addEventListener('load', function () {
		initialisation();
		window.document.onkeydown = onKeyDown;
		window.document.onkeyup = onKeyUp;
	}, false);
	
/*****************************************************************************************************************/