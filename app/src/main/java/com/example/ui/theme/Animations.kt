package com.example.ui.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.gestures.detectTapGestures
import kotlinx.coroutines.delay

/**
 * Entrance reveal: fades + slides + gently scales the content in the first time it
 * enters composition. Pure [graphicsLayer] work, so it is GPU-cheap and never blocks
 * scroll. The travel and scale are deliberately punchy so the reveal is actually
 * visible (the old 24dp/no-scale version was too subtle to notice).
 *
 * Use on hero/header/section blocks. Pair with a per-index [delayMillis] to stagger a
 * column so blocks cascade in rather than appearing all at once.
 */
fun Modifier.fadeSlideIn(
    delayMillis: Int = 0,
    travelDp: Float = 40f,
    durationMillis: Int = 480
): Modifier = composed {
    val progress = remember { Animatable(0f) }
    androidx.compose.runtime.LaunchedEffect(Unit) {
        if (delayMillis > 0) delay(delayMillis.toLong())
        progress.animateTo(1f, animationSpec = tween(durationMillis, easing = FastOutSlowInEasing))
    }
    this.graphicsLayer {
        val p = progress.value
        alpha = p
        translationY = (1f - p) * travelDp
        val s = 0.92f + 0.08f * p
        scaleX = s
        scaleY = s
    }
}

/** Per-index stagger delay for a column of revealed blocks. Caps so long lists don't
 *  wait absurdly long for the last item. */
fun staggerDelay(index: Int, step: Int = 70, max: Int = 420): Int =
    (index * step).coerceAtMost(max)

/**
 * Remembers an Int that animates from its previous value to [target] whenever [target]
 * changes — for "counting up" stats (XP, level, completed-count). Reads as premium and
 * is far more noticeable than a static number snapping into place.
 */
@Composable
fun animatedInt(target: Int, durationMillis: Int = 700): Int {
    val anim by androidx.compose.animation.core.animateIntAsState(
        targetValue = target,
        animationSpec = tween(durationMillis, easing = FastOutSlowInEasing),
        label = "animatedInt"
    )
    return anim
}

/**
 * Adds a tactile press-and-release scale to any element while still firing [onClick].
 * Spring-based, so it only animates on interaction (no idle cost).
 */
fun Modifier.pressScale(
    scaleDown: Float = 0.97f,
    enabled: Boolean = true,
    onClick: () -> Unit
): Modifier = composed {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) scaleDown else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "pressScale"
    )
    this
        .scale(scale)
        .pointerInput(enabled) {
            if (enabled) {
                detectTapGestures(
                    onPress = {
                        pressed = true
                        tryAwaitRelease()
                        pressed = false
                    },
                    onTap = { onClick() }
                )
            }
        }
}

/**
 * Circular progress ring whose sweep animates smoothly to [progress] (0f..1f).
 * Uses a sweep-gradient stroke with a rounded cap for a premium glow finish.
 */
@Composable
fun AnimatedCircularProgress(
    progress: Float,
    modifier: Modifier = Modifier,
    diameter: Dp = 100.dp,
    strokeWidth: Dp = 5.dp,
    color: Color = Primary,
    trackColor: Color = Color.White.copy(alpha = 0.06f),
    content: @Composable () -> Unit = {}
) {
    val animated by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(900, easing = FastOutSlowInEasing),
        label = "circularProgress"
    )
    Box(contentAlignment = Alignment.Center, modifier = modifier.size(diameter)) {
        Canvas(modifier = Modifier.size(diameter)) {
            val stroke = strokeWidth.toPx()
            val inset = stroke / 2f
            val arcSize = Size(size.width - stroke, size.height - stroke)
            drawArc(
                color = trackColor,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )
            if (animated > 0f) {
                drawArc(
                    brush = Brush.sweepGradient(
                        listOf(color.copy(alpha = 0.55f), color, color)
                    ),
                    startAngle = -90f,
                    sweepAngle = animated * 360f,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = arcSize,
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
        }
        content()
    }
}

/**
 * Square checkbox (dashboard task style) with an animated tick pop + colour fill.
 */
@Composable
fun AnimatedSquareCheckbox(
    checked: Boolean,
    accentColor: Color,
    modifier: Modifier = Modifier,
    boxSize: Dp = 20.dp
) {
    val fill by animateColorAsState(
        targetValue = if (checked) accentColor else Color.Transparent,
        animationSpec = tween(180), label = "sqFill"
    )
    val borderColor by animateColorAsState(
        targetValue = if (checked) accentColor else TextSecondary,
        animationSpec = tween(180), label = "sqBorder"
    )
    val tickScale by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "sqTick"
    )
    Box(
        modifier = modifier
            .size(boxSize)
            .clip(RoundedCornerShape(6.dp))
            .border(1.dp, borderColor, RoundedCornerShape(6.dp))
            .background(fill, RoundedCornerShape(6.dp)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            tint = SpaceBlack,
            modifier = Modifier
                .size(boxSize * 0.6f)
                .scale(tickScale)
        )
    }
}

/**
 * Circular checkbox (health habit style) with an animated tick pop + colour fill.
 */
@Composable
fun AnimatedCircleCheckbox(
    checked: Boolean,
    accentColor: Color,
    modifier: Modifier = Modifier,
    boxSize: Dp = 24.dp
) {
    val fill by animateColorAsState(
        targetValue = if (checked) accentColor else Color.Transparent,
        animationSpec = tween(180), label = "ccFill"
    )
    val borderColor by animateColorAsState(
        targetValue = if (checked) accentColor else Color.White.copy(alpha = 0.2f),
        animationSpec = tween(180), label = "ccBorder"
    )
    val tickScale by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "ccTick"
    )
    Box(
        modifier = modifier
            .size(boxSize)
            .clip(CircleShape)
            .border(1.5.dp, borderColor, CircleShape)
            .background(fill, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            tint = SpaceBlack,
            modifier = Modifier
                .size(boxSize * 0.6f)
                .scale(tickScale)
        )
    }
}
