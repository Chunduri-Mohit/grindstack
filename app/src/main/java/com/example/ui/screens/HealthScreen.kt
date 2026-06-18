package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.DailyHabits
import com.example.ui.GrindViewModel
import com.example.ui.theme.*

@Composable
fun HealthScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val habitsOpt by viewModel.todayHabits.collectAsStateWithLifecycle()
    val todayDateStr by viewModel.todayDateStringStringState.collectAsStateWithLifecycle()
    val habits = habitsOpt ?: DailyHabits(dateString = todayDateStr)

    var bedtimeInput by remember(habits.bedtime) { mutableStateOf(habits.bedtime ?: "22:30") }
    var wakeTimeInput by remember(habits.wakeTime) { mutableStateOf(habits.wakeTime ?: "06:30") }

    val habitItems = remember(habits) {
        listOf(
            HabitItemInfo("gym", "Gym / workout", habits.gymCompleted, Icons.Default.FitnessCenter, "gym_checkbox"),
            HabitItemInfo("diet", "Clean nutrition", habits.dietCompleted, Icons.Default.Restaurant, "diet_checkbox"),
            HabitItemInfo("skincare", "Skincare (AM & PM)", habits.skincareCompleted, Icons.Default.Face, "skincare_checkbox"),
            HabitItemInfo("sleep", "7+ hours sleep", habits.sleepCompleted, Icons.Default.Bedtime, "sleep_checkbox")
        )
    }
    val doneCount = habitItems.count { it.checked }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 22.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 104.dp)
    ) {
        // Header
        item {
            Column(modifier = Modifier.fadeSlideIn()) {
                Text(
                    text = "Wellbeing",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 32.sp, letterSpacing = (-0.8).sp
                    )
                )
                Text(
                    text = "Stay primed — check off your daily basics.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp)
                )
            }
        }

        // Hero ring — habits completed today
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .fadeSlideIn(delayMillis = 70),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.auroraGlow(color = CyberGreen, alpha = 0.20f, radiusScale = 0.55f)
                ) {
                    AnimatedCircularProgress(
                        progress = doneCount / 4f,
                        diameter = 168.dp,
                        strokeWidth = 13.dp,
                        color = CyberGreen,
                        trackColor = Color.White.copy(alpha = 0.06f)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$doneCount",
                                style = TextStyle(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 48.sp)
                            )
                            Text("of 4 habits", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 12.sp))
                        }
                    }
                }
            }
        }

        // Habit list — one borderless panel
        item {
            Column(
                modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(8.dp)
            ) {
                habitItems.forEachIndexed { i, item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .clickable { viewModel.toggleDailyHabit(item.type, !item.checked) }
                            .padding(horizontal = 14.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(
                                    if (item.checked) CyberGreen.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.05f),
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(item.icon, contentDescription = null, tint = if (item.checked) CyberGreen else TextSecondary, modifier = Modifier.size(19.dp))
                        }
                        Spacer(Modifier.width(14.dp))
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary, fontWeight = FontWeight.Medium, fontSize = 15.sp),
                            modifier = Modifier.weight(1f)
                        )
                        AnimatedCircleCheckbox(
                            checked = item.checked,
                            accentColor = CyberGreen,
                            boxSize = 26.dp,
                            modifier = Modifier.testTag(item.testTag)
                        )
                    }
                    if (i < habitItems.lastIndex) {
                        HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.05f), modifier = Modifier.padding(horizontal = 14.dp))
                    }
                }
            }
        }

        // Sleep
        item {
            val duration = remember(bedtimeInput, wakeTimeInput) {
                try {
                    val sdf = java.text.SimpleDateFormat("HH:mm", java.util.Locale.US)
                    val bed = sdf.parse(bedtimeInput); val wake = sdf.parse(wakeTimeInput)
                    if (bed != null && wake != null) {
                        var diff = wake.time - bed.time
                        if (diff < 0) diff += 24 * 60 * 60 * 1000
                        String.format(java.util.Locale.US, "%.1f", diff.toFloat() / 3600000f)
                    } else "8.0"
                } catch (e: Exception) { "8.0" }
            }
            val context = LocalContext.current

            Column(
                modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                SectionTitle(icon = Icons.Default.Bedtime, title = "Sleep", accent = Secondary)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    TimeTile(
                        label = "BEDTIME", value = formatTo12h(bedtimeInput), modifier = Modifier.weight(1f),
                        onClick = {
                            val parts = bedtimeInput.split(":")
                            android.app.TimePickerDialog(context, { _, h, m ->
                                bedtimeInput = String.format(java.util.Locale.US, "%02d:%02d", h, m)
                            }, parts.getOrNull(0)?.toIntOrNull() ?: 22, parts.getOrNull(1)?.toIntOrNull() ?: 30, false).show()
                        }
                    )
                    TimeTile(
                        label = "WAKE", value = formatTo12h(wakeTimeInput), modifier = Modifier.weight(1f),
                        onClick = {
                            val parts = wakeTimeInput.split(":")
                            android.app.TimePickerDialog(context, { _, h, m ->
                                wakeTimeInput = String.format(java.util.Locale.US, "%02d:%02d", h, m)
                            }, parts.getOrNull(0)?.toIntOrNull() ?: 6, parts.getOrNull(1)?.toIntOrNull() ?: 30, false).show()
                        }
                    )
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(CyberGreen.copy(alpha = 0.08f))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Total sleep", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Text("$duration hrs", color = CyberGreen, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                GrindButton(
                    text = "SAVE SLEEP SCHEDULE",
                    onClick = { viewModel.saveSleepSchedule(bedtimeInput, wakeTimeInput) },
                    modifier = Modifier.fillMaxWidth().testTag("save_sleep_btn")
                )
            }
        }

        // Discipline
        item {
            Column(
                modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SectionTitle(icon = Icons.Default.Shield, title = "Discipline", accent = Primary)
                Spacer(Modifier.height(4.dp))
                DisciplineToggle(
                    title = "Screen time under limit",
                    subtitle = "Keep recreational use under 2 hours.",
                    checked = habits.screenTimeGoalToggled,
                    testTag = "screen_time_switch",
                    onToggle = { viewModel.saveDisciplineToggles(it, habits.limitedEntToggled) }
                )
                HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.05f))
                DisciplineToggle(
                    title = "Strict entertainment cap",
                    subtitle = "No Reels, Shorts or binge sessions.",
                    checked = habits.limitedEntToggled,
                    testTag = "entertainment_switch",
                    onToggle = { viewModel.saveDisciplineToggles(habits.screenTimeGoalToggled, it) }
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(icon: ImageVector, title: String, accent: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(30.dp).background(accent.copy(alpha = 0.16f), CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = accent, modifier = Modifier.size(16.dp))
        }
        Spacer(Modifier.width(10.dp))
        Text(title, style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 17.sp))
    }
}

@Composable
private fun TimeTile(label: String, value: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.04f))
            .pressScale(scaleDown = 0.97f, onClick = onClick)
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 10.sp, letterSpacing = 1.sp, fontWeight = FontWeight.Bold))
        Spacer(Modifier.height(6.dp))
        Text(value, style = TextStyle(fontWeight = FontWeight.Bold, fontSize = 22.sp, color = TextPrimary))
    }
}

@Composable
private fun DisciplineToggle(title: String, subtitle: String, checked: Boolean, testTag: String, onToggle: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onToggle(!checked) }.padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary, fontWeight = FontWeight.Medium, fontSize = 15.sp))
            Text(subtitle, style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp))
        }
        Spacer(Modifier.width(12.dp))
        Switch(
            checked = checked,
            onCheckedChange = onToggle,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Primary,
                uncheckedThumbColor = TextSecondary,
                uncheckedTrackColor = Color.White.copy(alpha = 0.1f)
            ),
            modifier = Modifier.testTag(testTag)
        )
    }
}

data class HabitItemInfo(
    val type: String,
    val title: String,
    val checked: Boolean,
    val icon: ImageVector,
    val testTag: String
)

private fun formatTo12h(time24: String): String {
    return try {
        val parts = time24.split(":")
        val h = parts[0].toInt(); val m = parts[1].toInt()
        val suffix = if (h >= 12) "PM" else "AM"
        val h12 = when { h == 0 -> 12; h > 12 -> h - 12; else -> h }
        String.format(java.util.Locale.US, "%d:%02d %s", h12, m, suffix)
    } catch (e: Exception) { time24 }
}
