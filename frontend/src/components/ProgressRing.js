import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

/**
 * Jauge circulaire de progression en vrai SVG (react-native-svg).
 * Remplace l'ancien faux anneau en <View>/bordures.
 *
 * Props :
 *  - percent     : 0–100
 *  - size        : diamètre en px (def. 90)
 *  - strokeWidth : épaisseur (def. 9)
 *  - color       : couleur de l'arc (def. sage)
 *  - children    : contenu central (sinon affiche le %)
 */
export default function ProgressRing({
  percent = 0,
  size = 90,
  strokeWidth = 9,
  color = COLORS.sage,
  trackColor = 'rgba(28,58,46,0.1)',
  children,
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius  = (size - strokeWidth) / 2;
  const circ    = 2 * Math.PI * radius;
  const offset  = circ - (clamped / 100) * circ;
  const center  = size / 2;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* piste de fond */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={trackColor} strokeWidth={strokeWidth} fill="none"
        />
        {/* arc de progression (départ en haut, sens horaire) */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.center}>
        {children ?? (
          <Text style={styles.pct}>{Math.round(clamped)}%</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  pct: { fontSize: 15, fontWeight: '700', color: COLORS.forest },
});
