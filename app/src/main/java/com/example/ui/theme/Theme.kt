package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val GrindStackColorScheme = darkColorScheme(
    primary = Primary,
    secondary = Secondary,
    tertiary = Tertiary,
    background = Background,
    surface = Surface,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onTertiary = Color.Black,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceContainer,
    onSurfaceVariant = TextSecondary,
    outline = Outline
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true, // Force Dark Theme only per spec
    dynamicColor: Boolean = false, // Enforce unified custom color branding
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = GrindStackColorScheme,
        typography = Typography,
        content = content
    )
}
