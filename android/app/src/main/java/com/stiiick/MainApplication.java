package com.stiiick;

import static com.wix.reactnativeuilib.keyboardinput.AppContextHolder.getCurrentActivity;

import android.app.Activity;
import android.app.Application;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.masteratul.exceptionhandler.DefaultErrorScreen;
import com.masteratul.exceptionhandler.NativeExceptionHandlerIfc;
import com.masteratul.exceptionhandler.ReactNativeExceptionHandlerModule;
import com.stiiick.common_native.CommonNativePackage;
import com.stiiick.stickprotocol.StickProtocolPackage;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    public static final String mainURL = BuildConfig.DEBUG ? "https://www.sticknet.org" : "https://www.sticknet.org";

    private final ReactNativeHost mReactNativeHost =
            new DefaultReactNativeHost(this) {
                @Override
                public boolean getUseDeveloperSupport() {
                    return BuildConfig.DEBUG;
                }

                @Override
                protected List<ReactPackage> getPackages() {
                    @SuppressWarnings("UnnecessaryLocalVariable")
                    List<ReactPackage> packages = new PackageList(this).getPackages();
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    // packages.add(new MyReactNativePackage());
                    packages.add(new StickProtocolPackage());
                    packages.add(new CommonNativePackage());
                    return packages;
                }

                @Override
                protected String getJSMainModuleName() {
                    return "index";
                }

                @Override
                protected boolean isNewArchEnabled() {
                    return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
                }

                @Override
                protected Boolean isHermesEnabled() {
                    return BuildConfig.IS_HERMES_ENABLED;
                }
            };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    private PackageInfo getPackageInfo() throws Exception {
        return getApplicationContext().getPackageManager().getPackageInfo(getApplicationContext().getPackageName(), 0);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            DefaultNewArchitectureEntryPoint.load();
        }
        ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());

        ReactNativeExceptionHandlerModule.setNativeExceptionHandler(new NativeExceptionHandlerIfc() {
            @Override
            public void handleNativeException(Thread thread, Throwable throwable, Thread.UncaughtExceptionHandler originalHandler) {

                Class errorIntentTargetClass = DefaultErrorScreen.class;
                Activity activity = getCurrentActivity();
                Intent i = new Intent();
                i.setClass(activity, errorIntentTargetClass);
                i.putExtra("stack_trace_string", throwable.getMessage());
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(i);
                activity.finish();

                try {
                    String stackTraceString = Log.getStackTraceString(throwable);
                    URL url = new URL(mainURL + "/api/error-report/");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; utf-8");
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setDoOutput(true);
                    JSONObject jsonBody = new JSONObject();
                    jsonBody.put("string", stackTraceString);
                    jsonBody.put("native", true);
                    jsonBody.put("model", Build.MODEL);
                    jsonBody.put("system_version", Build.VERSION.RELEASE);
                    jsonBody.put("app_version", getPackageInfo().versionName);
                    jsonBody.put("platform", "A");
                    jsonBody.put("screen", "");
                    jsonBody.put("is_fatal", true);
                    String userId = PreferenceManager.getDefaultSharedPreferences(getApplicationContext()).getString("userId", "");
                    if (!userId.equals("")) {
                        jsonBody.put("user_id", userId);
                    }
                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = jsonBody.toString().getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        StringBuilder response = new StringBuilder();
                        String responseLine = null;
                        while ((responseLine = br.readLine()) != null) {
                            response.append(responseLine.trim());
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
