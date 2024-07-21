package com.stiiick.extensions;

import android.app.Activity;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class Common {

    public static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[8192];
        int read;
        long total = 0;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
            total += read;
        }
        in.close();
        out.close();
    }

    static String getLocalUri(Activity activity, String path, String type) {
        Uri imageUri = Uri.parse(path);
        File file = new File(activity.getExternalCacheDir(), imageUri.getLastPathSegment());
        Uri copyUri = Uri.fromFile(file);
        OutputStream fileOutputStream;
        try {
            fileOutputStream = new FileOutputStream(file);
            AssetFileDescriptor assetDescriptor = activity.getContentResolver().openAssetFileDescriptor(imageUri, "r");
            InputStream inputStream = new FileInputStream(assetDescriptor.getFileDescriptor());
            copy(inputStream, fileOutputStream);
            inputStream.close();
            fileOutputStream.flush();
            fileOutputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return copyUri.toString();
    }
}
