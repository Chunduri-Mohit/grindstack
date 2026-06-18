package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.draw.scale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.foundation.border
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.data.AppDatabase
import com.example.data.GrindRepository
import com.example.ui.GrindViewModel
import com.example.ui.currentFirebaseUserOrNull
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.google.firebase.Firebase
import com.google.firebase.firestore.firestore
import com.google.firebase.auth.FirebaseAuth
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize persistent database on startup
        val database = AppDatabase.getDatabase(applicationContext)
        val repository = GrindRepository(database)
        val viewModel = GrindViewModel(repository)

        setContent {
            MyApplicationTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val isLoggedIn = remember { currentFirebaseUserOrNull() != null }
                val startDest = if (isLoggedIn) "dashboard" else "login"
                val currentRoute = navBackStackEntry?.destination?.route ?: startDest

                Scaffold(
                    modifier = Modifier.fillMaxSize().animatedGlassBackground(),
                    containerColor = Color.Transparent,
                    topBar = {
                        if (currentRoute != "login") {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .statusBarsPadding(),
                                color = Color.Transparent
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 20.dp, vertical = 16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "GRINDSTACK",
                                        style = TextStyle(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 20.sp,
                                            letterSpacing = (-0.5).sp,
                                            color = TextPrimary
                                        )
                                    )
                                    Box(
                                        modifier = Modifier
                                            .background(Primary.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
                                            .border(1.dp, Primary.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = when(currentRoute) {
                                                "dashboard" -> "DASHBOARD"
                                                "tech" -> "ACADEMY"
                                                "health" -> "WELLBEING"
                                                "social" -> "SQUAD"
                                                "profile" -> "PROFILE"
                                                else -> "GRINDSTACK"
                                            },
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                color = Primary,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    },
                    bottomBar = {
                        if (currentRoute != "login") {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .navigationBarsPadding(),
                                color = Background.copy(alpha = 0.8f)
                            ) {
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    HorizontalDivider(
                                        thickness = 1.dp,
                                        color = CardBorder
                                    )
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(64.dp),
                                        horizontalArrangement = Arrangement.SpaceAround,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        val items = listOf(
                                            NavigationTab("dashboard", "Dashboard", Icons.Default.Dashboard, "nav_dashboard_tab"),
                                            NavigationTab("tech", "Academy", Icons.Default.AutoStories, "nav_tech_tab"),
                                            NavigationTab("health", "Wellbeing", Icons.Default.Favorite, "nav_health_tab"),
                                            NavigationTab("social", "Squad", Icons.Default.Groups, "nav_social_tab"),
                                            NavigationTab("profile", "Profile", Icons.Default.Person, "nav_profile_tab")
                                        )

                                        items.forEach { tab ->
                                            val selected = currentRoute == tab.route
                                            val tint by animateColorAsState(
                                                targetValue = if (selected) Primary else TextSecondary,
                                                animationSpec = tween(250),
                                                label = "navTint"
                                            )
                                            val iconScale by animateFloatAsState(
                                                targetValue = if (selected) 1.18f else 1f,
                                                animationSpec = spring(
                                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                                    stiffness = Spring.StiffnessMedium
                                                ),
                                                label = "navScale"
                                            )
                                            val pillAlpha by animateFloatAsState(
                                                targetValue = if (selected) 1f else 0f,
                                                animationSpec = tween(250),
                                                label = "navPill"
                                            )
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .fillMaxHeight()
                                                    .clickable(
                                                        interactionSource = remember { MutableInteractionSource() },
                                                        indication = null
                                                    ) {
                                                        if (currentRoute != tab.route) {
                                                            navController.navigate(tab.route) {
                                                                popUpTo("dashboard") { saveState = true }
                                                                launchSingleTop = true
                                                                restoreState = true
                                                            }
                                                        }
                                                    }
                                                    .testTag(tab.testTag),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Column(
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    verticalArrangement = Arrangement.Center
                                                ) {
                                                    Box(
                                                        contentAlignment = Alignment.Center,
                                                        modifier = Modifier
                                                            .background(
                                                                Primary.copy(alpha = 0.14f * pillAlpha),
                                                                RoundedCornerShape(14.dp)
                                                            )
                                                            .padding(horizontal = 14.dp, vertical = 5.dp)
                                                    ) {
                                                        Icon(
                                                            imageVector = tab.icon,
                                                            contentDescription = tab.label,
                                                            tint = tint,
                                                            modifier = Modifier
                                                                .size(20.dp)
                                                                .scale(iconScale)
                                                        )
                                                    }
                                                    Spacer(modifier = Modifier.height(3.dp))
                                                    Text(
                                                        text = tab.label,
                                                        style = MaterialTheme.typography.labelSmall.copy(
                                                            fontSize = 10.sp,
                                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                                            color = tint
                                                        )
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = startDest,
                        enterTransition = {
                            fadeIn(tween(300)) + slideInVertically(tween(340, easing = FastOutSlowInEasing)) { it / 10 } +
                                scaleIn(initialScale = 0.94f, animationSpec = tween(340, easing = FastOutSlowInEasing))
                        },
                        exitTransition = { fadeOut(tween(160)) + scaleOut(targetScale = 0.96f, animationSpec = tween(220)) },
                        popEnterTransition = {
                            fadeIn(tween(300)) + scaleIn(initialScale = 0.94f, animationSpec = tween(340, easing = FastOutSlowInEasing))
                        },
                        popExitTransition = { fadeOut(tween(160)) + scaleOut(targetScale = 0.96f, animationSpec = tween(220)) },
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        composable("login") {
                            LoginScreen(
                                viewModel = viewModel,
                                onLoginSuccess = {
                                    navController.navigate("dashboard") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(viewModel = viewModel)
                        }
                        composable("tech") {
                            TechScreen(viewModel = viewModel)
                        }
                        composable("health") {
                            HealthScreen(viewModel = viewModel)
                        }
                        composable("social") {
                            SocialScreen(viewModel = viewModel)
                        }
                        composable("profile") {
                            ProfileScreen(
                                viewModel = viewModel,
                                onLogout = {
                                    FirebaseAuth.getInstance().signOut()
                                    val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                                        .requestEmail()
                                        .build()
                                    val googleSignInClient = GoogleSignIn.getClient(this@MainActivity, gso)
                                    googleSignInClient.signOut().addOnCompleteListener {
                                        viewModel.logout {
                                            navController.navigate("login") {
                                                popUpTo(0) { inclusive = true }
                                            }
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

data class NavigationTab(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val testTag: String = ""
)
