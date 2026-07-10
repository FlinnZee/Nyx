package com.drv0id.nyx

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    requestNeededPermissions()
  }

  /**
   * Ask up-front for what the messenger needs — mic & camera for calls and
   * voice notes, notifications for message alerts. Once granted at the app
   * level, the webview receives getUserMedia grants automatically.
   */
  private fun requestNeededPermissions() {
    val wanted = mutableListOf(
      Manifest.permission.RECORD_AUDIO,
      Manifest.permission.CAMERA,
    )
    if (Build.VERSION.SDK_INT >= 33) {
      wanted.add(Manifest.permission.POST_NOTIFICATIONS)
    }
    val missing = wanted.filter {
      ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
    }
    if (missing.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, missing.toTypedArray(), 7401)
    }
  }
}
