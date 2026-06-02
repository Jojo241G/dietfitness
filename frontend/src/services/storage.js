import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Petit wrapper typé autour d'AsyncStorage.
 * Centralise les clés de stockage pour éviter les fautes de frappe
 * dispersées dans le code.
 */

export const KEYS = {
  TOKEN  : '@df_token',
  PROFIL : '@df_profil',
  DEFIS  : '@df_defis',
};

export async function saveItem(key, value) {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, raw);
  } catch (e) {
    console.warn('[storage] échec sauvegarde', key, e);
  }
}

export async function loadItem(key, { parse = false } = {}) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return parse ? JSON.parse(raw) : raw;
  } catch (e) {
    console.warn('[storage] échec lecture', key, e);
    return null;
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('[storage] échec suppression', key, e);
  }
}
