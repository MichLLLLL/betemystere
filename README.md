# 🦫 Bête Mystère

Jeu collaboratif inspiré de Gartic Phone, construit à partir de ton générateur
d'animal aléatoire. Le salon reçoit **tous la même créature absurde**, chacun
la dessine en secret, puis tout le monde révèle son dessin et vote pour son
préféré.

## Le principe du jeu

1. **Créer / rejoindre un salon** — un joueur crée un salon (code à 4
   caractères), les autres le rejoignent avec ce code.
2. **Lobby** — l'hôte choisit le nombre de rounds, le temps de dessin et le
   temps de vote, puis lance la partie (2 joueurs minimum).
3. **Fiche du spécimen (carrousel photo)** — au début de chaque round, le
   serveur tire une créature composite au hasard (silhouette, tête,
   oreilles, yeux, museau, pattes, pieds, queue, pelage, couleur,
   particularité) et l'envoie à tout le salon. Chaque trait est présenté
   dans un petit carrousel : une photo de référence + le nom, un trait à la
   fois (navigation avec les flèches ou les points). Ce carrousel reste
   affiché pendant tout le round, dans la fiche à côté du canevas.
4. **Dessin** — chaque joueur dessine cette créature sur son propre canevas,
   sans voir les autres, avant la fin du minuteur.
5. **Vote** — tous les dessins (anonymisés) sont affichés en galerie ;
   chacun vote pour son préféré (impossible de voter pour soi-même).
6. **Révélation** — les auteurs sont révélés, les votes comptés, les points
   distribués (10 pts par vote reçu + 25 pts de bonus pour le(s) dessin(s)
   le(s) plus voté(s)).
7. Au bout du nombre de rounds choisi : **classement final** avec podium, et
   possibilité de rejouer dans le même salon.

## Installation

Il te faut [Node.js](https://nodejs.org/) (version 16 ou plus).

```bash
cd gartic-animal
npm install
npm start
```

Le serveur démarre sur **http://localhost:3000**. Ouvre cette adresse dans
plusieurs onglets/navigateurs/appareils du même réseau pour tester à
plusieurs (remplace `localhost` par l'adresse IP locale de ta machine, ex.
`http://192.168.1.23:3000`, pour que d'autres appareils sur le même Wi-Fi
puissent rejoindre).

Pour héberger la partie sur internet (jouer avec des amis à distance), il
faudra déployer ce dossier sur un service Node.js (Render, Railway, Fly.io,
VPS, etc.) — le code n'a besoin d'aucune base de données, tout est géré en
mémoire côté serveur.

## Structure du projet

```
gartic-animal/
├── server.js         → serveur Express + Socket.io, toute la logique de jeu
├── animalParts.js     → les listes de traits + la génération de créature
├── package.json
└── public/
    └── index.html     → tout le client (HTML + CSS + JS) en un seul fichier
```

## Détails techniques utiles

- **Tout est géré en mémoire** : si tu redémarres le serveur, tous les
  salons et scores en cours sont perdus. Pratique pour développer, mais à
  garder en tête si tu déploies ça sérieusement.
- **Reconnexion** : si quelqu'un ferme son onglet en pleine partie, la partie
  continue sans lui (il ne bloque pas les autres). S'il rouvre l'onglet, il
  doit recréer/rejoindre un salon — il n'y a pas de reconnexion automatique
  à sa place dans la partie en cours.
- **Hôte du salon** : si l'hôte se déconnecte, le rôle passe automatiquement
  au joueur suivant resté connecté.
- **Limite de 12 joueurs par salon** et de **2 joueurs minimum** pour lancer
  une partie (le vote n'aurait pas de sens à 1 seul joueur).
- La taille max d'un message Socket.io a été augmentée à 8 Mo pour laisser
  passer les dessins encodés en base64.

## Ajouter des photos d'animaux

Le carrousel affiche une photo de référence pour chaque trait (sauf la
"particularité", qui n'est pas un animal). Sans photo, un petit encart
"photo à venir" s'affiche à la place — le jeu fonctionne très bien ainsi,
tu peux compléter au fur et à mesure.

Pour ajouter une photo, dépose-la dans `public/images/animals/`, nommée
d'après le nom anglais de l'animal (voir `public/images/animals/README.md`
pour la convention exacte de nommage).

## Pistes d'amélioration si tu veux aller plus loin

- Ajouter un chat de salon pendant l'attente en lobby.
- Sauvegarder les meilleures créatures/dessins d'une partie dans une petite
  base de données pour créer une "galerie des horreurs" permanente.
- Ajouter des thèmes de couleurs de pinceau différents selon la couleur
  dominante tirée pour la créature.
- Système de reconnexion (garder un jeton de session côté client pour
  retrouver sa place si l'onglet se ferme par accident).

Amuse-toi bien ! 🐸🦩🐍
