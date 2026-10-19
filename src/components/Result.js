import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../theme';
import { s } from '../styles';

// Thin bar showing a 0..1 fraction, under a result value.
export function Bar({ fraction }) {
  return (
    <View style={st.bg}>
      <View style={[st.fill, { width: `${Math.min(1, Math.max(0, fraction)) * 100}%` }]} />
    </View>
  );
}

// Placeholder for a result that isn't available: "…" while computing, "–" otherwise.
export function NoResult({ busy }) {
  return <Text style={s.pctDim}>{busy ? '…' : '–'}</Text>;
}

const st = StyleSheet.create({
  bg: { width: '100%', height: 3, borderRadius: 2, backgroundColor: C.line, marginTop: 1 },
  fill: { height: 3, borderRadius: 2, backgroundColor: C.amber },
});
