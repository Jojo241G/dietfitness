/**
 * Parcours guidés prédéfinis. Les indications sont déclenchées par paliers de
 * distance (en mètres). Le module simule un itinéraire en énonçant ces étapes
 * au fur et à mesure que l'utilisateur progresse (texte + voix).
 */
export const PARCOURS = [
  {
    id: 'debutant_2k',
    nom: 'Découverte — 2 km',
    niveau: 'Débutant',
    distanceCible: 2000,
    duree: '~25 min',
    description: 'Marche rapide idéale pour reprendre en douceur.',
    etapes: [
      { a: 0,    texte: "C'est parti ! Marche à un rythme régulier et confortable." },
      { a: 500,  texte: "500 mètres. Garde le dos droit et respire profondément." },
      { a: 1000, texte: "Mi-parcours, 1 kilomètre. Tu peux accélérer légèrement." },
      { a: 1500, texte: "1,5 kilomètre. Plus que 500 mètres, tiens bon !" },
      { a: 2000, texte: "Bravo, 2 kilomètres atteints ! Termine par une marche lente." },
    ],
  },
  {
    id: 'intermediaire_5k',
    nom: 'Endurance — 5 km',
    niveau: 'Intermédiaire',
    distanceCible: 5000,
    duree: '~40 min',
    description: 'Alternance marche/course pour travailler le cardio.',
    etapes: [
      { a: 0,    texte: "Échauffement : 3 minutes de marche rapide pour commencer." },
      { a: 800,  texte: "800 mètres. Passe maintenant à un jogging léger." },
      { a: 2000, texte: "2 kilomètres. Maintiens une allure régulière, respire bien." },
      { a: 3000, texte: "3 kilomètres, tu es à plus de la moitié. Reste concentré." },
      { a: 4000, texte: "4 kilomètres. Dernier kilomètre, donne ce qu'il te reste !" },
      { a: 5000, texte: "Objectif atteint, 5 kilomètres ! Récupère en marchant." },
    ],
  },
  {
    id: 'avance_8k',
    nom: 'Performance — 8 km',
    niveau: 'Avancé',
    distanceCible: 8000,
    duree: '~55 min',
    description: 'Course soutenue pour les profils entraînés.',
    etapes: [
      { a: 0,    texte: "Départ. Trouve ton allure de croisière dès les premiers mètres." },
      { a: 2000, texte: "2 kilomètres. Tu es bien lancé, garde le rythme." },
      { a: 4000, texte: "Mi-parcours, 4 kilomètres. Hydrate-toi si nécessaire." },
      { a: 6000, texte: "6 kilomètres. Reste fort mentalement, ça paie maintenant." },
      { a: 7000, texte: "7 kilomètres. Dernier kilomètre, accélère progressivement !" },
      { a: 8000, texte: "Magnifique, 8 kilomètres bouclés ! Marche pour récupérer." },
    ],
  },
];
