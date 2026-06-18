package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.DragHandle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.Task
import com.example.ui.GrindViewModel
import com.example.ui.theme.Background
import com.example.ui.theme.Primary
import com.example.ui.theme.SurfaceContainer
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.glassCard
import com.example.ui.theme.pressScale
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun DashboardScreen(
    viewModel: GrindViewModel,
    modifier: Modifier = Modifier
) {
    val profile by viewModel.userProfile.collectAsStateWithLifecycle()
    val tasks by viewModel.allTasks.collectAsStateWithLifecycle()
    val habitsHistory by viewModel.allHabits.collectAsStateWithLifecycle()

    var selectedFilter by remember { mutableStateOf(DashboardTaskFilter.All) }
    var showQuickAdd by remember { mutableStateOf(false) }
    var newGoalName by remember { mutableStateOf("") }
    var newGoalCategory by remember { mutableStateOf("tech") }
    var editingTask by remember { mutableStateOf<Task?>(null) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    val total = tasks.size
    val completed = tasks.count { it.isCompleted }
    val incomplete = total - completed
    val progress = if (total > 0) completed.toFloat() / total else 0f
    val visibleTasks = remember(tasks, selectedFilter) { tasks.filter { selectedFilter.matches(it) } }
    val nextTask = remember(tasks) { tasks.firstOrNull { !it.isCompleted } }

    val greeting = remember {
        when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
            in 5..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            in 17..21 -> "Good evening"
            else -> "Late night grind"
        }
    }
    val level = ((profile?.xp ?: 0) / 100) + 1

    fun toggleTask(task: Task, checked: Boolean) {
        viewModel.toggleTask(task, checked)
        if (checked) {
            scope.launch {
                val result = snackbarHostState.showSnackbar(
                    message = "Marked complete",
                    actionLabel = "Undo",
                    duration = SnackbarDuration.Short
                )
                if (result == SnackbarResult.ActionPerformed) {
                    viewModel.toggleTask(task, false)
                }
            }
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Transparent)
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 22.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 104.dp)
        ) {
            item {
                DashboardHeader(
                    greeting = greeting,
                    username = profile?.username ?: "Grinder",
                    incomplete = incomplete,
                    level = level,
                    xp = profile?.xp ?: 0
                )
            }

            item {
                TodayOverviewCard(
                    completed = completed,
                    total = total,
                    progress = progress,
                    streak = profile?.longestStreak ?: 0,
                    graceAllowed = profile?.graceDaysAllowedThisWeek ?: 1,
                    graceUsed = profile?.graceDaysUsedThisWeek ?: 0
                )
            }

            item {
                NextActionCard(
                    task = nextTask,
                    onComplete = { toggleTask(it, true) },
                    onAddGoal = { showQuickAdd = true }
                )
            }

            item {
                TaskSectionHeader(
                    selectedFilter = selectedFilter,
                    onFilterSelected = { selectedFilter = it },
                    onAddGoal = { showQuickAdd = !showQuickAdd }
                )
            }

            if (showQuickAdd) {
                item {
                    QuickAddGoalCard(
                        name = newGoalName,
                        onNameChange = { newGoalName = it },
                        category = newGoalCategory,
                        onCategoryChange = { newGoalCategory = it },
                        onCancel = {
                            showQuickAdd = false
                            newGoalName = ""
                        },
                        onAdd = {
                            val trimmed = newGoalName.trim()
                            if (trimmed.isNotEmpty()) {
                                viewModel.addCustomTask(trimmed, newGoalCategory)
                                newGoalName = ""
                                showQuickAdd = false
                                selectedFilter = DashboardTaskFilter.Open
                            }
                        }
                    )
                }
            }

            item {
                TaskListPanel(
                    tasks = visibleTasks,
                    allTasks = tasks,
                    selectedFilter = selectedFilter,
                    onToggle = ::toggleTask,
                    onEdit = { editingTask = it },
                    onReorder = { viewModel.reorderTasks(it) }
                )
            }

            item {
                WeeklyHabitChartWidget(habitsHistory = habitsHistory)
            }
        }

        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) { data ->
            Snackbar(
                snackbarData = data,
                containerColor = SurfaceContainer,
                contentColor = TextPrimary,
                actionColor = Primary
            )
        }

        editingTask?.let { task ->
            EditTaskDialog(
                task = task,
                onDismiss = { editingTask = null },
                onSave = { name, category ->
                    viewModel.updateTask(task, name, category)
                    editingTask = null
                },
                onDelete = {
                    viewModel.deleteTask(task)
                    editingTask = null
                }
            )
        }
    }
}

private enum class DashboardTaskFilter(val label: String) {
    All("All"),
    Open("Open"),
    Tech("Tech"),
    Health("Health"),
    Discipline("Discipline");

    fun matches(task: Task): Boolean {
        val category = task.category.lowercase(Locale.US)
        return when (this) {
            All -> true
            Open -> !task.isCompleted
            Tech -> category == "tech"
            Health -> category == "health"
            Discipline -> category == "discipline" || (category != "tech" && category != "health")
        }
    }
}

@Composable
private fun DashboardHeader(
    greeting: String,
    username: String,
    incomplete: Int,
    level: Int,
    xp: Int
) {
    Column {
        Text(
            text = greeting,
            style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp)
        )
        Spacer(Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = username,
                style = MaterialTheme.typography.titleLarge.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 30.sp,
                    letterSpacing = 0.sp
                ),
                modifier = Modifier.weight(1f),
                maxLines = 1
            )
            StatusPill(
                text = when {
                    incomplete <= 0 -> "Clear"
                    incomplete == 1 -> "1 left"
                    else -> "$incomplete left"
                }
            )
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            SmallDashboardStat("Level", "$level")
            SmallDashboardStat("XP", "$xp")
        }
    }
}

@Composable
private fun TodayOverviewCard(
    completed: Int,
    total: Int,
    progress: Float,
    streak: Int,
    graceAllowed: Int,
    graceUsed: Int
) {
    val remainingGrace = (graceAllowed - graceUsed).coerceAtLeast(0)
    val statusText = when {
        total == 0 -> "Add a goal"
        completed == total -> "Safe today"
        remainingGrace == 0 -> "No grace left"
        else -> "$remainingGrace grace left"
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(24.dp))
            .padding(18.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Today",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "$completed",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 42.sp
                    )
                )
                Text(
                    text = " / $total done",
                    style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp),
                    modifier = Modifier.padding(bottom = 7.dp)
                )
            }
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.07f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progress.coerceIn(0f, 1f))
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(999.dp))
                        .background(Primary)
                )
            }
            Spacer(Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                SmallDashboardStat("Streak", "${streak}d")
                SmallDashboardStat("Status", statusText)
            }
        }

        StaticCircularProgress(
            progress = progress,
            diameter = 94.dp,
            strokeWidth = 7.dp
        ) {
            Text(
                text = "${(progress * 100).toInt()}%",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            )
        }
    }
}

@Composable
private fun NextActionCard(
    task: Task?,
    onComplete: (Task) -> Unit,
    onAddGoal: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(22.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(Primary.copy(alpha = 0.14f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (task == null) Icons.Default.Check else Icons.Default.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(17.dp)
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (task == null) "All clear" else "Next action",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = TextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                )
                Text(
                    text = task?.name ?: "You finished today's checklist.",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    ),
                    maxLines = 2
                )
            }
        }

        if (task != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Primary)
                        .pressScale { onComplete(task) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Mark done",
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = Background,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    )
                }
                Box(
                    modifier = Modifier
                        .height(46.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color.White.copy(alpha = 0.05f))
                        .pressScale(onClick = onAddGoal)
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add goal", tint = TextSecondary, modifier = Modifier.size(20.dp))
                }
            }
        } else {
            TextButton(onClick = onAddGoal, contentPadding = PaddingValues(0.dp)) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Primary, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Add another goal", color = Primary, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun TaskSectionHeader(
    selectedFilter: DashboardTaskFilter,
    onFilterSelected: (DashboardTaskFilter) -> Unit,
    onAddGoal: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Tasks",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            )
            IconButton(
                onClick = onAddGoal,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.05f))
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add goal", tint = TextSecondary, modifier = Modifier.size(18.dp))
            }
        }
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(DashboardTaskFilter.values().toList(), key = { it.name }) { filter ->
                FilterPill(
                    label = filter.label,
                    selected = filter == selectedFilter,
                    onClick = { onFilterSelected(filter) }
                )
            }
        }
    }
}

@Composable
private fun FilterPill(label: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (selected) Primary.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.04f))
            .border(
                width = 1.dp,
                color = if (selected) Primary.copy(alpha = 0.36f) else Color.Transparent,
                shape = RoundedCornerShape(999.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium.copy(
                color = if (selected) Primary else TextSecondary,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 12.sp
            )
        )
    }
}

@Composable
private fun QuickAddGoalCard(
    name: String,
    onNameChange: (String) -> Unit,
    category: String,
    onCategoryChange: (String) -> Unit,
    onCancel: () -> Unit,
    onAdd: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(20.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "New goal",
            style = MaterialTheme.typography.titleSmall.copy(
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        )
        OutlinedTextField(
            value = name,
            onValueChange = onNameChange,
            placeholder = { Text("What needs to get done?", color = TextMuted) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                unfocusedBorderColor = Color.White.copy(alpha = 0.08f),
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary,
                cursorColor = Primary
            )
        )
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            GoalCategoryPill("Tech", "tech", category, onCategoryChange, Modifier.weight(1f))
            GoalCategoryPill("Health", "health", category, onCategoryChange, Modifier.weight(1f))
            GoalCategoryPill("Discipline", "discipline", category, onCategoryChange, Modifier.weight(1f))
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onCancel) {
                Text("Cancel", color = TextMuted, fontWeight = FontWeight.SemiBold)
            }
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = onAdd,
                enabled = name.isNotBlank(),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Primary,
                    contentColor = Background,
                    disabledContainerColor = Color.White.copy(alpha = 0.06f),
                    disabledContentColor = TextMuted
                )
            ) {
                Text("Add goal", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun GoalCategoryPill(
    label: String,
    value: String,
    selectedValue: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val selected = value == selectedValue
    Box(
        modifier = modifier
            .height(40.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) Primary.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.04f))
            .clickable { onSelect(value) },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                color = if (selected) Primary else TextSecondary,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 11.sp
            ),
            maxLines = 1
        )
    }
}

@Composable
private fun TaskListPanel(
    tasks: List<Task>,
    allTasks: List<Task>,
    selectedFilter: DashboardTaskFilter,
    onToggle: (Task, Boolean) -> Unit,
    onEdit: (Task) -> Unit,
    onReorder: (List<Task>) -> Unit
) {
    var displayedTasks by remember { mutableStateOf(tasks) }
    var draggingTaskId by remember { mutableStateOf<Int?>(null) }
    var dragStartIndex by remember { mutableStateOf(-1) }
    var dragOffsetY by remember { mutableStateOf(0f) }
    var rowHeightPx by remember { mutableStateOf(1f) }

    LaunchedEffect(tasks) {
        if (draggingTaskId == null) {
            displayedTasks = tasks
        }
    }

    fun moveDraggedTask(dragAmountY: Float) {
        dragOffsetY += dragAmountY
    }

    fun finishDrag() {
        val fromIndex = dragStartIndex
        val draggedId = draggingTaskId
        if (fromIndex in displayedTasks.indices && draggedId != null) {
            val rowSteps = (dragOffsetY / rowHeightPx).roundToInt()
            val toIndex = (fromIndex + rowSteps).coerceIn(0, displayedTasks.lastIndex)

            if (toIndex != fromIndex && displayedTasks.getOrNull(fromIndex)?.id == draggedId) {
                val reordered = displayedTasks.moveItem(fromIndex, toIndex)
                displayedTasks = reordered
                onReorder(mergeVisibleTaskOrder(allTasks, selectedFilter, reordered))
            }
        }
        draggingTaskId = null
        dragStartIndex = -1
        dragOffsetY = 0f
    }

    if (displayedTasks.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .glassCard(shape = RoundedCornerShape(20.dp))
                .padding(26.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (selectedFilter == DashboardTaskFilter.Open) "No open tasks." else "No tasks in this view.",
                style = MaterialTheme.typography.bodyMedium.copy(color = TextSecondary, fontSize = 14.sp),
                textAlign = TextAlign.Center
            )
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(20.dp))
            .padding(8.dp)
    ) {
        displayedTasks.forEachIndexed { index, task ->
            DashboardTaskRow(
                task = task,
                dragEnabled = displayedTasks.size > 1,
                isDragging = draggingTaskId == task.id,
                dragOffsetY = if (draggingTaskId == task.id) dragOffsetY else 0f,
                onSizeChanged = { height ->
                    if (height > 0) rowHeightPx = height.toFloat()
                },
                onToggle = onToggle,
                onEdit = { onEdit(task) },
                onDragStarted = {
                    draggingTaskId = task.id
                    dragStartIndex = index
                    dragOffsetY = 0f
                },
                onDragged = ::moveDraggedTask,
                onDragStopped = ::finishDrag
            )
            if (index < displayedTasks.lastIndex) {
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
private fun DashboardTaskRow(
    task: Task,
    dragEnabled: Boolean,
    isDragging: Boolean,
    dragOffsetY: Float,
    onSizeChanged: (Int) -> Unit,
    onToggle: (Task, Boolean) -> Unit,
    onEdit: () -> Unit,
    onDragStarted: () -> Unit,
    onDragged: (Float) -> Unit,
    onDragStopped: () -> Unit
) {
    val opacity = when {
        isDragging -> 0.86f
        task.isCompleted -> 0.48f
        else -> 1f
    }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .zIndex(if (isDragging) 1f else 0f)
            .offset { IntOffset(0, if (isDragging) dragOffsetY.roundToInt() else 0) }
            .shadow(if (isDragging) 8.dp else 0.dp, RoundedCornerShape(14.dp), clip = false)
            .clip(RoundedCornerShape(14.dp))
            .background(if (isDragging) Primary.copy(alpha = 0.08f) else Color.Transparent)
            .onSizeChanged { onSizeChanged(it.height) }
            .padding(horizontal = 12.dp, vertical = 12.dp)
            .alpha(opacity),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(12.dp))
                .clickable { onToggle(task, !task.isCompleted) },
            contentAlignment = Alignment.Center
        ) {
            StaticSquareCheckbox(checked = task.isCompleted, boxSize = 24.dp)
        }
        Spacer(Modifier.width(13.dp))
        Column(
            modifier = Modifier
                .weight(1f)
                .clickable { onEdit() }
        ) {
            Text(
                text = task.name,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Medium,
                    fontSize = 15.sp,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else null
                ),
                maxLines = 2
            )
            Spacer(Modifier.height(3.dp))
            Text(
                text = task.categoryLabel(),
                style = MaterialTheme.typography.labelSmall.copy(
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (task.streak > 0) {
                Text(
                    text = "${task.streak}d",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                )
            }
            IconButton(
                onClick = onEdit,
                modifier = Modifier.size(34.dp)
            ) {
                Icon(
                    Icons.Default.Edit,
                    contentDescription = "Edit task",
                    tint = TextMuted,
                    modifier = Modifier.size(17.dp)
                )
            }
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .pointerInput(dragEnabled, task.id) {
                        if (dragEnabled) {
                            detectDragGestures(
                                onDragStart = { onDragStarted() },
                                onDrag = { change, dragAmount ->
                                    change.consume()
                                    onDragged(dragAmount.y)
                                },
                                onDragEnd = onDragStopped,
                                onDragCancel = onDragStopped
                            )
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.DragHandle,
                    contentDescription = "Reorder task",
                    tint = if (dragEnabled) TextMuted else TextMuted.copy(alpha = 0.35f),
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun StaticSquareCheckbox(
    checked: Boolean,
    boxSize: androidx.compose.ui.unit.Dp
) {
    Box(
        modifier = Modifier
            .size(boxSize)
            .clip(RoundedCornerShape(6.dp))
            .border(
                width = 1.dp,
                color = if (checked) Primary else TextSecondary,
                shape = RoundedCornerShape(6.dp)
            )
            .background(if (checked) Primary else Color.Transparent, RoundedCornerShape(6.dp)),
        contentAlignment = Alignment.Center
    ) {
        if (checked) {
            Icon(
                Icons.Default.Check,
                contentDescription = null,
                tint = Background,
                modifier = Modifier.size(boxSize * 0.62f)
            )
        }
    }
}

@Composable
private fun StaticCircularProgress(
    progress: Float,
    diameter: androidx.compose.ui.unit.Dp,
    strokeWidth: androidx.compose.ui.unit.Dp,
    content: @Composable () -> Unit
) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(diameter)) {
        Canvas(modifier = Modifier.size(diameter)) {
            val stroke = strokeWidth.toPx()
            val inset = stroke / 2f
            val arcSize = androidx.compose.ui.geometry.Size(size.width - stroke, size.height - stroke)
            drawArc(
                color = Color.White.copy(alpha = 0.06f),
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )
            val sweep = progress.coerceIn(0f, 1f) * 360f
            if (sweep > 0f) {
                drawArc(
                    color = Primary,
                    startAngle = -90f,
                    sweepAngle = sweep,
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

@Composable
private fun EditTaskDialog(
    task: Task,
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit,
    onDelete: () -> Unit
) {
    var name by remember(task.id, task.name) { mutableStateOf(task.name) }
    var category by remember(task.id, task.category) { mutableStateOf(normalizedTaskCategory(task.category)) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceContainer,
        titleContentColor = TextPrimary,
        textContentColor = TextSecondary,
        title = {
            Text(
                text = "Edit task",
                style = MaterialTheme.typography.titleMedium.copy(
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    placeholder = { Text("Task name", color = TextMuted) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.08f),
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = Primary
                    )
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    GoalCategoryPill("Tech", "tech", category, { category = it }, Modifier.weight(1f))
                    GoalCategoryPill("Health", "health", category, { category = it }, Modifier.weight(1f))
                    GoalCategoryPill("Discipline", "discipline", category, { category = it }, Modifier.weight(1f))
                }
                TextButton(onClick = onDelete, contentPadding = PaddingValues(0.dp)) {
                    Icon(
                        Icons.Default.DeleteOutline,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(17.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Delete task", color = TextMuted, fontWeight = FontWeight.SemiBold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextMuted, fontWeight = FontWeight.SemiBold)
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(name, category) },
                enabled = name.isNotBlank(),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Primary,
                    contentColor = Background,
                    disabledContainerColor = Color.White.copy(alpha = 0.06f),
                    disabledContentColor = TextMuted
                )
            ) {
                Text("Save", fontWeight = FontWeight.Bold)
            }
        }
    )
}

private fun List<Task>.moveItem(fromIndex: Int, toIndex: Int): List<Task> {
    if (fromIndex == toIndex) return this
    return toMutableList().apply {
        add(toIndex, removeAt(fromIndex))
    }
}

private fun mergeVisibleTaskOrder(
    allTasks: List<Task>,
    selectedFilter: DashboardTaskFilter,
    reorderedVisibleTasks: List<Task>
): List<Task> {
    var visibleIndex = 0
    return allTasks.map { task ->
        if (selectedFilter.matches(task) && visibleIndex < reorderedVisibleTasks.size) {
            reorderedVisibleTasks[visibleIndex++]
        } else {
            task
        }
    }
}

private fun normalizedTaskCategory(category: String): String {
    return when (category.lowercase(Locale.US)) {
        "tech", "health", "discipline" -> category.lowercase(Locale.US)
        else -> "discipline"
    }
}

private fun Task.categoryLabel(): String = when (category.lowercase(Locale.US)) {
    "tech" -> "TECH"
    "health" -> "HEALTH"
    "discipline" -> "DISCIPLINE"
    else -> "GOAL"
}

@Composable
private fun StatusPill(text: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(Primary.copy(alpha = 0.13f))
            .padding(horizontal = 11.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(
                color = Primary,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp
            )
        )
    }
}

@Composable
private fun SmallDashboardStat(label: String, value: String) {
    Column {
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall.copy(
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        )
        Text(
            text = label.uppercase(Locale.US),
            style = MaterialTheme.typography.labelSmall.copy(
                color = TextMuted,
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
fun WeeklyHabitChartWidget(habitsHistory: List<com.example.data.DailyHabits>) {
    val dayLabels = listOf("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")

    val weeklyData = remember(habitsHistory) {
        val cal = Calendar.getInstance()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val habitsMap = habitsHistory.associateBy { it.dateString }
        val list = mutableListOf<WeeklyHabitPoint>()
        cal.add(Calendar.DAY_OF_YEAR, -6)
        for (i in 0 until 7) {
            val dateStr = dateFormat.format(cal.time)
            val habits = habitsMap[dateStr]
            var count = 0
            if (habits != null) {
                if (habits.gymCompleted) count++
                if (habits.dietCompleted) count++
                if (habits.skincareCompleted) count++
                if (habits.sleepCompleted) count++
            }
            list.add(WeeklyHabitPoint(day = dayLabels[i], count = count))
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        list
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .glassCard(shape = RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Text(
            text = "This week",
            style = MaterialTheme.typography.titleSmall.copy(
                color = TextPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        )
        Text(
            text = "Habits completed each day",
            style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted, fontSize = 12.sp)
        )
        Spacer(Modifier.height(16.dp))

        Canvas(modifier = Modifier.fillMaxWidth().height(180.dp)) {
            val chartW = size.width - 16f
            val chartH = size.height - 24f
            val stepX = chartW / 6f
            val maxValue = 4f
            val left = 8f

            for (i in 0..4) {
                val y = 12f + (chartH / 4f) * i
                drawLine(
                    color = Color.White.copy(alpha = 0.05f),
                    start = Offset(left, y),
                    end = Offset(left + chartW, y),
                    strokeWidth = 1f
                )
            }

            fun pointAt(i: Int): Offset {
                val yNorm = weeklyData[i].count.toFloat() / maxValue
                return Offset(left + stepX * i, 12f + chartH - (yNorm * chartH))
            }

            if (weeklyData.size > 1) {
                val area = Path().apply {
                    moveTo(left, 12f + chartH)
                    weeklyData.indices.forEach {
                        val p = pointAt(it)
                        lineTo(p.x, p.y)
                    }
                    lineTo(left + chartW, 12f + chartH)
                    close()
                }
                drawPath(
                    path = area,
                    brush = Brush.verticalGradient(
                        colors = listOf(Primary.copy(alpha = 0.22f), Color.Transparent),
                        startY = 12f,
                        endY = 12f + chartH
                    )
                )
                for (i in 0 until weeklyData.size - 1) {
                    drawLine(
                        color = Primary,
                        start = pointAt(i),
                        end = pointAt(i + 1),
                        strokeWidth = 4f
                    )
                }
            }
            weeklyData.indices.forEach { i ->
                val p = pointAt(i)
                drawCircle(Primary.copy(alpha = 0.25f), 9f, p)
                drawCircle(Primary, 5f, p)
            }
        }

        Spacer(Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            dayLabels.forEach { day ->
                Text(
                    text = day,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = TextMuted),
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            val values = weeklyData.map { it.count.toFloat() }
            Box(Modifier.weight(1f)) { StatItem("Min", (values.minOrNull() ?: 0f).toInt().toString()) }
            Box(Modifier.weight(1f)) { StatItem("Avg", String.format(Locale.US, "%.1f", values.average())) }
            Box(Modifier.weight(1f)) { StatItem("Max", (values.maxOrNull() ?: 0f).toInt().toString()) }
        }
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                color = Primary,
                fontSize = 18.sp
            )
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = TextMuted)
        )
    }
}

data class WeeklyHabitPoint(val day: String, val count: Int)
