package com.example.ui.theme

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Solid lime — the single accent. (Kept as a brush for source compatibility.) */
fun auroraBrush() = Brush.linearGradient(listOf(Lime, Lime))

/**
 * True-black backdrop with one barely-there lime glow in the upper area.
 *
 * Painted statically (no infinite animation). The old version reran a 14s transition
 * that invalidated and redrew this full-screen gradient on every frame, forever —
 * forcing the whole window to redraw even while idle and during scroll, which read as
 * constant micro-jank. The drift was imperceptibly slow, so dropping it costs nothing
 * visually and lets the background layer draw exactly once.
 */
fun Modifier.animatedGlassBackground(): Modifier = this.background(Background)

/**
 * Borderless frosted surface — the default card. No hard outline (that was the boxy
 * look); just a soft top-lit translucent fill with generously rounded corners.
 */
fun Modifier.glassCard(
    shape: Shape = RoundedCornerShape(24.dp),
    borderAlpha: Float = 0f // kept for source compatibility; borderless by design
) = this
    .clip(shape)
    .background(Color.White.copy(alpha = 0.055f))

/**
 * Feature surface tinted by an accent, with an inner top glow. Used for hero/standout
 * cards so they read as lit panels rather than outlined boxes.
 */
fun Modifier.auroraCard(
    accent: Color = Primary,
    shape: Shape = RoundedCornerShape(28.dp),
    tint: Float = 0.16f
) = this
    .clip(shape)
    .background(accent.copy(alpha = tint))

/**
 * Soft coloured glow painted *behind* an element — fakes a colored shadow for buttons,
 * rings and badges. GPU-cheap (single radial gradient).
 */
fun Modifier.auroraGlow(
    color: Color = Primary,
    alpha: Float = 0.35f,
    radiusScale: Float = 0.95f
) = this.drawBehind {
    val r = size.maxDimension * radiusScale
    drawCircle(
        brush = Brush.radialGradient(
            colors = listOf(color.copy(alpha = alpha), Color.Transparent),
            center = center,
            radius = r
        ),
        radius = r,
        center = center
    )
}

/** Tactile press-and-release scale for any element. */
fun Modifier.pressable(
    scaleDown: Float = 0.97f,
    enabled: Boolean = true,
    onClick: () -> Unit
): Modifier = pressScale(scaleDown, enabled, onClick)

/**
 * Primary call-to-action: a glowing aurora gradient pill with a press response.
 */
@Composable
fun GrindButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1f,
        animationSpec = tween(100),
        label = "ButtonScale"
    )

    Box(
        modifier = modifier
            .scale(scale)
            .auroraGlow(color = Lime, alpha = if (enabled) 0.22f else 0f, radiusScale = 0.6f)
            .height(54.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (enabled) auroraBrush()
                else Brush.horizontalGradient(listOf(SurfaceVariant, SurfaceVariant))
            )
            .pointerInput(enabled) {
                if (enabled) {
                    detectTapGestures(
                        onPress = { isPressed = true; tryAwaitRelease(); isPressed = false },
                        onTap = { onClick() }
                    )
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = TextStyle(
                fontFamily = FontFamily.SansSerif,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = if (enabled) Color.Black else TextMuted
            )
        )
    }
}
