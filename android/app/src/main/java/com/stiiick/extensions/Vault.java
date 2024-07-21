package com.stiiick.extensions;

import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Log;


import androidx.appcompat.app.AppCompatActivity;
import com.stiiick.database.DatabaseFactory;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import static com.stiiick.extensions.Common.getLocalUri;

import java.util.ArrayList;

public class Vault extends AppCompatActivity {
    String intentType;
    ArrayList<Uri> imageUris;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        imageUris = new ArrayList<Uri>();
        Intent intent = getIntent();
        String action = intent.getAction();
        intentType = intent.getType();
        if (Intent.ACTION_SEND.equals(action) && !intentType.contains("text")) {
            Uri imageUri = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
            imageUris.add(imageUri);
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && !intentType.contains("text")) {
            imageUris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
        }
        JSONArray assets = new JSONArray();
        for (int i = 0; i < imageUris.size(); i++) {
            JSONObject item = getMediaInfo(imageUris.get(i));
            assets.put(item);
        }
        JSONObject response = new JSONObject();
        try {
            response.put("context", "vault");
            response.put("assets", assets);
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
        DatabaseFactory.getFileDatabase(getApplicationContext()).insertUri("ShareExtension", response.toString());
        Intent mainAppIntent = new Intent();
        mainAppIntent.setComponent(new ComponentName(getApplicationContext().getPackageName(), "com.stiiick.MainActivity"));
        startActivity(mainAppIntent);
    }

    public JSONObject getMediaInfo(Uri mediaUri) {
        JSONObject mediaInfoJson = new JSONObject();
        if (mediaUri != null) {
            ContentResolver contentResolver = getContentResolver();
            // Trying to get width and height from here gives incorrect values
            String[] projection = {
                    MediaStore.MediaColumns._ID,
                    MediaStore.MediaColumns.DATE_ADDED,
                    MediaStore.MediaColumns.DURATION,
                    MediaStore.MediaColumns.DISPLAY_NAME,
            };
            Cursor cursor = contentResolver.query(mediaUri, projection, null, null, null);
            if (cursor != null) {
                try {
                    if (cursor.moveToFirst()) {
                        int displayNameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        String fileName = cursor.getString(displayNameIndex);
                        int durationIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DURATION);
                        int duration = 0;
                        if (durationIndex > -1) {
                            duration = cursor.getInt(durationIndex);
                        }
                        int timestampIndex = cursor.getColumnIndex(MediaStore.MediaColumns.DATE_ADDED);
                        long timestamp = 0;
                        if (timestampIndex > -1) {
                            timestamp = cursor.getLong(timestampIndex);
                        }
                        String mimeType = contentResolver.getType(mediaUri);
                        String localUri = getLocalUri(this, mediaUri.toString(), mimeType);
                        mediaInfoJson.put("uri", localUri);
                        mediaInfoJson.put("name", fileName);
                        mediaInfoJson.put("type", mimeType);
                        mediaInfoJson.put("duration", duration);
                        mediaInfoJson.put("timestamp", timestamp);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                    new AlertDialog.Builder(Vault.this)
                            .setTitle("Save image to gallery first")
                            .setMessage("Save image to your phone's gallery then try again.")
                            .setPositiveButton("OK", null)
                            .show();
                } finally {
                    cursor.close();
                }
            }
        }
        return mediaInfoJson;
    }
}
