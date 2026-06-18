package com.example.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Coffee
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.TechLog
import com.example.ui.GrindViewModel
import com.example.ui.theme.Background
import com.example.ui.theme.Primary
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.animatedInt
import com.example.ui.theme.fadeSlideIn
import com.example.ui.theme.glassCard
import com.example.ui.theme.pressScale
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private data class SubjectInfo(
    val key: String,
    val title: String,
    val icon: ImageVector,
    val target: Int
)

private val SubjectCatalog = listOf(
    SubjectInfo("Problem Solving", "DSA", Icons.Default.AutoStories, 200),
    SubjectInfo("Striver's DSA Sheet", "Striver", Icons.Default.MenuBook, 450),
    SubjectInfo("Web Dev", "Web Dev", Icons.Default.Code, 100),
    SubjectInfo("Python", "Python", Icons.Default.Terminal, 60),
    SubjectInfo("Java", "Java", Icons.Default.Coffee, 60),
    SubjectInfo("CRT", "CRT", Icons.Default.Calculate, 120)
)

@Composable
fun TechScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val techLogs by viewModel.techLogs.collectAsStateWithLifecycle()

    var selectedSubject by remember { mutableStateOf(SubjectCatalog.first().key) }
    var solvedCount by remember { mutableIntStateOf(3) }

    val todayString = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()) }
    val weekStart = remember {
        Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.DAY_OF_YEAR, -6)
        }.time
    }

    val solvedBySubject = remember(techLogs) {
        SubjectCatalog.associate { info ->
            info.key to techLogs
                .filter { resolveSubject(it.topic, it.platform) == info.key }
                .sumOf { it.count }
        }
    }
    val todaySolved = remember(techLogs, todayString) {
        techLogs.filter { it.dateString == todayString }.sumOf { it.count }
    }
    val weekSolved = remember(techLogs, weekStart) {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        techLogs.filter { log ->
            val parsed = runCatching { format.parse(log.dateString) }.getOrNull()
            parsed != null && !parsed.before(weekStart)
        }.sumOf { it.count }
    }
    val studyXp = remember(techLogs) { techLogs.sumOf { it.xpEarned } }
    val selectedInfo = SubjectCatalog.firstOrNull { it.key == selectedSubject } ?: SubjectCatalog.first()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 22.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 104.dp)
    ) {
        item {
            Column(modifier = Modifier.fadeSlideIn()) {
                Text(
                    text = "Academy",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary,
                        fontSize = 32.sp,
                        letterSpacing = 0.sp
                    )
                )
                Text(
                    text = "Log study sessions and track progress.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp)
                )
            }
        }

        item {
            StudySummaryCard(
                todaySolved = todaySolved,
                weekSolved = weekSolved,
                studyXp = studyXp
            )
        }

        item {
            LogStudyCard(
                selectedSubject = selectedSubject,
                onSubjectSelected = { selectedSubject = it },
                selectedTitle = selectedInfo.title,
                count = solvedCount,
                onCountChange = { solvedCount = it.coerceIn(1, 12) },
                onCommit = {
                    viewModel.addTechLog(selectedSubject, defaultPlatformFor(selectedSubject), solvedCount)
                }
            )
        }

        item {
            SectionTitle("Subject progress")
        }

        item {
            SubjectProgressList(solvedBySubject = solvedBySubject)
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                SectionTitle("Recent sessions")
                if (techLogs.isNotEmpty()) {
                    Text(
                        text = "${techLogs.size} logged",
                        style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 11.sp)
                    )
                }
            }
        }

        if (techLogs.isEmpty()) {
            item {
                EmptySessionsCard()
            }
        } else {
            items(techLogs.take(10), key = { it.id }) { log ->
                TechLogItemRow(log = log)
            }
        }
    }
}

@Composable
private fun StudySummaryCard(
    todaySolved: Int,
    weekSolved: Int,
    studyXp: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(24.dp))
            .padding(vertical = 20.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        AcademyStat("Today", "${animatedInt(todaySolved)}")
        StatDivider()
        AcademyStat("Week", "${animatedInt(weekSolved)}")
        StatDivider()
        AcademyStat("Study XP", "${animatedInt(studyXp)}")
    }
}

@Composable
private fun AcademyStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge.copy(
                color = Primary,
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp
            )
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = label.uppercase(Locale.US),
            style = MaterialTheme.typography.labelSmall.copy(
                color = TextMuted,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
private fun StatDivider() {
    Box(
        modifier = Modifier
            .height(34.dp)
            .width(1.dp)
            .background(Color.White.copy(alpha = 0.07f))
    )
}

@Composable
private fun LogStudyCard(
    selectedSubject: String,
    onSubjectSelected: (String) -> Unit,
    selectedTitle: String,
    count: Int,
    onCountChange: (Int) -> Unit,
    onCommit: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(24.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Log study",
            style = MaterialTheme.typography.titleMedium.copy(
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp
            )
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text = "Subject",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            SubjectChipGrid(
                selectedSubject = selectedSubject,
                onSubjectSelected = onSubjectSelected
            )
        }

        HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.06f))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            StepperButton(icon = Icons.Default.Remove, enabled = count > 1) {
                onCountChange(count - 1)
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "$count",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = Primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 48.sp
                    )
                )
                Text(
                    text = if (count == 1) "problem" else "problems",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 12.sp)
                )
            }
            StepperButton(icon = Icons.Default.Add, enabled = count < 12) {
                onCountChange(count + 1)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Primary)
                .pressScale(onClick = onCommit)
                .testTag("submit_log_btn"),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Log $selectedTitle  +${count * 15} XP",
                style = MaterialTheme.typography.labelMedium.copy(
                    color = Background,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            )
        }
    }
}

@Composable
private fun SubjectChipGrid(
    selectedSubject: String,
    onSubjectSelected: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SubjectCatalog.chunked(3).forEach { rowItems ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                rowItems.forEach { subject ->
                    SubjectChip(
                        subject = subject,
                        selected = subject.key == selectedSubject,
                        onClick = { onSubjectSelected(subject.key) },
                        modifier = Modifier.weight(1f)
                    )
                }
                repeat(3 - rowItems.size) {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SubjectChip(
    subject: SubjectInfo,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val bg by animateColorAsState(
        targetValue = if (selected) Primary.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.04f),
        animationSpec = tween(180),
        label = "subjectChipBg"
    )
    val border by animateColorAsState(
        targetValue = if (selected) Primary.copy(alpha = 0.36f) else Color.Transparent,
        animationSpec = tween(180),
        label = "subjectChipBorder"
    )
    val tint by animateColorAsState(
        targetValue = if (selected) Primary else TextSecondary,
        animationSpec = tween(180),
        label = "subjectChipTint"
    )

    Row(
        modifier = modifier
            .height(42.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(subject.icon, contentDescription = null, tint = tint, modifier = Modifier.size(15.dp))
        Spacer(Modifier.width(6.dp))
        Text(
            text = subject.title,
            style = MaterialTheme.typography.labelSmall.copy(
                color = tint,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 11.sp
            ),
            maxLines = 1
        )
    }
}

@Composable
private fun StepperButton(
    icon: ImageVector,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(Primary.copy(alpha = if (enabled) 0.12f else 0.04f))
            .border(1.dp, Primary.copy(alpha = if (enabled) 0.28f else 0.08f), CircleShape)
            .pressScale(scaleDown = 0.92f, enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (enabled) Primary else TextMuted,
            modifier = Modifier.size(21.dp)
        )
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall.copy(
            color = TextPrimary,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp
        )
    )
}

@Composable
private fun SubjectProgressList(solvedBySubject: Map<String, Int>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(20.dp))
            .padding(8.dp)
    ) {
        SubjectCatalog.forEachIndexed { index, subject ->
            SubjectProgressRow(subject = subject, solved = solvedBySubject[subject.key] ?: 0)
            if (index < SubjectCatalog.lastIndex) {
                HorizontalDivider(
                    thickness = 0.5.dp,
                    color = Color.White.copy(alpha = 0.05f),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )
            }
        }
    }
}

@Composable
private fun SubjectProgressRow(subject: SubjectInfo, solved: Int) {
    val progress = (solved.toFloat() / subject.target).coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(400),
        label = "subjectProgress"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(Primary.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(subject.icon, contentDescription = null, tint = Primary, modifier = Modifier.size(16.dp))
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = subject.title,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                )
                Text(
                    text = "$solved/${subject.target}",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(5.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.07f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(999.dp))
                        .background(Primary)
                )
            }
        }
    }
}

@Composable
private fun EmptySessionsCard() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(20.dp))
            .padding(vertical = 28.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "No sessions yet. Log your first one above.",
            style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 13.sp)
        )
    }
}

@Composable
fun TechLogItemRow(log: TechLog) {
    val subject = resolveSubject(log.topic, log.platform)
    val info = SubjectCatalog.firstOrNull { it.key == subject } ?: SubjectCatalog.first()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .background(Primary.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(info.icon, contentDescription = null, tint = Primary, modifier = Modifier.size(17.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = info.title,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    ),
                    maxLines = 1
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    text = "${log.count} solved",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp, color = TextSecondary),
                    maxLines = 1
                )
            }
        }
        Spacer(Modifier.width(10.dp))
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "+${log.xpEarned} XP",
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontSize = 13.sp,
                    color = Primary,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = log.dateString,
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 10.sp, color = TextMuted)
            )
        }
    }
}

private fun defaultPlatformFor(subject: String): String = when (subject) {
    "Problem Solving" -> "LeetCode"
    "Striver's DSA Sheet" -> "Striver's Sheet"
    "CRT" -> "Smart Interviews"
    "Web Dev" -> "Web Dev"
    "Python" -> "Python"
    "Java" -> "Java"
    else -> "Study"
}

private fun resolveSubject(topic: String, platform: String): String {
    val topicLower = topic.lowercase(Locale.US).trim()
    val platformLower = platform.lowercase(Locale.US).trim()

    return when {
        topicLower.contains("striver") || platformLower.contains("striver") || platformLower.contains("sheet") -> "Striver's DSA Sheet"
        topicLower.contains("crt") || topicLower.contains("smart") || topicLower.contains("interview") || platformLower.contains("smart") || platformLower.contains("interview") -> "CRT"
        topicLower.contains("web") || topicLower.contains("html") || topicLower.contains("css") || topicLower.contains("js") || topicLower.contains("javascript") || topicLower.contains("react") || topicLower.contains("node") || platformLower.contains("web") -> "Web Dev"
        topicLower.contains("python") || topicLower.contains("django") || topicLower.contains("flask") || topicLower.contains("numpy") || topicLower.contains("pandas") || topicLower.contains("py") || platformLower.contains("python") -> "Python"
        (topicLower.contains("java") && !topicLower.contains("javascript") && !topicLower.contains("js")) || platformLower.contains("java") -> "Java"
        topicLower.contains("problem") || topicLower.contains("solving") || topicLower.contains("dsa") || topicLower.contains("leetcode") || topicLower.contains("codechef") || platformLower.contains("leetcode") || platformLower.contains("codechef") -> "Problem Solving"
        else -> {
            SubjectCatalog.firstOrNull { it.key.equals(topic, ignoreCase = true) || it.title.equals(topic, ignoreCase = true) }?.key
                ?: "Problem Solving"
        }
    }
}
