import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { C } from '../theme';

// TextInput with a fixed "$" in front of the value.
export default function MoneyInput({ style, wrapStyle, ...props }) {
  return (
    <View style={[st.wrap, wrapStyle]}>
      <TextInput style={[style, st.input]} {...props} />
      <Text style={st.sign} pointerEvents="none">$</Text>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  input: { flex: 0, paddingLeft: 22 },
  sign: { position: 'absolute', left: 10, color: C.dim, fontSize: 16, fontWeight: '600' },
});
