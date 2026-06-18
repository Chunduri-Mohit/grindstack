package com.example.ui

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser

fun currentFirebaseUserOrNull(): FirebaseUser? {
    return try {
        FirebaseAuth.getInstance().currentUser
    } catch (e: IllegalStateException) {
        null
    }
}

