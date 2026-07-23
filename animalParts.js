// animalParts.js
// Reprend les listes de ton générateur d'animal, mais côté SERVEUR.
// C'est important : c'est le serveur qui tire la créature au hasard et
// l'envoie à tous les joueurs du salon, pour être certain qu'ils reçoivent
// exactement la même bête à dessiner.

const base = [
  "harvest mouse", "duck", "horse", "moose", "sheep", "crocodile", "bat",
  "seal", "monkey", "meerkat",  "sloth bear", "elephant", "gazelle",
  "lion", "tiger", "wolf", "camel", "otter", "chameleon", "flamingo",
  "large white pig", "wild boar", "nubian goat", "nigerian goat", "irish cob",
  "arabian horse", "okapi", "maned wolf", "fossa", "slow lori", "angora rabbit",
  "axolotl", "bearded vulture", "red panda", "cheetah", "glass frog", "mantis shrimp",
  "sun bear", "aye-aye", "markhor", "saiga antelope", "sloth", "sea turtle",
  "pangolin", "gharial", "marine iguana", "white tiger", "porcupine", "african crowned crane",
  "african wild dog", "leopard", "bat-eared fox", "bongo", "orangutan", "sea lion", "caracal",
  "giraffe", "rhino", "howler monkey", "mountain lion", "koala", "arctic fox", "panther",
  "millipede", "aardvark", "afghan hound", "african civet", "african penguin", "akita", "anteater",
  "arctic hare", "armadillo", "baboon", "barn owl", "bedlington terrier", "bison", "bobcat", 
  "budgerigar", "capybara", "cassowary", "clownfish", "coati", "common frog",
  "cottontop tamarin", "coyote", "dachshund", "emu", "european hare", "fennec fox", "hammerhead shark",
  "gemsbok", "golden pheasant", "common pheasant", "grasshopper", "pelican", "honey bee", "hoopoe bird", "jackal",
  "king penguin", "komodo dragon", "ladybug", "ring-tailed lemur", "llama", "lynx", "japanese macaque",
  "mountain goat", "tarantula", "opossum", "pine marten", "piranha", "polar bear", "red squirrel",
  "red fox", "kangaroo", "roborovski hamster", "ibis", "scarlet macaw", "seahorse", "secretary bird", "serval",
  "snow leopard", "hyena", "toucan", "weasel", "wildebeest", "wolverine", "abyssinian",
  "giant tortoise", "river dolphin", "clawed frog",
  "angelfish", "ant", "anteater", "arctic hare", "giant hornet",
  "barn owl", "barracuda", "basenji", "basking shark", "basset hound", "bearded dragon", "beaver", "bedlington terrier",
  "bichon frise", "birman",  "bloodhound", "blue jay", 
  "bobcat", "booby", "border collie",
  "bumblebee", "bullfrog", "bull shark", "bull terrier", "great white shark", "cassowary",
  "t-rex", "stegosaurus", "catfish", "camel", "chamois", "caterpillar", "chicken", "chinchilla", "chipmunk",
  "collared peccary", "colossal squid", "cichlid", "clownfish", "cuscus", "darwin's frog", "dhole", "discus",
  "dodo", "dogue de bordeaux", "donkey", "dragonfly", "dormouse", "earwig", "echidna", "emperor tamarin",
  "fishing cat", "flamingo", "fangtooth", "ferret", "gecko", "gila monster", "german shepherd", "gopher",
  "grouse", "harpy eagle", "hippopotamus", "heron", "honey badger",  "green anole",
  "golden retriever", "lamprey", "kiwi", "mudskipper", "potoo", "mandarin fish", "lovebird",
  "wigeon", "saola", "cuban snail", "bald ibis", "ploughshare tortoise", "resplendent quetzal",
  "angel shark", "golden-rumped elephant shrew", "peacock tarantula", "bumblebee", "dama gazelle",
  "blue poison dart frog", "red-eyed tree frog", "golden poison frog", "chinese crested",
  "mimic poison frog", "amazon milk frog", "dyeing dart frog", "phantasmal poison frog", "lilac-breasted roller",
  "swallowtail butterfly",  "gouldian finch", "rosy maple moth", "mandarin duck",
  "san francisco garter snake", "rainbow boa", "emerald tree boa", "jewel bug", "betta fish", "amur leopard",
  "vaquita", "javan rhino", "baiji dolphin", "hirola", "fiery-throated hummingbird", "carnotaurus",
  "madagascar pochard", "nile lechwe", "iberian lynx", "zebu", "yak", "scarlet macaw", "mandarin duck", "piebald peacock",
  "rainbow lorikeet", "harlequin tuskfish", "electric blue gecko", "red panda", "killer whale",
  "blue morpho butterfly", "red-eyed tree frog", "rainbow trout", "green anole", "doberman",
  "leaf insect", "yellow tang", "rainbow bee-eater", "blue-ringed octopus", "budgerigar", 
  "pink fairy armadillo", "golden pheasant", "blue jay", "eurasian jay", "mandarin rat snake",
  "blue gourami", "rainbow wrasse", "scarlet tanager", "green iguana", "mandarin vole",
  "blue-tailed skink", "scarlet ibis", "glossy ibis", "mandarin catfish", "ringtail possum",
  "rice weevil", "centipede", "cockroach", "mosquito", "philippine eagle", "gharial",
  "cleaner shrimp", "rain frog", "european pine marten", "european badger", "eurasian otter", "wolverine", "stoat",
  "honey badger", "leaf sheep", "ocean angel", "palmato gecko", "muntjac deer", "bare-throated bellbird",
  "king bird-of-paradise", "wilson's bird-of-paradise",
  "java mouse-deer", "blue ridge two-lined salamander", "aardwolf", "numbat", "chihuahua",
  "whippet", "shih tzu", "puli", "eastern bluebird", "peregrine falcon", "jellyfish", "horseshoe crab", "hedgehog",
  "tyrannosaurus", "triceratops", "stegosaurus", "parasaurolophus", "harpy", "chimera",
  "allosaurus", "brachiosaurus", "ankylosaurus", "utahraptor", "pterodactylus", "spinosaurus", "griffin",
  "leafy sea dragon", "musk deer", "blue glaucus", "goldfinch", "spiny softshell turtle",
  "budgerigar", "goldcrest", "common yellowthroat", "welcome swallow", "white-throated swift",
  "black vulture", "violet-green swallow", "house finch", "yellow-bellied sapsucker", "common moorhen", "great crested grebe",
  "chimney swift", "silvereye", "eurasian golden oriole", "pink-eared duck",
  "black-chinned hummingbird", "lazuli bunting", "anna's hummingbird", "green heron", "eurasian jay",
  "yellow-breasted chat", "chestnut-collared longspur", "yellow-billed cuckoo", "tui", "superb lyrebird",
  "american white pelican", "golden tortoise beetle", "indian painted grasshopper",
  "cairns birdwing", "thorn treehopper", "spiny flower mantis", "european peacock butterfly", "lantern bug",
  "malay lacewing", "rainbow stag beetle", "rosy maple moth", "tailed jay", "pygmy rabbit", "pygmy marmoset", "etruscan shrew",
  "japanese serow", "azara's agouti",  "prairie dog",
  "dwarf mongoose", "reindeer", "european mink", "harvest mouse", "kulan", "patagonian mara", "przewalski's wild horse",
  "pygmy marmoset", "wallaby", "takin", "vicuna", "white-face saki"
];

const head = base;

const ears = [
  "mouse", "horse", "moose", "sheep",
  "seal", "monkey", "meerkat",  "elephant", "gazelle",
  "lion", "tiger", "wolf", "otter", "chameleon",
  "large white pig", "wild boar", "nubian goat", "nigerian goat", "irish cob",
  "arabian horse", "okapi", "maned wolf", "fossa", "slow lori", "angora rabbit",
  "axolotl", "bearded vulture", "red panda", "cheetah", "glass frog", "mantis shrimp",
  "sun bear", "aye-aye", "markhor", "saiga antelope", "sloth",
  "pangolin", "gharial", "marine iguana", "porcupine",
  "african wild dog", "leopard", "bat-eared fox", "bongo", "orangutan", "caracal",
  "giraffe", "rhino", "howler monkey", "mountain lion", "koala", "arctic fox", "panther",
  "millipede", "aardvark", "african civet", "african penguin", "anteater",
  "armadillo", "baboon", "barn owl", "european bison", "bobcat", 
  "budgerigar", "capybara", "clownfish", "coati", "common frog",
  "cottontop tamarin", "coyote", "european hare", "fennec fox", "gemsbok", "jackal",
  "ring-tailed lemur", "llama", "european lynx", "japanese macaque",
  "mountain goat", "opossum", "pine marten", "polar bear", "red squirrel",
  "red fox", "roborovski hamster", "serval",
  "snow leopard", "hyena", "weasel", "wildebeest", "wolverine", "anteater", "arctic hare", "beaver", "bobcat",
  "camel", "chamois", "chinchilla", "chipmunk", "collared peccary", "cuscus", "dhole",
  "donkey", "dormouse", "echidna", "emperor tamarin",
  "fishing cat", "fangtooth", "ferret", "gopher", "hippopotamus", "honey badger",
  "saola", "golden-rumped elephant shrew", "dama gazelle", "chinese crested", "amur leopard", "javan rhino", "hirola",
  "madagascar pochard", "nile lechwe", "iberian lynx", "zebu", "yak",
  "rainbow lorikeet", "red panda", "killer whale", "pink fairy armadillo", "ringtail possum",
  "european pine marten", "european badger", "eurasian otter", "stoat",
  "honey badger", "leaf sheep", "ocean angel", "muntjac deer",
  "java mouse-deer", "aardwolf", "numbat", "japanese serow", "long-eared owl", "long-eared jerboa",
  "american curl", "black-tailed jackrabbit", "kangaroo rat", "red kangaroo", "mule deer", "american brahman",
  "galago", "german shepherd", "cocker spaniel", "collie", "whippet", "azara's agouti",  "prairie dog",
  "dwarf mongoose", "reindeer", "european mink", "harvest mouse", "kulan", "patagonian mara", "przewalski's wild horse",
  "pygmy marmoset", "wallaby", "takin", "vicuna", "white-face saki"
];

const eyes = base;
const nose = [
  "seal", "meerkat", "bear", "elephant", "gazelle",
  "lion", "tiger", "wolf", "camel", "otter", "chameleon",
  "large white pig", "wild boar", "nubian goat", "nigerian goat", "irish cob",
  "arabian horse", "okapi", "maned wolf", "fossa", "slow lori", "angora rabbit",
  "axolotl", "bearded vulture", "red panda", "cheetah", "glass frog", "mantis shrimp",
  "sun bear", "aye-aye", "markhor", "saiga antelope", "sloth", "sea turtle",
  "pangolin", "gharial", "marine iguana", "white tiger", "porcupine", "african crowned crane",
  "african wild dog", "leopard", "bat-eared fox", "bongo", "orangutan", "sea lion", "caracal",
  "giraffe", "rhino", "howler monkey", "mountain lion", "koala", "arctic fox", "panther",
  "millipede", "aardvark", "afghan hound", "african civet", "african penguin", "akita", "anteater",
  "arctic hare", "armadillo", "baboon", "barn owl", "bedlington terrier", "bison", "bobcat", 
  "budgerigar", "capybara", "cassowary", "clownfish", "coati", "common frog",
  "cottontop tamarin", "coyote", "dachshund", "emu", "european hare", "fennec fox", "hammerhead shark",
  "gemsbok", "golden pheasant", "common pheasant", "grasshopper", "pelican", "honey bee", "hoopoe bird", "jackal",
  "king penguin", "komodo dragon", "ladybug", "ring-tailed lemur", "llama", "lynx", "japanese macaque",
  "mountain goat", "tarantula", "opossum", "pine marten", "piranha", "polar bear", "red squirrel",
  "red fox", "kangaroo", "roborovski hamster", "ibis", "scarlet macaw", "seahorse", "secretary bird", "serval",
  "snow leopard", "hyena", "toucan", "weasel", "wildebeest", "wolverine", "star-nosed mole", "snub-nosed monkey",
  "proboscis monkey", "tapir", "pug", "great dane", "schnauzer"
];

const legs = base;
const feet = base;
const tail = [
  "seal", "meerkat", "bear", "elephant", "gazelle",
  "lion", "tiger", "wolf", "camel", "otter", "chameleon",
  "large white pig", "wild boar", "nubian goat", "nigerian goat", "irish cob",
  "arabian horse", "okapi", "maned wolf", "fossa", "angora rabbit",
  "axolotl", "red panda", "cheetah", "mantis shrimp", "sun bear", "aye-aye", "markhor", "saiga antelope",
  "pangolin", "gharial", "marine iguana", "white tiger", "porcupine", "african crowned crane",
  "african wild dog", "leopard", "bat-eared fox", "bongo", "orangutan", "sea lion", "caracal",
  "giraffe", "rhino", "howler monkey", "mountain lion", "arctic fox",
  "aardvark", "afghan hound", "african civet", "akita", "anteater",
  "arctic hare", "armadillo", "bedlington terrier", "bison", "bobcat", 
  "clownfish", "coati", "cottontop tamarin", "coyote", "european hare", "fennec fox",
  "gemsbok", "golden pheasant", "common pheasant", "grasshopper", "pelican", "honey bee", "hoopoe bird", "jackal",
  "komodo dragon", "ladybug", "ring-tailed lemur", "llama", "lynx",
  "mountain goat", "opossum", "pine marten", "piranha", "polar bear", "red squirrel",
  "red fox", "kangaroo", "roborovski hamster", "seahorse", "serval",
  "snow leopard", "hyena", "toucan", "weasel", "wildebeest", "wolverine", "giant tortoise", "river dolphin", "anteater", "arctic hare",
  "barn owl", "barracuda", "basenji", "bearded dragon", "beaver", "bichon frise", "birman",
  "t-rex", "stegosaurus", "catfish", "camel", "chamois", "caterpillar", "chicken", "chinchilla", "chipmunk",
  "collared peccary", "colossal squid", "cichlid", "clownfish", "cuscus", "darwin's frog", "dhole", "discus", "donkey", "dragonfly", "dormouse", "earwig", "echidna", "emperor tamarin",
  "fishing cat", "flamingo", "fangtooth", "ferret", "gecko", "gila monster", "german shepherd", "gopher",
  "grouse", "harpy eagle", "hippopotamus", "heron", "honey badger",  "green anole",
  "golden retriever", "lamprey", "kiwi", "mudskipper",
  "wigeon", "saola", "cuban snail", "bald ibis", "ploughshare tortoise", "resplendent quetzal",
  "angel shark", "golden-rumped elephant shrew", "peacock tarantula", "bumblebee", "dama gazelle",
  "chinese crested", "lilac-breasted roller", "swallowtail butterfly",  "gouldian finch", "rosy maple moth", "mandarin duck",
  "san francisco garter snake", "rainbow boa", "emerald tree boa", "betta fish", "amur leopard",
  "vaquita", "javan rhino", "baiji dolphin", "hirola", "fiery-throated hummingbird", "carnotaurus",
  "madagascar pochard", "nile lechwe", "iberian lynx", "zebu", "yak", "scarlet macaw", "mandarin duck", "peacock",
  "rainbow lorikeet", "harlequin tuskfish", "electric blue gecko", "red panda", "killer whale",
  "blue morpho butterfly", "red-eyed tree frog", "rainbow trout", "green anole",
  "leaf insect", "yellow tang", "rainbow bee-eater", "blue-ringed octopus", "budgerigar", 
  "pink fairy armadillo", "ringtail possum", "philippine eagle", "gharial",
  "cleaner shrimp", "rain frog", "european pine marten", "european badger", "eurasian otter", "wolverine", "stoat",
  "honey badger", "leaf sheep", "ocean angel", "palmato gecko", "muntjac deer", "cocker spaniel", "pit bull terrier",
  "java mouse-deer", "blue ridge two-lined salamander", "aardwolf", "numbat", "jack russel terrier", "chihuahua",
  "spider monkey", "scorpion", "long-tailed widowbird", "indian giant squirrel", "turquoise-browed motmot", "greater racket-tailed drongo",
  "long-eared jerboa", "wilson's bird-of-paradise", "lady amherst's pheasant", "superb lyrebird", "raccoon", "bushy-tailed mongoose",
  "striped skunk", "binturong", "short-tailed shrew", "saluki", "alaskan malamute",
  "japanese serow", "azara's agouti",  "prairie dog",
  "dwarf mongoose", "reindeer", "european mink", "harvest mouse", "kulan", "patagonian mara", "przewalski's wild horse",
  "pygmy marmoset", "wallaby", "takin", "vicuna", "white-face saki"
];

const coat = base;
const colour = base;

const extras = [
  "unicorn horn", "nose horn", "reindeer antlers", "long eyelashes",
  "huge ears", "cactus spikes", "huge eyes", "piebaldism", "insect antennae", "moose antlers",
  "bee stinger", "glowing eyes", "iridescence", "long whiskers", "fangs", "extra eyes",
  "sheep horns", "albinism", "melanism", "spines along the back", "bioluminescence",
  "erythrism", "heterochromia", "leucism", "xanthochromism", "hairless", "embedded gems", "plants", "mushrooms",
  "alien antennae", "sparkles", "ear tufts", "dragon wings", "bird wings", "multiple tails", "long claws", "mane",
  "fluffy cheeks", "fluffy ears", "colourful spots", "colourful stripes", "tusks", "roe deer antlers", "slime",
  "ankole watusi horns", "gills", "anglerfish lure", "crest feathers", "aucune particularité"
];

// Mots qui déclenchent un petit badge "araignées/insectes à l'horizon"
// (purement cosmétique, pour prévenir les personnes arachnophobes dans le salon)
const arachnidTriggers = [
  "spider", "tarantula", "whip spider", "arachnid",
  "scorpion", "centipede", "millipede", "tick", "mite"
];

// Les 3 niveaux de difficulté : chacun ajoute des traits au précédent.
// L'ordre des clés définit aussi l'ordre d'affichage dans le carrousel.
const DIFFICULTY_LEVELS = {
  easy: {
    label: "Facile",
    keys: ["base", "ears", "eyes", "nose", "colour"],
  },
  medium: {
    label: "Moyen",
    keys: ["base", "ears", "eyes", "nose", "colour", "legs", "tail"],
  },
  full: {
    label: "Complet",
    keys: ["base", "ears", "eyes", "nose", "colour", "legs", "tail", "feet", "coat"],
  },
};

const partLabels = {
  base: "Corps",
  head: "Tête",
  ears: "Oreilles",
  eyes: "Yeux",
  nose: "Museau",
  legs: "Pattes",
  feet: "Pieds",
  tail: "Queue",
  coat: "Pelage",
  colour: "Couleur",
  extras: "Particularité",
};

const partsByKey = { base, head, ears, eyes, nose, legs, feet, tail, coat, colour };

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Comme pickRandom, mais évite de retirer un animal déjà utilisé ailleurs
// dans le même tirage. Si jamais toutes les options restantes sont déjà
// utilisées (cas très improbable avec des listes de cette taille), on
// retombe sur un tirage classique plutôt que de planter.
function pickRandomExcluding(arr, usedSet) {
  const available = arr.filter((value) => !usedSet.has(value));
  return available.length > 0 ? pickRandom(available) : pickRandom(arr);
}

// Transforme "Wilson's bird-of-paradise" -> "wilsons-bird-of-paradise"
// pour retrouver un nom de fichier image cohérent (ex: /images/animals/wilsons-bird-of-paradise.jpg)
function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function containsArachnid(value) {
  const lower = value.toLowerCase();
  return arachnidTriggers.some((trigger) => lower.includes(trigger));
}

/**
 * Génère une créature composite aléatoire.
 * @param {string[]} activeKeys - les traits à tirer (dépend de la difficulté choisie)
 * @param {boolean} includeExtras - si vrai, tire aussi une "particularité"
 * Retourne un objet { id, traits, hasArachnid }
 */
function generateAnimal(activeKeys, includeExtras) {
  const keys = Array.isArray(activeKeys) && activeKeys.length ? activeKeys : DIFFICULTY_LEVELS.medium.keys;
  const traits = {};
  const usedAnimals = new Set();

  for (const key of keys) {
    const value = pickRandomExcluding(partsByKey[key], usedAnimals);
    traits[key] = value;
    usedAnimals.add(value);
  }
  if (includeExtras) {
    traits.extras = pickRandom(extras);
  }

  const hasArachnid = Object.values(traits).some(containsArachnid);

  return {
    id: `animal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    traits,
    hasArachnid,
  };
}

module.exports = {
  generateAnimal,
  DIFFICULTY_LEVELS,
  partLabels,
  slugify,
};