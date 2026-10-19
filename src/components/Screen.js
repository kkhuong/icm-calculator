import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { C } from '../theme';
import { s } from '../styles';

// Screen heading on the left (optional) and an optional element, like a Clear action, on the right.
export function ScreenTitle({ title, right }) {
  return (
    <View style={st.titleRow}>
      {title ? <Text style={st.title}>{title}</Text> : <View />}
      {right}
    </View>
  );
}

// Scrolling form screen that stays clear of the keyboard, with the title row on top.
export default function FormScreen({ title, children }) {
  return (
    <View style={s.safe}>
      <KeyboardAvoidingView style={st.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <ScreenTitle title={title} />
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
});
