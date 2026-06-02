import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detectorPromise = null;

const MIN_SCORE = 0.35;

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!mag) return 0;
  const ratio = Math.max(-1, Math.min(1, dot / mag));
  return (Math.acos(ratio) * 180) / Math.PI;
}

function point(pose, name) {
  const keypoint = pose?.keypoints?.find((kp) => kp.name === name);
  if (!keypoint || (keypoint.score ?? 0) < MIN_SCORE) return null;
  return keypoint;
}

function middle(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

async function imageTensorFromUri(uri) {
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  return decodeJpeg(new Uint8Array(buffer));
}

export async function loadPoseDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      await tf.ready();
      try {
        await tf.setBackend('rn-webgl');
      } catch (error) {
        await tf.setBackend('cpu');
      }
      await tf.ready();
      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      });
    })();
  }

  return detectorPromise;
}

export async function detectPoseFromUri(uri) {
  const detector = await loadPoseDetector();
  const tensor = await imageTensorFromUri(uri);

  try {
    const poses = await detector.estimatePoses(tensor, { flipHorizontal: true });
    return poses[0] ?? null;
  } finally {
    tensor.dispose();
  }
}

function evaluateSquat(pose) {
  const leftHip = point(pose, 'left_hip');
  const rightHip = point(pose, 'right_hip');
  const leftKnee = point(pose, 'left_knee');
  const rightKnee = point(pose, 'right_knee');
  const leftAnkle = point(pose, 'left_ankle');
  const rightAnkle = point(pose, 'right_ankle');
  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return { status: 'neutral', message: 'Place tout ton corps dans le cadre.' };
  }

  const leftAngle = angle(leftHip, leftKnee, leftAnkle);
  const rightAngle = angle(rightHip, rightKnee, rightAnkle);
  const kneeAngle = (leftAngle + rightAngle) / 2;

  if (kneeAngle < 105 && kneeAngle > 70) {
    return { status: 'good', score: 92, message: 'Parfait, le squat est bien descendu.' };
  }
  if (kneeAngle >= 105) {
    return { status: 'correction', score: 62, message: 'Descends un peu plus pour mieux plier les genoux.' };
  }
  return { status: 'correction', score: 58, message: 'Remonte légèrement, tu es trop bas.' };
}

function evaluateJumpingJacks(pose) {
  const ls = point(pose, 'left_shoulder');
  const rs = point(pose, 'right_shoulder');
  const lw = point(pose, 'left_wrist');
  const rw = point(pose, 'right_wrist');
  const la = point(pose, 'left_ankle');
  const ra = point(pose, 'right_ankle');
  if (!ls || !rs || !lw || !rw || !la || !ra) {
    return { status: 'neutral', message: 'Place bras et jambes dans le cadre.' };
  }

  const shoulderSpread = distance(ls, rs);
  const wristSpread = distance(lw, rw);
  const ankleSpread = distance(la, ra);
  const handsUp = lw.y < ls.y && rw.y < rs.y;
  const legsOpen = ankleSpread > shoulderSpread * 1.15;
  const armsOpen = wristSpread > shoulderSpread * 1.2;

  if (handsUp && legsOpen && armsOpen) {
    return { status: 'good', score: 90, message: 'Excellent, jumping jack bien exécuté.' };
  }
  if (!handsUp) {
    return { status: 'correction', score: 60, message: 'Monte les bras plus haut au-dessus des épaules.' };
  }
  if (!legsOpen) {
    return { status: 'correction', score: 64, message: 'Écarte davantage les jambes.' };
  }
  return { status: 'correction', score: 67, message: 'Ouvre les bras et les jambes en même temps.' };
}

function evaluatePushUp(pose) {
  const ls = point(pose, 'left_shoulder');
  const rs = point(pose, 'right_shoulder');
  const le = point(pose, 'left_elbow');
  const re = point(pose, 'right_elbow');
  const lw = point(pose, 'left_wrist');
  const rw = point(pose, 'right_wrist');
  const lh = point(pose, 'left_hip');
  const rh = point(pose, 'right_hip');
  const la = point(pose, 'left_ankle');
  const ra = point(pose, 'right_ankle');
  if (!ls || !rs || !le || !re || !lw || !rw || !lh || !rh || !la || !ra) {
    return { status: 'neutral', message: 'Allonge-toi bien face à la caméra.' };
  }

  const elbowAngle = (angle(ls, le, lw) + angle(rs, re, rw)) / 2;
  const bodyLine = angle(ls, middle(lh, rh), middle(la, ra));

  if (elbowAngle < 115 && elbowAngle > 65 && bodyLine > 150) {
    return { status: 'good', score: 91, message: 'Très bien, la pompe est propre et gainée.' };
  }
  if (bodyLine <= 150) {
    return { status: 'correction', score: 63, message: 'Gaine le corps, évite que les hanches tombent.' };
  }
  return { status: 'correction', score: 65, message: 'Fléchis davantage les coudes pour descendre.' };
}

function evaluatePlank(pose) {
  const ls = point(pose, 'left_shoulder');
  const rs = point(pose, 'right_shoulder');
  const lh = point(pose, 'left_hip');
  const rh = point(pose, 'right_hip');
  const la = point(pose, 'left_ankle');
  const ra = point(pose, 'right_ankle');
  if (!ls || !rs || !lh || !rh || !la || !ra) {
    return { status: 'neutral', message: 'Aligne épaules, hanches et chevilles.' };
  }

  const lineAngle = angle(ls, middle(lh, rh), middle(la, ra));
  if (lineAngle > 155) {
    return { status: 'good', score: 93, message: 'Gainage solide, le corps est bien aligné.' };
  }
  return { status: 'correction', score: 68, message: 'Redresse le bassin pour aligner ton corps.' };
}

function evaluateLunge(pose) {
  const lh = point(pose, 'left_hip');
  const rh = point(pose, 'right_hip');
  const lk = point(pose, 'left_knee');
  const rk = point(pose, 'right_knee');
  const la = point(pose, 'left_ankle');
  const ra = point(pose, 'right_ankle');
  if (!lh || !rh || !lk || !rk || !la || !ra) {
    return { status: 'neutral', message: 'Avance bien une jambe dans le cadre.' };
  }

  const leftAngle = angle(lh, lk, la);
  const rightAngle = angle(rh, rk, ra);
  const kneeAngle = Math.min(leftAngle, rightAngle);

  if (kneeAngle < 110 && kneeAngle > 70) {
    return { status: 'good', score: 89, message: 'Fente bien placée, continue comme ça.' };
  }
  return { status: 'correction', score: 64, message: 'Fléchis un peu plus le genou avant.' };
}

export function evaluateExercisePose(exercice, pose) {
  if (!pose) {
    return { status: 'neutral', score: 0, message: 'Je ne te vois pas encore clairement.' };
  }

  const title = normalize(exercice?.title);
  if (title.includes('squat')) return evaluateSquat(pose);
  if (title.includes('jumping') || title.includes('jack')) return evaluateJumpingJacks(pose);
  if (title.includes('pompe') || title.includes('push')) return evaluatePushUp(pose);
  if (title.includes('gainage') || title.includes('plank')) return evaluatePlank(pose);
  if (title.includes('fente') || title.includes('lunge')) return evaluateLunge(pose);

  return {
    status: 'neutral',
    score: 50,
    message: 'Exercice détecté. Le coach IA n’a pas encore de règle dédiée ici.',
  };
}

export function getCoachLabel(exercice) {
  const title = normalize(exercice?.title);
  if (title.includes('squat')) return 'Squat';
  if (title.includes('jumping') || title.includes('jack')) return 'Jumping jacks';
  if (title.includes('pompe') || title.includes('push')) return 'Pompes';
  if (title.includes('gainage') || title.includes('plank')) return 'Gainage';
  if (title.includes('fente') || title.includes('lunge')) return 'Fentes';
  return exercice?.title || 'Exercice';
}
