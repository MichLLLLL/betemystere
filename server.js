// server.js
// Serveur du jeu "Bête Mystère".
// - Express sert le client (public/index.html)
// - Socket.io gère les salons, les rounds, la phase de dessin, la phase de vote
//   et le calcul des scores.
//
// Toute la logique de partie vit ICI, côté serveur : c'est lui qui tire la
// créature au hasard et qui décide quand une phase commence/se termine, pour
// que tous les joueurs d'un même salon soient toujours synchronisés.

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { generateAnimal, partLabels, slugify, DIFFICULTY_LEVELS } = require("./animalParts");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // Les dessins envoyés en base64 peuvent peser plusieurs centaines de Ko,
  // on augmente donc la limite par rapport à la valeur par défaut de socket.io.
  maxHttpBufferSize: 8 * 1024 * 1024, // 8 Mo
});

app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Avatars (DiceBear) — générés côté serveur, pas de dépendance CDN pour le
// client. @dicebear/core et @dicebear/styles sont des packages PURS ESM :
// impossible de les charger avec require() depuis ce fichier CommonJS, donc
// on utilise un import() dynamique, chargé une seule fois puis mis en cache.
// ---------------------------------------------------------------------------
const AVATAR_STYLE = "miniavs";
let dicebearReady = null;

function loadDicebear() {
  if (!dicebearReady) {
    dicebearReady = Promise.all([
      import("@dicebear/core"),
      import(`@dicebear/styles/${AVATAR_STYLE}.json`, { with: { type: "json" } }),
    ]).then(([core, styleModule]) => ({
      Style: core.Style,
      Avatar: core.Avatar,
      styleDefinition: styleModule.default,
    }));
  }
  return dicebearReady;
}

// GET /api/avatar?seed=xxxx -> renvoie un SVG. Le même seed produit toujours
// exactement le même avatar, donc on peut mettre le résultat en cache très
// longtemps côté navigateur.
app.get("/api/avatar", async (req, res) => {
  const seed = String(req.query.seed || "").trim().slice(0, 60);
  if (!seed) {
    res.status(400).send("Paramètre 'seed' manquant.");
    return;
  }
  try {
    const { Style, Avatar, styleDefinition } = await loadDicebear();
    const style = new Style(styleDefinition);
    const avatar = new Avatar(style, { seed, size: 128 });
    res.set("Content-Type", "image/svg+xml");
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(avatar.toString());
  } catch (err) {
    console.error("Erreur de génération d'avatar :", err);
    res.status(500).send("");
  }
});

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// État en mémoire
// ---------------------------------------------------------------------------

/** @type {Map<string, Room>} code de salon -> salon */
const rooms = new Map();

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1
const MIN_PLAYERS_TO_START = 2;
const DEFAULT_SETTINGS = { rounds: 3, drawTime: 90, voteTime: 25, difficulty: "medium", includeExtras: true };
const INTRO_MS_PER_GROUP = 1500; // le carrousel défile tout seul, 1,5 seconde par slide
const VOTE_BONUS = 25; // bonus pour le(s) dessin(s) le(s) plus voté(s) du round
const POINTS_PER_VOTE = 10;
const MAX_CHAT_HISTORY = 200;

function getDifficulty(room) {
  return DIFFICULTY_LEVELS[room.settings.difficulty] || DIFFICULTY_LEVELS.medium;
}

function makeRoomCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function sanitizeName(rawName) {
  const name = String(rawName || "").trim().slice(0, 16);
  return name.length ? name : "Joueur mystère";
}

function sanitizeSeed(rawSeed, fallback) {
  const seed = String(rawSeed || "").trim().slice(0, 40);
  return seed.length ? seed : fallback;
}

function connectedPlayers(room) {
  return [...room.players.values()].filter((p) => p.connected);
}

function publicPlayerList(room) {
  return [...room.players.values()]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed,
      score: p.score,
      connected: p.connected,
      isHost: p.id === room.hostId,
    }));
}

function scoreboard(room) {
  return [...room.players.values()]
    .map((p) => ({ id: p.id, name: p.name, avatarSeed: p.avatarSeed, score: p.score, connected: p.connected }))
    .sort((a, b) => b.score - a.score);
}

function emitPlayers(room) {
  io.to(room.code).emit("players_update", { players: publicPlayerList(room) });
}

function emitError(socket, message) {
  socket.emit("room_error", { message });
}

function clearRoomTimer(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function deleteRoomIfEmpty(room) {
  if (connectedPlayers(room).length === 0) {
    clearRoomTimer(room);
    rooms.delete(room.code);
  }
}

function reassignHostIfNeeded(room) {
  const host = room.players.get(room.hostId);
  if (host && host.connected) return;
  const next = connectedPlayers(room).sort((a, b) => a.joinedAt - b.joinedAt)[0];
  if (next) {
    room.hostId = next.id;
    io.to(room.code).emit("toast", { message: `${next.name} est le nouvel hôte du salon.` });
  }
}

// ---------------------------------------------------------------------------
// Déroulé d'un round : countdown -> dessin -> vote -> révélation
// ---------------------------------------------------------------------------

function startRound(room) {
  clearRoomTimer(room);
  room.round += 1;
  room.phase = "countdown";

  const difficulty = getDifficulty(room);
  const includeExtras = !!room.settings.includeExtras;
  room.currentAnimal = generateAnimal(difficulty.keys, includeExtras);
  room.submissions = new Map(); // socketId -> dataURL (mis à jour aussi par l'autosave pendant l'édition)
  room.lockedPlayers = new Set(); // socketId des joueurs actuellement en état "verrouillé" (dessin envoyé)
  room.votes = new Map(); // voterId -> targetId
  room.anonymizedOrder = []; // rempli à l'entrée en phase de vote

  const displayKeys = includeExtras ? [...difficulty.keys, "extras"] : difficulty.keys;
  const groups = displayKeys.map((key) => {
    const value = room.currentAnimal.traits[key];
    // "extras" n'est pas un animal (ex: "glowing eyes", "unicorn horn"),
    // donc pas de photo de référence pour ce trait-là.
    const isAnimalTrait = key !== "extras";
    const slug = isAnimalTrait ? slugify(value) : null;
    return {
      title: partLabels[key],
      items: [{
        key,
        label: partLabels[key],
        value,
        image: slug ? `/images/animals/${slug}.jpg` : null,
        imageFallback: slug ? `/images/animals/${slug}.png` : null,
      }],
    };
  });

  const countdownMs = displayKeys.length * INTRO_MS_PER_GROUP;

  io.to(room.code).emit("round_countdown", {
    round: room.round,
    totalRounds: room.settings.rounds,
    groups,
    hasArachnid: room.currentAnimal.hasArachnid,
    countdownMs,
  });

  room.timer = setTimeout(() => beginDrawingPhase(room), countdownMs);
}

function beginDrawingPhase(room) {
  clearRoomTimer(room);
  room.phase = "drawing";
  room.phaseEndsAt = Date.now() + room.settings.drawTime * 1000;

  io.to(room.code).emit("round_start", {
    round: room.round,
    totalRounds: room.settings.rounds,
    drawTimeMs: room.settings.drawTime * 1000,
  });

  room.timer = setTimeout(() => endDrawingPhase(room), room.settings.drawTime * 1000);
}

// Fait avancer la phase de dessin dès que TOUS les joueurs connectés sont
// actuellement verrouillés (dessin envoyé et non repassé en "modifier").
// Recalculé à chaque envoi/déverrouillage, donc l'ordre des clics importe :
// si quelqu'un déverrouille puis renvoie, on attend son nouveau verrou.
function maybeAdvanceDrawing(room) {
  const players = connectedPlayers(room);
  if (players.length > 0 && players.every((p) => room.lockedPlayers.has(p.id))) {
    endDrawingPhase(room);
  }
}

function endDrawingPhase(room) {
  if (room.phase !== "drawing") return;
  clearRoomTimer(room);
  room.phase = "voting";

  const entries = [...room.submissions.entries()].map(([authorId, dataURL]) => ({
    authorId,
    dataURL,
  }));
  // On mélange l'ordre pour ne pas donner d'indice sur qui a soumis en premier.
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }
  room.anonymizedOrder = entries.map((e, idx) => ({ ...e, displayIndex: idx + 1 }));

  room.phaseEndsAt = Date.now() + room.settings.voteTime * 1000;

  if (room.anonymizedOrder.length === 0) {
    // Personne n'a rendu de dessin à temps : on saute directement la révélation.
    io.to(room.code).emit("toast", { message: "Personne n'a terminé son dessin à temps..." });
    endVotingPhase(room);
    return;
  }

  // Chaque joueur reçoit la galerie, avec un marqueur "isMine" personnalisé
  // (pour désactiver le vote sur son propre dessin côté client).
  for (const player of connectedPlayers(room)) {
    io.to(player.id).emit("voting_start", {
      voteTimeMs: room.settings.voteTime * 1000,
      drawings: room.anonymizedOrder.map((e) => ({
        displayIndex: e.displayIndex,
        dataURL: e.dataURL,
        isMine: e.authorId === player.id,
      })),
    });
  }

  room.timer = setTimeout(() => endVotingPhase(room), room.settings.voteTime * 1000);
}

function maybeAdvanceVoting(room) {
  const eligibleVoters = connectedPlayers(room);
  if (eligibleVoters.length > 0 && eligibleVoters.every((p) => room.votes.has(p.id))) {
    endVotingPhase(room);
  }
}

function endVotingPhase(room) {
  if (room.phase !== "voting") return;
  clearRoomTimer(room);
  room.phase = "reveal";

  const voteCounts = new Map(); // authorId -> nombre de votes
  for (const targetId of room.votes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
  }

  const maxVotes = Math.max(0, ...voteCounts.values());

  const results = room.anonymizedOrder.map((entry) => {
    const votes = voteCounts.get(entry.authorId) || 0;
    const author = room.players.get(entry.authorId);
    return {
      authorId: entry.authorId,
      name: author ? author.name : "???",
      avatarSeed: author ? author.avatarSeed : null,
      dataURL: entry.dataURL,
      votes,
      isTopVoted: maxVotes > 0 && votes === maxVotes,
    };
  });
  results.sort((a, b) => b.votes - a.votes);

  // Attribution des points.
  for (const result of results) {
    const player = room.players.get(result.authorId);
    if (!player) continue;
    player.score += result.votes * POINTS_PER_VOTE;
    if (result.isTopVoted) player.score += VOTE_BONUS;
  }

  const isLastRound = room.round >= room.settings.rounds;

  io.to(room.code).emit("reveal", {
    round: room.round,
    totalRounds: room.settings.rounds,
    results,
    scoreboard: scoreboard(room),
    isLastRound,
  });
}

function goToGameOver(room) {
  room.phase = "gameover";
  clearRoomTimer(room);
  const board = scoreboard(room);
  io.to(room.code).emit("game_over", { scoreboard: board, podium: board.slice(0, 3) });
}

// ---------------------------------------------------------------------------
// Connexions Socket.io
// ---------------------------------------------------------------------------

io.on("connection", (socket) => {
  socket.data.roomCode = null;

  socket.on("create_room", ({ name, avatarSeed } = {}) => {
    const code = makeRoomCode();
    const player = {
      id: socket.id,
      name: sanitizeName(name),
      avatarSeed: sanitizeSeed(avatarSeed, `player-${socket.id}`),
      score: 0,
      connected: true,
      joinedAt: Date.now(),
    };

    const room = {
      code,
      hostId: socket.id,
      players: new Map([[socket.id, player]]),
      settings: { ...DEFAULT_SETTINGS },
      round: 0,
      phase: "lobby",
      currentAnimal: null,
      submissions: new Map(),
      votes: new Map(),
      anonymizedOrder: [],
      chatMessages: [],
      timer: null,
      phaseEndsAt: null,
    };
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;

    socket.emit("room_joined", {
      code,
      yourId: socket.id,
      isHost: true,
      settings: room.settings,
      players: publicPlayerList(room),
      chatMessages: room.chatMessages,
    });
  });

  socket.on("join_room", ({ name, code, avatarSeed } = {}) => {
    const roomCode = String(code || "").trim().toUpperCase();
    const room = rooms.get(roomCode);

    if (!room) {
      emitError(socket, "Ce salon n'existe pas. Vérifie le code !");
      return;
    }
    if (room.phase !== "lobby") {
      emitError(socket, "La partie a déjà commencé dans ce salon.");
      return;
    }
    if (connectedPlayers(room).length >= 12) {
      emitError(socket, "Ce salon est complet (12 joueurs max).");
      return;
    }

    const player = {
      id: socket.id,
      name: sanitizeName(name),
      avatarSeed: sanitizeSeed(avatarSeed, `player-${socket.id}`),
      score: 0,
      connected: true,
      joinedAt: Date.now(),
    };
    room.players.set(socket.id, player);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit("room_joined", {
      code: roomCode,
      yourId: socket.id,
      isHost: socket.id === room.hostId,
      settings: room.settings,
      players: publicPlayerList(room),
      chatMessages: room.chatMessages,
    });

    emitPlayers(room);
    io.to(roomCode).emit("toast", { message: `${player.name} a rejoint le salon.` });
  });

  // Chat texte simple, disponible à tout moment (lobby, dessin, vote, révélation...).
  socket.on("chat_message", ({ text } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    const clean = String(text || "").trim().slice(0, 300);
    if (!clean) return;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      playerId: socket.id,
      name: player.name,
      avatarSeed: player.avatarSeed,
      text: clean,
      at: Date.now(),
    };

    room.chatMessages.push(message);
    if (room.chatMessages.length > MAX_CHAT_HISTORY) room.chatMessages.shift();

    io.to(room.code).emit("chat_message", message);
  });

  socket.on("update_settings", ({ rounds, drawTime, voteTime, difficulty, includeExtras } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostId || room.phase !== "lobby") return;

    room.settings.rounds = Math.min(10, Math.max(1, parseInt(rounds, 10) || room.settings.rounds));
    room.settings.drawTime = Math.min(180, Math.max(30, parseInt(drawTime, 10) || room.settings.drawTime));
    room.settings.voteTime = Math.min(60, Math.max(15, parseInt(voteTime, 10) || room.settings.voteTime));
    if (difficulty !== undefined && DIFFICULTY_LEVELS[difficulty]) {
      room.settings.difficulty = difficulty;
    }
    if (includeExtras !== undefined) {
      room.settings.includeExtras = !!includeExtras;
    }

    io.to(room.code).emit("settings_update", { settings: room.settings });
  });

  socket.on("start_game", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostId || room.phase !== "lobby") return;

    if (connectedPlayers(room).length < MIN_PLAYERS_TO_START) {
      emitError(socket, `Il faut au moins ${MIN_PLAYERS_TO_START} joueurs pour lancer la partie.`);
      return;
    }

    room.round = 0;
    startRound(room);
  });

  // dataURL est envoyé à chaque changement du dessin (autosave silencieux
  // pendant l'édition, final=false) ET quand le joueur clique sur "Envoyer"
  // ou que son chrono arrive à zéro (final=true, verrouille sa soumission).
  // Grâce à l'autosave continu, room.submissions reste à jour même si le
  // tout dernier message "final" d'un joueur arrive après la bascule de phase.
  socket.on("submit_drawing", ({ dataURL, final } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== "drawing") return;
    if (typeof dataURL !== "string" || !dataURL.startsWith("data:image/")) return;

    room.submissions.set(socket.id, dataURL);
    if (final) room.lockedPlayers.add(socket.id);

    io.to(room.code).emit("submission_progress", {
      submitted: room.lockedPlayers.size,
      total: connectedPlayers(room).length,
    });

    if (final) maybeAdvanceDrawing(room);
  });

  // Le joueur a cliqué sur "Modifier mon dessin" : il n'est plus verrouillé,
  // on ne le compte plus comme prêt pour la suite.
  socket.on("unlock_drawing", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== "drawing") return;
    room.lockedPlayers.delete(socket.id);
    io.to(room.code).emit("submission_progress", {
      submitted: room.lockedPlayers.size,
      total: connectedPlayers(room).length,
    });
  });

  socket.on("cast_vote", ({ targetDisplayIndex } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== "voting") return;

    const target = room.anonymizedOrder.find((e) => e.displayIndex === targetDisplayIndex);
    if (!target) return;
    if (target.authorId === socket.id) return; // on ne peut pas voter pour soi-même

    room.votes.set(socket.id, target.authorId);
    io.to(room.code).emit("vote_progress", {
      voted: room.votes.size,
      total: connectedPlayers(room).length,
    });
    maybeAdvanceVoting(room);
  });

  socket.on("next_round", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostId || room.phase !== "reveal") return;

    if (room.round >= room.settings.rounds) {
      goToGameOver(room);
    } else {
      startRound(room);
    }
  });

  socket.on("play_again", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || socket.id !== room.hostId || room.phase !== "gameover") return;

    room.round = 0;
    room.phase = "lobby";
    for (const p of room.players.values()) p.score = 0;

    io.to(room.code).emit("return_to_lobby", {
      settings: room.settings,
      players: publicPlayerList(room),
    });
  });

  socket.on("leave_room", () => handleLeave(socket));
  socket.on("disconnect", () => handleLeave(socket, true));

  function handleLeave(sock, isDisconnect = false) {
    const room = rooms.get(sock.data.roomCode);
    if (!room) return;

    const player = room.players.get(sock.id);
    const name = player ? player.name : "Un joueur";

    if (room.phase === "lobby") {
      room.players.delete(sock.id);
    } else if (player) {
      player.connected = false;
    }

    sock.leave(room.code);
    sock.data.roomCode = null;

    if (rooms.has(room.code)) {
      deleteRoomIfEmpty(room);
      if (rooms.has(room.code)) {
        reassignHostIfNeeded(room);
        emitPlayers(room);
        io.to(room.code).emit("toast", {
          message: isDisconnect ? `${name} s'est déconnecté(e).` : `${name} a quitté le salon.`,
        });
        // Si tout le monde restant attendait cette personne, on retente.
        if (room.phase === "drawing") maybeAdvanceDrawing(room);
        if (room.phase === "voting") maybeAdvanceVoting(room);
      }
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bête Mystère lancé sur le port ${PORT}`);
});