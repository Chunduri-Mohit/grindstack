package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.GrindViewModel
import com.example.ui.currentFirebaseUserOrNull
import com.example.ui.theme.*
import java.util.Locale

@Composable
fun ProfileScreen(
    viewModel: GrindViewModel,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val tasks by viewModel.allTasks.collectAsStateWithLifecycle()
    val customTasks = remember(tasks) { tasks.filter { it.isCustom } }

    var usernameInput by remember(profile?.username) { mutableStateOf(profile?.username ?: "") }
    var isEditingName by remember { mutableStateOf(false) }
    var newTaskName by remember { mutableStateOf("") }
    var newTaskCategory by remember { mutableStateOf("tech") }

    val level = ((profile?.xp ?: 0) / 100) + 1
    val currentUser = remember { currentFirebaseUserOrNull() }
    val email = currentUser?.email ?: "Guest mode"

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
                    text = "Profile",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 32.sp, letterSpacing = (-0.8).sp
                    )
                )
                Text(
                    text = "Your account, stats and custom goals.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp)
                )
            }
        }

        item {
            AccountCard(
                username = profile?.username ?: "Grinder",
                email = email,
                selectedAvatar = profile?.profilePic ?: "avatar_1",
                isEditingName = isEditingName,
                usernameInput = usernameInput,
                onUsernameInput = { if (it.length <= 15) usernameInput = it },
                onStartEdit = { isEditingName = true },
                onSaveName = {
                    viewModel.updateProfile(usernameInput.ifBlank { "Grinder" }, profile?.profilePic ?: "avatar_1")
                    isEditingName = false
                },
                onAvatarSelected = { avatarId ->
                    viewModel.updateProfile(profile?.username ?: usernameInput.ifBlank { "Grinder" }, avatarId)
                }
            )
        }

        // Stats strip
        item {
            Row(
                modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(vertical = 20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ProfileStat("LEVEL", "$level", Primary)
                StatDivider()
                ProfileStat("XP", "${profile?.xp ?: 0}", Secondary)
                StatDivider()
                ProfileStat("STREAK", "${profile?.longestStreak ?: 0}d", Tertiary)
                StatDivider()
                ProfileStat("DONE", "${profile?.totalTasksCompletedAllTime ?: 0}", CyberGreen)
            }
        }

        // Custom goals
        item {
            Column(
                modifier = Modifier.fillMaxWidth().glassCard(shape = RoundedCornerShape(24.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text("Custom goals", style = MaterialTheme.typography.titleMedium.copy(color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 17.sp))

                OutlinedTextField(
                    value = newTaskName,
                    onValueChange = { newTaskName = it },
                    placeholder = { Text("e.g. Read 1 chapter of system design", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.08f),
                        focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary
                    )
                )

                DropdownSelector(
                    label = "Category",
                    options = listOf("Tech grind", "Health & fitness", "Daily discipline"),
                    selected = when (newTaskCategory) {
                        "tech" -> "Tech grind"; "health" -> "Health & fitness"; else -> "Daily discipline"
                    },
                    onSelect = { sel ->
                        newTaskCategory = when (sel) {
                            "Tech grind" -> "tech"; "Health & fitness" -> "health"; else -> "discipline"
                        }
                    }
                )

                GrindButton(
                    text = "ADD GOAL",
                    onClick = {
                        if (newTaskName.isNotBlank()) {
                            viewModel.addCustomTask(newTaskName.trim(), newTaskCategory)
                            newTaskName = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                if (customTasks.isNotEmpty()) {
                    HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.05f))
                    customTasks.forEach { task ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color.White.copy(alpha = 0.03f))
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(task.name, style = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary, fontSize = 14.sp), modifier = Modifier.weight(1f))
                            Icon(
                                Icons.Default.DeleteOutline, contentDescription = "Delete", tint = Tertiary,
                                modifier = Modifier.size(20.dp).clickable { viewModel.deleteCustomTask(task) }
                            )
                        }
                    }
                }
            }
        }

        item {
            SettingsActions(
                canLogout = currentUser != null,
                onResetHeatmap = { viewModel.resetHeatmap() },
                onLogout = onLogout
            )
        }
    }
}

private data class ProfileAvatarOption(
    val id: String,
    val icon: ImageVector,
    val label: String
)

private val ProfileAvatarOptions = listOf(
    ProfileAvatarOption("avatar_1", Icons.Default.Person, "Default"),
    ProfileAvatarOption("avatar_2", Icons.Default.Code, "Code"),
    ProfileAvatarOption("avatar_3", Icons.Default.FitnessCenter, "Fit"),
    ProfileAvatarOption("avatar_4", Icons.Default.Bolt, "Energy")
)

@Composable
private fun AccountCard(
    username: String,
    email: String,
    selectedAvatar: String,
    isEditingName: Boolean,
    usernameInput: String,
    onUsernameInput: (String) -> Unit,
    onStartEdit: () -> Unit,
    onSaveName: () -> Unit,
    onAvatarSelected: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .fadeSlideIn(delayMillis = 70)
            .glassCard(shape = RoundedCornerShape(24.dp))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            InitialAvatar(username = username, avatarId = selectedAvatar)
            Column(modifier = Modifier.weight(1f)) {
                if (isEditingName) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = usernameInput,
                            onValueChange = onUsernameInput,
                            modifier = Modifier.weight(1f),
                            textStyle = TextStyle(color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
                            shape = RoundedCornerShape(14.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                                focusedTextColor = TextPrimary,
                                unfocusedTextColor = TextPrimary,
                                cursorColor = Primary
                            )
                        )
                        Box(
                            modifier = Modifier
                                .height(48.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Primary)
                                .pressScale(onClick = onSaveName)
                                .padding(horizontal = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Save", color = Background, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = username,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary,
                                fontSize = 20.sp
                            ),
                            modifier = Modifier.weight(1f),
                            maxLines = 1
                        )
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Edit name",
                            tint = TextSecondary,
                            modifier = Modifier
                                .size(18.dp)
                                .clickable { onStartEdit() }
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = email,
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 13.sp),
                        maxLines = 1
                    )
                }
            }
        }

        HorizontalDivider(thickness = 0.5.dp, color = Color.White.copy(alpha = 0.06f))

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(
                text = "Avatar style",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = TextMuted,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp
                )
            )
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                ProfileAvatarOptions.forEach { option ->
                    AvatarStyleButton(
                        option = option,
                        selected = selectedAvatar == option.id,
                        onClick = { onAvatarSelected(option.id) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun InitialAvatar(username: String, avatarId: String) {
    val option = ProfileAvatarOptions.firstOrNull { it.id == avatarId } ?: ProfileAvatarOptions.first()
    Box(
        modifier = Modifier
            .size(66.dp)
            .clip(CircleShape)
            .background(Primary.copy(alpha = 0.14f))
            .border(1.dp, Primary.copy(alpha = 0.3f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = username.initials(),
            style = MaterialTheme.typography.titleMedium.copy(
                color = Primary,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
        )
        Icon(
            imageVector = option.icon,
            contentDescription = null,
            tint = Primary.copy(alpha = 0.45f),
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .size(20.dp)
                .background(Background, CircleShape)
                .padding(3.dp)
        )
    }
}

@Composable
private fun AvatarStyleButton(
    option: ProfileAvatarOption,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .height(70.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (selected) Primary.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.04f))
            .then(if (selected) Modifier.border(1.dp, Primary.copy(alpha = 0.36f), RoundedCornerShape(14.dp)) else Modifier)
            .pressScale(scaleDown = 0.94f, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = option.icon,
            contentDescription = option.label,
            tint = if (selected) Primary else TextSecondary,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.height(6.dp))
        Text(
            text = option.label,
            style = MaterialTheme.typography.labelSmall.copy(
                color = if (selected) Primary else TextMuted,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 10.sp
            ),
            maxLines = 1
        )
    }
}

@Composable
private fun ProfileStat(label: String, value: String, accent: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge.copy(color = accent, fontWeight = FontWeight.Bold, fontSize = 22.sp))
        Spacer(Modifier.height(2.dp))
        Text(label, style = MaterialTheme.typography.labelSmall.copy(color = TextMuted, fontSize = 10.sp, letterSpacing = 0.8.sp))
    }
}

@Composable
private fun StatDivider() {
    Box(modifier = Modifier.height(34.dp).width(1.dp).background(Color.White.copy(alpha = 0.07f)))
}

@Composable
private fun SettingsActions(
    canLogout: Boolean,
    onResetHeatmap: () -> Unit,
    onLogout: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .glassCard(shape = RoundedCornerShape(20.dp))
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Advanced",
                style = MaterialTheme.typography.titleSmall.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            )
            OutlinedButton(
                onClick = onResetHeatmap,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
            ) {
                Text("Reset consistency history", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }

        if (canLogout) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
                    .pressScale(onClick = onLogout),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Log out",
                    style = TextStyle(
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = TextSecondary
                    )
                )
            }
        }
    }
}

@Composable
fun DropdownSelector(label: String, options: List<String>, selected: String, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 12.sp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.04f))
                .clickable { expanded = true }
                .padding(14.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(selected, style = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary))
                Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextSecondary)
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.background(SurfaceContainer)
            ) {
                options.forEach { option ->
                    DropdownMenuItem(text = { Text(option, color = TextPrimary) }, onClick = { onSelect(option); expanded = false })
                }
            }
        }
    }
}

private fun String.initials(): String {
    val parts = trim().split(Regex("\\s+")).filter { it.isNotBlank() }
    val raw = when {
        parts.size >= 2 -> "${parts[0].first()}${parts[1].first()}"
        parts.size == 1 -> parts[0].take(2)
        else -> "GS"
    }
    return raw.uppercase(Locale.US)
}

private fun getAvatarEmoji(avatarId: String?): String = when (avatarId) {
    "avatar_1" -> "🧑‍💻"; "avatar_2" -> "🦁"; "avatar_3" -> "🥋"; "avatar_4" -> "🚀"; else -> "🚀"
}
