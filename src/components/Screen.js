import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { C } from '../theme';
import { s } from '../styles';

// "GTO Finance" heading with a subtitle on the right, or any element passed as `right`.
export function ScreenTitle({ subtitle, right }) {
  return (
    <View style={st.titleRow}>
      <Text style={st.title}>GTO Finance</Text>
      {right ?? <Text style={s.sub}>{subtitle}</Text>}
    </View>
  );
}

// Scrolling form screen that stays clear of the keyboard, with the title row on top.
export default function FormScreen({ subtitle, children }) {
  return (
    <View style={s.safe}>
      <KeyboardAvoidingView style={st.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <ScreenTitle subtitle={subtitle} />
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
