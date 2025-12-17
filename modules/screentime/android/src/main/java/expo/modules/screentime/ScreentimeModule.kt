package expo.modules.screentime

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.app.usage.UsageStats
import android.app.usage.UsageEvents
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import java.util.Calendar
import java.util.concurrent.TimeUnit

class ScreentimeModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('Screentime')` in JavaScript.
    Name("Screentime")

    Function("hasUsageAccess") {
      val ctx = appContext.reactContext ?: return@Function false
      val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName
      )
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openUsageAccessSettings") {
      val ctx = appContext.reactContext ?: return@Function true
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ctx.startActivity(intent)
      false
    }

    Function("getTodayUsage") {
      val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

      val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }

      val hourly_stats_today = mutableListOf<UsageStats>()
      val interval = TimeUnit.HOURS.toMillis(1)
      var t = cal.timeInMillis
      val endTime = System.currentTimeMillis()
      while (t < endTime) {
        val stats = usm.queryAndAggregateUsageStats(t, t + interval)
        hourly_stats_today.addAll(stats.values)
        t += interval
      }

      // val start = cal.timeInMillis
      // val end = System.currentTimeMillis()

      // val stats = usm.queryAndAggregateUsageStats(start, end)
      
      val pm = ctx.packageManager
      val rows = hourly_stats_today
        .filter { it.totalTimeInForeground > 0 }
        .map {
          val pkg = it.packageName
          val label = try {
            val appInfo = pm.getApplicationInfo(pkg, 0)
            pm.getApplicationLabel(appInfo).toString()
          } catch (e: Exception) {
            pkg
          }

          val fgMs = it.totalTimeInForeground.toDouble()

          mapOf(
            "packageName" to pkg,
            "appName" to label,
            "totalTimeInForeground" to fgMs
          )
        }
        .sortedByDescending { it["totalTimeInForeground"] as Double }

      rows
    }

    Function("getTodayUsageExact") {
      val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      val usm = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val pm = ctx.packageManager
    
      val cal = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val start = cal.timeInMillis
      val end = System.currentTimeMillis()
    
      val events = usm.queryEvents(start, end)
      val event = UsageEvents.Event()
    
      // package -> time when it moved to foreground (null if not currently foreground)
      val fgStart = HashMap<String, Long?>()
      // package -> accumulated ms today
      val total = HashMap<String, Long>()
    
      fun add(pkg: String, delta: Long) {
        if (delta <= 0) return
        total[pkg] = (total[pkg] ?: 0L) + delta
      }
    
      while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName ?: continue
        val t = event.timeStamp
      
        when (event.eventType) {
          UsageEvents.Event.MOVE_TO_FOREGROUND,
          UsageEvents.Event.ACTIVITY_RESUMED -> {
            // start timing
            fgStart[pkg] = t
          }
        
          UsageEvents.Event.MOVE_TO_BACKGROUND,
          UsageEvents.Event.ACTIVITY_PAUSED -> {
            val s = fgStart[pkg]
            if (s != null) {
              add(pkg, t - s)
              fgStart[pkg] = null
            }
          }
        }
      }
    
      // If an app is still “foreground” at end time, close it at 'end'
      for ((pkg, s) in fgStart) {
        if (s != null) add(pkg, end - s)
      }
    
      // Build rows
      val rows = total.entries
        .filter { it.value > 0L }
        .map { (pkg, ms) ->
          val label = try {
            val appInfo = pm.getApplicationInfo(pkg, 0)
            pm.getApplicationLabel(appInfo).toString()
          } catch (_: Exception) { pkg }
        
          mapOf(
            "packageName" to pkg,
            "appName" to label,
            "totalTimeInForeground" to ms.toDouble()
          )
        }
        .sortedByDescending { (it["totalTimeInForeground"] as Double) }
      
      rows
    }
  }
}
