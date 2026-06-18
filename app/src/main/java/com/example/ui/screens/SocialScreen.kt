package com.example.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.GroupMember
import com.example.ui.GrindViewModel
import com.example.ui.theme.*

@Composable
fun SocialScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val leaderboard by viewModel.leaderboard.collectAsStateWithLifecycle()

    var groupLinkInput by remember { mutableStateOf("") }
    var groupNameInput by remember { mutableStateOf("") }
    var selectedPlayerForDetails by remember { mutableStateOf<GroupMember?>(null) }
    var isCreatingNewSquad by remember { mutableStateOf(false) }
    var joinLinkError by remember { mutableStateOf<String?>(null) }

    val currentGroupId = profile?.currentGroupId
    LaunchedEffect(currentGroupId) {
        if (currentGroupId != null) viewModel.syncSquadMembers(currentGroupId)
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
            .padding(horizontal = 22.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 104.dp)
    ) {
        item {
            Column(modifier = Modifier.fadeSlideIn()) {
                Text(
                    text = "Squad",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 32.sp, letterSpacing = (-0.8).sp
                    )
                )
                Text(
                    text = "Grind together. Hold the line.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp)
                )
            }
        }

        if (currentGroupId == null) {
            // ---- Empty state + join/create -------------------------------
            item {
                Column(
                    modifier = Modifier.fillMaxWidth().fadeSlideIn(delayMillis = 70),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.auroraGlow(color = Primary, alpha = 0.22f, radiusScale = 0.7f)
                    ) {
                        Box(
                            modifier = Modifier.size(84.dp).clip(CircleShape).background(Primary.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) { Icon(Icons.Default.Groups, contentDescription = null, tint = Primary, modifier = Modifier.size(38.dp)) }
                    }
                    Spacer(Modifier.height(14.dp))
                    Text("You're solo right now", style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp))
                    Text(
                        "Join a squad or start your own to compete on a live leaderboard.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 13.sp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }
            }

            item {
                // Segmented toggle
                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = 0.05f)).padding(4.dp)
                ) {
                    SegTab("Join", !isCreatingNewSquad, Modifier.weight(1f)) { isCreatingNewSquad = false }
                    SegTab("Create", isCreatingNewSquad, Modifier.weight(1f)) { isCreatingNewSquad = true }
                }
            }

            item {
                Column(
                    modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (isCreatingNewSquad) {
                        OutlinedTextField(
                            value = groupNameInput,
                            onValueChange = { groupNameInput = it },
                            label = { Text("Squad name", color = TextMuted) },
                            placeholder = { Text("e.g. FAANG 10x Grinders", color = TextMuted.copy(alpha = 0.5f)) },
                            modifier = Modifier.fillMaxWidth().testTag("group_name_input"),
                            shape = RoundedCornerShape(14.dp),
                            colors = squadFieldColors()
                        )
                    } else {
                        OutlinedTextField(
                            value = groupLinkInput,
                            onValueChange = { groupLinkInput = it; joinLinkError = null },
                            label = { Text("Invite code / link", color = TextMuted) },
                            placeholder = { Text("grindstack.app/hub-xplqrs1", color = TextMuted.copy(alpha = 0.5f)) },
                            isError = joinLinkError != null,
                            supportingText = joinLinkError?.let { { Text(it, color = MaterialTheme.colorScheme.error) } },
                            modifier = Modifier.fillMaxWidth().testTag("group_link_input"),
                            shape = RoundedCornerShape(14.dp),
                            colors = squadFieldColors()
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth().height(54.dp).clip(RoundedCornerShape(16.dp))
                            .auroraGlow(Primary, 0.25f, 0.55f)
                            .background(auroraBrush())
                            .pressScale {
                                if (isCreatingNewSquad) {
                                    val name = if (groupNameInput.isBlank()) "Standard Grinding Corps" else groupNameInput
                                    val id = "hub-${name.lowercase().replace(" ", "-")}-${(1000..9999).random()}"
                                    viewModel.joinGroup(id, name)
                                } else {
                                    if (groupLinkInput.isBlank()) joinLinkError = "Invite link is required."
                                    else { joinLinkError = null; viewModel.joinGroup(groupLinkInput.trim(), groupLinkInput.trim()) }
                                }
                            }
                            .testTag("join_group_btn"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(if (isCreatingNewSquad) "CREATE SQUAD" else "JOIN SQUAD", style = TextStyle(fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.White))
                    }

                    Text(
                        text = if (isCreatingNewSquad) "Creating a squad generates a unique link you can share with your team."
                        else "Paste an invite link from a squad member to join their tribe.",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp)
                    )
                }
            }
        } else {
            val collectivePct = if (leaderboard.isNotEmpty()) leaderboard.map { it.dailyCompletionPercentage }.average().toInt() else 0

            // ---- Squad hero --------------------------------------------------
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(28.dp))
                        .background(Brush.linearGradient(listOf(Primary.copy(alpha = 0.16f), Secondary.copy(alpha = 0.06f))))
                        .padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ACTIVE SQUAD", style = MaterialTheme.typography.labelSmall.copy(color = Primary, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, fontSize = 10.sp))
                            Spacer(Modifier.height(3.dp))
                            Text(
                                profile?.currentGroupName ?: "Morning Protocol",
                                style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            )
                        }
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clip(RoundedCornerShape(9999.dp)).background(Color.White.copy(alpha = 0.06f)).padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Box(Modifier.size(6.dp).background(CyberGreen, CircleShape))
                            Spacer(Modifier.width(6.dp))
                            Text("${leaderboard.size} members", style = MaterialTheme.typography.labelSmall.copy(color = TextSecondary, fontSize = 10.sp))
                        }
                    }

                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Collective completion", style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 13.sp))
                            Text("$collectivePct%", style = MaterialTheme.typography.bodyMedium.copy(color = Primary, fontWeight = FontWeight.Bold))
                        }
                        Spacer(Modifier.height(8.dp))
                        val animPct by animateFloatAsState(collectivePct / 100f, tween(800, easing = FastOutSlowInEasing), label = "coll")
                        Box(modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(Color.White.copy(alpha = 0.08f))) {
                            Box(Modifier.fillMaxWidth(animPct).fillMaxHeight().clip(RoundedCornerShape(4.dp)).background(auroraBrush()))
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row {
                            leaderboard.take(4).forEachIndexed { i, member ->
                                Box(
                                    modifier = Modifier.size(34.dp).offset(x = (i * -10).dp).clip(CircleShape)
                                        .background(SurfaceVariant).border(2.dp, Background, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) { Text(getAvatarEmoji(member.profilePic), fontSize = 15.sp) }
                            }
                        }
                        val context = LocalContext.current
                        val groupId = profile?.currentGroupId ?: ""
                        val squadName = profile?.currentGroupName ?: ""
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp),
                                modifier = Modifier.clip(RoundedCornerShape(9999.dp)).background(Primary.copy(alpha = 0.14f))
                                    .pressScale {
                                        val send = android.content.Intent().apply {
                                            action = android.content.Intent.ACTION_SEND
                                            putExtra(android.content.Intent.EXTRA_TEXT, "Join my Squad: $squadName (ID: $groupId)")
                                            type = "text/plain"
                                        }
                                        context.startActivity(android.content.Intent.createChooser(send, null))
                                    }
                                    .padding(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null, tint = Primary, modifier = Modifier.size(13.dp))
                                Text("Invite", style = MaterialTheme.typography.labelSmall.copy(color = Primary, fontWeight = FontWeight.Bold, fontSize = 11.sp))
                            }
                            Box(
                                modifier = Modifier.size(34.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.05f)).pressScale(scaleDown = 0.9f) { viewModel.leaveGroup() },
                                contentAlignment = Alignment.Center
                            ) { Icon(Icons.Default.Logout, contentDescription = "Leave", tint = Tertiary, modifier = Modifier.size(16.dp)) }
                        }
                    }
                }
            }

            // ---- Leaderboard -------------------------------------------------
            item {
                Column(
                    modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = AuroraGold(), modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("Leaderboard", style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp))
                    }
                    leaderboard.forEachIndexed { idx, member ->
                        LeaderboardRow(idx, member) { selectedPlayerForDetails = member }
                    }
                }
            }

            // ---- Team completion chart --------------------------------------
            item {
                TeamCompletionChart(leaderboard = leaderboard)
            }
        }
    }

    selectedPlayerForDetails?.let { player ->
        PlayerDialog(player) { selectedPlayerForDetails = null }
    }
}

@Composable
private fun TeamCompletionChart(leaderboard: List<GroupMember>) {
    Column(modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp)) {
        Text("Team completion", style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 17.sp))
        Text("Today's completion by squad member", style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp))
        Spacer(Modifier.height(16.dp))
        if (leaderboard.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().height(96.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "No squad data synced yet.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 13.sp)
                )
            }
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                items(leaderboard, key = { it.userId }) { member ->
                    val heightPct = member.dailyCompletionPercentage.coerceIn(0f, 100f)
                    var shown by remember { mutableStateOf(false) }
                    LaunchedEffect(member.userId, heightPct) { shown = true }
                    val animH by animateFloatAsState(
                        if (shown) heightPct / 100f else 0f,
                        tween(520, easing = FastOutSlowInEasing), label = "bar"
                    )
                    Column(
                        modifier = Modifier.width(46.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Column(modifier = Modifier.height(120.dp), verticalArrangement = Arrangement.Bottom, horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .width(18.dp)
                                    .fillMaxHeight(animH)
                                    .clip(RoundedCornerShape(topStart = 5.dp, topEnd = 5.dp))
                                    .background(
                                        if (heightPct >= 80f) auroraBrush()
                                        else Brush.verticalGradient(listOf(Primary.copy(alpha = 0.35f), Primary.copy(alpha = 0.15f)))
                                    )
                            )
                        }
                        Text(getAvatarEmoji(member.profilePic), fontSize = 15.sp, maxLines = 1)
                        Text(
                            "${heightPct.toInt()}%",
                            style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 10.sp),
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SegTab(label: String, selected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val bg by animateColorAsState(if (selected) Primary.copy(alpha = 0.18f) else Color.Transparent, tween(220), label = "segBg")
    val text by animateColorAsState(if (selected) Primary else TextSecondary, tween(220), label = "segText")
    Box(
        modifier = modifier.clip(RoundedCornerShape(12.dp)).background(bg).clickable { onClick() }.padding(vertical = 11.dp),
        contentAlignment = Alignment.Center
    ) { Text(label, style = MaterialTheme.typography.labelMedium.copy(color = text, fontWeight = FontWeight.Bold, fontSize = 13.sp)) }
}

@Composable
private fun LeaderboardRow(idx: Int, member: GroupMember, onClick: () -> Unit) {
    val isMe = member.isMe
    val rankBadge = when (idx) { 0 -> "🥇"; 1 -> "🥈"; 2 -> "🥉"; else -> String.format(java.util.Locale.US, "%02d", idx + 1) }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (isMe) Primary.copy(alpha = 0.10f) else Color.Transparent)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Box(modifier = Modifier.width(26.dp), contentAlignment = Alignment.Center) {
                Text(rankBadge, style = MaterialTheme.typography.labelMedium.copy(color = if (isMe) Primary else TextSecondary, fontWeight = FontWeight.Bold, fontSize = if (idx < 3) 16.sp else 12.sp))
            }
            Spacer(Modifier.width(10.dp))
            Box(modifier = Modifier.size(32.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.06f)), contentAlignment = Alignment.Center) {
                Text(getAvatarEmoji(member.profilePic), fontSize = 15.sp)
            }
            Spacer(Modifier.width(12.dp))
            Text(
                member.username + if (isMe) "  (you)" else "",
                style = MaterialTheme.typography.bodyLarge.copy(color = if (isMe) Primary else TextPrimary, fontWeight = FontWeight.Medium, fontSize = 14.sp),
                maxLines = 1
            )
        }
        Text("${member.dailyCompletionPercentage.toInt()}%", style = MaterialTheme.typography.labelMedium.copy(color = if (isMe) Primary else TextSecondary, fontWeight = FontWeight.Bold, fontSize = 14.sp))
    }
}

@Composable
private fun PlayerDialog(player: GroupMember, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Primary.copy(alpha = 0.14f)), contentAlignment = Alignment.Center) {
                    Text(getAvatarEmoji(player.profilePic), fontSize = 20.sp)
                }
                Spacer(Modifier.width(12.dp))
                Text(player.username, color = TextPrimary, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White.copy(alpha = 0.04f)).padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    MetricColumn("TODAY", "${player.dailyCompletionPercentage.toInt()}%")
                    MetricColumn("STREAK", "${player.currentStreak}d")
                    MetricColumn("ALL-TIME", "${player.totalTasksAllTime}")
                }
                val tasksCompleted = player.activeBreakdown.split(",").filter { it.isNotBlank() }
                Text("COMPLETED TODAY", style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 10.sp, letterSpacing = 1.sp))
                if (tasksCompleted.isEmpty()) {
                    Text("Nothing logged yet today.", color = TextMuted, fontSize = 13.sp)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        tasksCompleted.forEach { t ->
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = CyberGreen, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(t.trim(), color = TextPrimary, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("CLOSE", color = Primary, fontWeight = FontWeight.Bold) } },
        containerColor = SurfaceContainer
    )
}

@Composable
fun MetricColumn(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 18.sp))
        Spacer(Modifier.height(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 9.sp))
    }
}

@Composable
private fun squadFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    errorBorderColor = MaterialTheme.colorScheme.error
)

private fun AuroraGold() = Color(0xFFE6C06A)

private fun getAvatarEmoji(avatarId: String?): String = when (avatarId) {
    "avatar_1" -> "🧑‍💻"; "avatar_2" -> "🦁"; "avatar_3" -> "🥋"; "avatar_4" -> "🚀"; else -> "🚀"
}
