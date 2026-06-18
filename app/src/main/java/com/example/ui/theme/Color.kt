package com.example.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * GrindStack palette — true black canvas, one confident lime accent, white type.
 * Disciplined and premium: a single hue does all the work (no multi-colour gradients).
 * Every legacy name is kept and re-pointed so the whole app re-skins from this file.
 */

// ---- Canvas & surfaces ----------------------------------------------------
val Background = Color(0xFF000000)        // true black
val Surface = Color(0xFF000000)
val SurfaceContainer = Color(0xFF161616)  // dark-grey card on black
val SurfaceVariant = Color(0xFF1F1F1F)
val OutlineVariant = Color(0x12FFFFFF)
val Outline = Color(0x1AFFFFFF)

// ---- Text -----------------------------------------------------------------
val TextPrimary = Color(0xFFF5F5F7)       // soft white
val TextSecondary = Color(0xFF9A9AA2)     // grey
val TextMuted = Color(0xFF636368)         // muted grey

// ---- Accent (single hue) --------------------------------------------------
val Lime = Color(0xFFC9F24C)              // the one accent
val LimeDim = Color(0xFFA8CC3E)           // pressed / dimmer lime
val Primary = Lime
val Secondary = Lime
val Tertiary = Lime
val AuroraCyan = Lime                     // re-pointed (no second hue)
val AuroraEmerald = Lime                  // success / health = same lime

// Gradient stops kept for source compatibility — all lime, so no rainbow.
val AuroraStart = Lime
val AuroraMid = Lime
val AuroraEnd = LimeDim

// ---- Functional -----------------------------------------------------------
val Danger = Color(0xFFFF453A)            // destructive only (delete)

// ---- Legacy aliases (kept so existing screens compile, re-pointed) --------
val SpaceBlack = Background
val CardBg = Color(0x0AFFFFFF)            // soft 4% white fill
val CardBorder = Color(0x0FFFFFFF)        // barely-there 6%
val WarmAccentWhite = TextPrimary
val MutedWarmWhite = TextSecondary
val TextGray = TextMuted
val CyberGreen = Lime
val CyberPurple = Lime
val AccentOrange = Lime
val AccentGreen = Lime
val AccentPurple = Lime
val AccentBlue = Lime

val TechPillBg = Color(0x1FC9F24C)        // lime tint
val TechPillText = Lime
val HealthPillBg = Color(0x1FC9F24C)
val HealthPillText = Lime
val DisciplinePillBg = Color(0x1FC9F24C)
val DisciplinePillText = Lime

val OrangerRed = Danger
val MutedGreen = Color(0x80C9F24C)
val MutedPurple = Color(0x80C9F24C)
