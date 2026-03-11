// styles/global.ts
// Styles partagés entre plusieurs écrans.
// Chaque écran peut importer ce dont il a besoin et compléter avec ses propres styles locaux.

import { StyleSheet } from 'react-native';
import { colors, spacing, radius, text } from './theme';

export const global = StyleSheet.create({

  // ── Conteneurs ────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenCentered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },

  // ── Cartes ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Titres ────────────────────────────────────────────────────────────────
  headerTitle: {
    fontSize: text.h1,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Textes ────────────────────────────────────────────────────────────────
  textPrimary: {
    color: colors.textPrimary,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  textMuted: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: text.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ── Boutons ───────────────────────────────────────────────────────────────
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl + 4,
    alignItems: 'center' as const,
  },
  btnFull: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    width: '100%' as const,
    alignItems: 'center' as const,
  },
  btnDark: {
    backgroundColor: colors.dark,
  },
  btnText: {
    color: colors.textPrimary,
    fontSize: text.lg,
    fontWeight: '600' as const,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute' as const,
    bottom: spacing.xxl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 36,
  },

  // ── Barre de recherche ────────────────────────────────────────────────────
  searchBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: text.base,
    paddingVertical: spacing.md,
  },
  searchIcon: {
    fontSize: text.lg,
    marginRight: spacing.sm,
  },
  clearBtn: {
    color: colors.textMuted,
    fontSize: text.lg,
    paddingLeft: spacing.sm,
  },

  // ── Chips (genre, météo) ──────────────────────────────────────────────────
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: text.md,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: colors.textPrimary,
  },

  // ── Modal bottom sheet ────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
  },
  sheet: {
    backgroundColor: colors.sheet,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: text.xl,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  sheetLabel: {
    color: colors.textSecondary,
    fontSize: text.md,
    fontWeight: '500' as const,
  },

  // ── État vide ─────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center' as const,
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '500' as const,
  },
  emptyHint: {
    color: colors.textDisabled,
    fontSize: text.md,
  },

  // ── Badge météo ───────────────────────────────────────────────────────────
  moodBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  moodLabel: {
    fontSize: text.base,
    fontWeight: '600' as const,
  },

  // ── Covers / images ───────────────────────────────────────────────────────
  coverSm: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  coverMd: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
  },

  // ── Messages d'erreur ─────────────────────────────────────────────────────
  error: {
    fontSize: text.md,
    color: colors.error,
  },
});