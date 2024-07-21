package com.stiiick.common_native;


import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.IntentSender;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.exifinterface.media.ExifInterface;

import com.facebook.common.executors.CallerThreadExecutor;
import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.BaseDataSubscriber;
import com.facebook.datasource.DataSource;
import com.facebook.datasource.DataSubscriber;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.views.imagehelper.ImageSource;
import com.google.android.gms.auth.api.identity.BeginSignInRequest;
import com.google.android.gms.auth.api.identity.BeginSignInRequest.PasswordRequestOptions;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.auth.api.identity.SavePasswordRequest;
import com.google.android.gms.auth.api.identity.SignInClient;
import com.google.android.gms.auth.api.identity.SignInCredential;
import com.google.android.gms.auth.api.identity.SignInPassword;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.label.ImageLabel;
import com.google.mlkit.vision.label.ImageLabeler;
import com.google.mlkit.vision.label.ImageLabeling;
import com.google.mlkit.vision.label.defaults.ImageLabelerOptions;
import com.stiiick.database.DatabaseFactory;
import com.stiiick.stickprotocol.util.Base64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
//import java.util.concurrent.Executor;
//import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import static android.content.ContentValues.TAG;
import static com.facebook.drawee.backends.pipeline.Fresco.getImagePipeline;
import static com.stiiick.MainApplication.mainURL;


public class CommonNativeModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;
    ImageLabeler labeler;
    private Promise oneTapPromise;
    private static final int SAVE_PASSWORD = 0; /* unique request id */
    private static final int RECOVER_PASSWORD = 1; /* unique request id */
    private SignInClient oneTapClient;
    public String userId, passwordKey;

    CommonNativeModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS);
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @NonNull
    @Override
    public String getName() {
        return "CommonNative";
    }

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            super.onActivityResult(requestCode, resultCode, data);
            WritableMap map = Arguments.createMap();
            if (requestCode == SAVE_PASSWORD) {
                if (resultCode == Activity.RESULT_OK) {
                    map.putString("status", "SUCCESS");
                    oneTapPromise.resolve(map);
                } else if (resultCode == Activity.RESULT_CANCELED) {
                    map.putString("status", "CANCELLED");
                    oneTapPromise.resolve(map);
                }
            } else if (requestCode == RECOVER_PASSWORD) {
                if (resultCode == Activity.RESULT_OK) {
                    try {
                        SignInCredential credential = oneTapClient.getSignInCredentialFromIntent(data);
                        String secret = credential.getPassword();
                        String extractedUserId = secret.substring(0, 36);
                        String encryptedPassword = secret.substring(36);
                        if (userId.equals(extractedUserId)) {
                            String password = new String(decryptPassword(encryptedPassword, passwordKey));
                            map.putString("password", password);
                            map.putString("status", "SUCCESS");
                            oneTapPromise.resolve(map);
                        } else {
                            map.putString("status", "WRONG_ACCOUNT");
                            oneTapPromise.resolve(map);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                } else if (resultCode == Activity.RESULT_CANCELED) {
                    map.putString("status", "CANCELLED");
                    oneTapPromise.resolve(map);
                }
            }
        }
    };

    public byte[] decryptPassword(String encryptedIvText, String key) throws Exception {
        int ivSize = 16;
        byte[] encryptedIvTextBytes = Base64.decode(encryptedIvText);

        // Extract IV.
        byte[] iv = new byte[ivSize];
        System.arraycopy(encryptedIvTextBytes, 0, iv, 0, iv.length);
        IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);

        // Extract encrypted part.
        int encryptedSize = encryptedIvTextBytes.length - ivSize;
        byte[] encryptedBytes = new byte[encryptedSize];
        System.arraycopy(encryptedIvTextBytes, ivSize, encryptedBytes, 0, encryptedSize);


        SecretKeySpec secretKeySpec = new SecretKeySpec(Base64.decode(key), "AES");

        // Decrypt.
        Cipher cipherDecrypt = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipherDecrypt.init(Cipher.DECRYPT_MODE, secretKeySpec, ivParameterSpec);
        return cipherDecrypt.doFinal(encryptedBytes);
    }

    @ReactMethod
    private void encryptPassword(String password, Promise promise) {
        try {
            // Generate key
            SecureRandom secureRandom = new SecureRandom();
            byte[] passwordKey = new byte[32];
            secureRandom.nextBytes(passwordKey);

            // Generate IV
            int ivSize = 16;
            byte[] iv = new byte[ivSize];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);

            // Encrypt
            SecretKeySpec secretKeySpec = new SecretKeySpec(passwordKey, "AES");
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec);
            byte[] encrypted = cipher.doFinal(password.getBytes());

            // Combine IV and encrypted part
            byte[] encryptedIVAndText = new byte[ivSize + encrypted.length];
            System.arraycopy(iv, 0, encryptedIVAndText, 0, ivSize);
            System.arraycopy(encrypted, 0, encryptedIVAndText, ivSize, encrypted.length);

            WritableMap map = Arguments.createMap();
            map.putString("passwordKey", Base64.encodeBytes(passwordKey));
            map.putString("ciphertext", Base64.encodeBytes(encryptedIVAndText));
            promise.resolve(map);
        } catch (InvalidAlgorithmParameterException | InvalidKeyException |
                 IllegalBlockSizeException | BadPaddingException | NoSuchPaddingException |
                 NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    private void oneTapSavePassword(String username, String password, final Promise promise) {
        WritableMap map = Arguments.createMap();
        oneTapPromise = promise;
        SignInPassword signInPassword = new SignInPassword(username, password);
        SavePasswordRequest savePasswordRequest = SavePasswordRequest.builder().setSignInPassword(signInPassword).build();
        final Activity activity = getCurrentActivity();
        Identity.getCredentialSavingClient(activity)
                .savePassword(savePasswordRequest)
                .addOnSuccessListener(
                        result -> {
                            try {
                                activity.startIntentSenderForResult(
                                        result.getPendingIntent().getIntentSender(),
                                        SAVE_PASSWORD,
                                        /* fillInIntent= */ null,
                                        /* flagsMask= */ 0,
                                        /* flagsValue= */ 0,
                                        /* extraFlags= */ 0,
                                        /* options= */ null);
                            } catch (IntentSender.SendIntentException e) {
                                map.putString("status", "FAILED");
                                map.putString("error", e.getLocalizedMessage());
                                e.printStackTrace();
                                promise.resolve(map);
                            }
                        }).addOnFailureListener(
                        error -> {
                            map.putString("status", "FAILED");
                            map.putString("error", error.getLocalizedMessage());
                            error.printStackTrace();
                            promise.resolve(map);
                        }
                );
    }

    @ReactMethod
    private void oneTapRecoverPassword(String userId, String passwordKey, Promise promise) {
        this.userId = userId;
        this.passwordKey = passwordKey;
        oneTapPromise = promise;
        BeginSignInRequest signInRequest;
        final Activity activity = getCurrentActivity();
        oneTapClient = Identity.getSignInClient(activity);
        signInRequest = BeginSignInRequest.builder()
                .setPasswordRequestOptions(PasswordRequestOptions.builder()
                        .setSupported(true)
                        .build())
                .build();


        oneTapClient.beginSignIn(signInRequest)
                .addOnSuccessListener(
                        result -> {
                            try {
                                activity.startIntentSenderForResult(
                                        result.getPendingIntent().getIntentSender(), RECOVER_PASSWORD,
                                        null, 0, 0, 0);
                            } catch (IntentSender.SendIntentException e) {
                                Log.e(TAG, "Couldn't start One Tap UI: " + e.getLocalizedMessage());
                            }
                        }
                )
                .addOnFailureListener(
                        error -> {
                            Log.d("ERROR RECOVER", error.getLocalizedMessage());
                            error.printStackTrace();
                            promise.resolve(null);
                        }
                );


    }

//    @ReactMethod
//    public void blockStoreSavePassword(String key) {
//        BlockstoreClient client = Blockstore.getClient(reactContext);
//        String Password = "abc123";
//        StoreBytesData storeRequest1 = new StoreBytesData.Builder()
//                .setBytes(Password.getBytes())
//                .setKey(key)
//                .setShouldBackupToCloud(true)
//                .build();
//        client.storeBytes(storeRequest1)
//                .addOnSuccessListener(result -> Log.d(TAG, "storedxxx " + result + " bytes"))
//                .addOnFailureListener(e -> Log.e(TAG, "Failed to store bytesxxx", e));
//    }
//
//    @ReactMethod
//    public void blockStoreRecoverPassword(String key) {
//        BlockstoreClient client = Blockstore.getClient(reactContext);
//        List requestedKeys = Arrays.asList(key); // Add keys to array
//        RetrieveBytesRequest retrieveRequest = new RetrieveBytesRequest.Builder()
//                .setKeys(requestedKeys)
//                .build();
//
//        client.retrieveBytes(retrieveRequest)
//                .addOnSuccessListener(result -> {
//                    Map<String, RetrieveBytesResponse.BlockstoreData> blockstoreDataMap = result.getBlockstoreDataMap();
//                    for (Map.Entry<String, RetrieveBytesResponse.BlockstoreData> entry : blockstoreDataMap.entrySet()) {
//                        Log.d(TAG, String.format(
//                                "Retrieved bytes %s associated with key %s.",
//                                new String(entry.getValue().getBytes()), entry.getKey()));
//                    }
//                })
//                .addOnFailureListener(e -> Log.e(TAG, "Failed to store bytes", e));
//    }

//    @ReactMethod
//    public void credentialManagerSavePassword(String username, String password) {
//        // Initialize a CreatePasswordRequest object.
//        CreatePasswordRequest createPasswordRequest =
//                new CreatePasswordRequest(username, password);
//
//        Log.d("qqqxxx", getCurrentActivity().toString());
//        CredentialManager credentialManager = CredentialManager.create(getCurrentActivity());
//
//        Executor executor = Executors.newSingleThreadExecutor();
//
//        // Register the username and password.
//        credentialManager.createCredentialAsync(
//                // Use an activity-based context to avoid undefined
//                // system UI launching behavior
//                getCurrentActivity(),
//                createPasswordRequest,
//                null,
//                executor,
//                new CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
//                    @Override
//                    public void onResult(CreateCredentialResponse result) {
//                        Log.d("xxxsuccess", result.toString());
//                    }
//
//                    @Override
//                    public void onError(CreateCredentialException e) {
//                        Log.d("xxxerror", e.toString());
//                    }
//                }
//        );
//    }

//    @ReactMethod
//    public void credentialManagerRecoverPassword() {
//        // Initialize a CreatePasswordRequest object.
//        GetPasswordOption getPasswordOption = new GetPasswordOption();
//        GetCredentialRequest getCredRequest = new GetCredentialRequest.Builder()
//                .addCredentialOption(getPasswordOption)
//                .build();
//
//        CredentialManager credentialManager = CredentialManager.create(getCurrentActivity());
//
//        Executor executor = Executors.newSingleThreadExecutor();
//
//        credentialManager.getCredentialAsync(
//                // Use activity based context to avoid undefined
//                // system UI launching behavior
//                getCurrentActivity(),
//                getCredRequest,
//                null,
//                executor,
//                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
//                    @Override
//                    public void onResult(GetCredentialResponse getCredentialResponse) {
//                        Log.d("YYYSUCCESS", getCredentialResponse.getCredential().toString());
//                        Log.d("YYYSUCCESS", getCredentialResponse.toString());
//                        Log.d("YYYSUCCESS", getCredentialResponse.getCredential().getData().toString());
//                    }
//
//                    @Override
//                    public void onError(@NonNull GetCredentialException e) {
//                        Log.d("yyyerror", e.toString());
//                    }
//                });
//    }

    @ReactMethod
    public void classifyImages(ReadableArray uris, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                WritableMap map = Arguments.createMap();
                for (int i = 0; i < uris.size(); i++) {
                    try {
                        String uri = uris.getString(i);
                        map.putArray(uri, labelImage(uri));
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                promise.resolve(map);
            }
        });
    }

    @ReactMethod
    public void classifyImage(String uriString, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    promise.resolve(labelImage(uriString));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    public WritableArray labelImage(String uriString) throws InterruptedException {
        WritableArray categories = Arguments.createArray();
        InputImage image = null;
        try {
            Uri uri = Uri.parse(uriString);
            image = InputImage.fromFilePath(reactContext, uri);
        } catch (IOException e) {
            e.printStackTrace();
        }
        Boolean processing = true;
        Semaphore semaphore = new Semaphore(0, true);
        labeler.process(image)
                .addOnSuccessListener(new OnSuccessListener<List<ImageLabel>>() {
                    @Override
                    public void onSuccess(List<ImageLabel> labels) {
                        // Task completed successfully
                        int count = 0;
                        for (ImageLabel label : labels) {
                            String text = label.getText();
                            float confidence = label.getConfidence();
                            if (confidence >= 0.88 && count < 3) {
                                categories.pushString(text);
                                count += 1;
                            } else {
                                break;
                            }
                        }
                        semaphore.release();
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        // Task failed with an exception
                        Log.d("FAILED TO CLASSIFY IMAGE", e.toString());
                    }
                });
        semaphore.acquire();
        return categories;
    }

    @ReactMethod
    public void getSizeAndResize(final String contentUri, String type, boolean mirror, int resizeWidth, int resizeHeight, final Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                if (contentUri == null || contentUri.isEmpty()) {
                    promise.reject("ERROR_INVALID_URI", "Cannot get the size of an image for an empty URI");
                    return;
                }
                String uriString;
                File localFile = null;
                if (contentUri.startsWith("content://")) {
                    localFile = getLocalUri(contentUri, type);
                    uriString = Uri.fromFile(localFile).toString();
                } else {
                    uriString = contentUri;
                }
                ImageSource source = new ImageSource(getReactApplicationContext(), uriString);
                ImageRequest request = ImageRequestBuilder.newBuilderWithSource(source.getUri()).build();
                DataSource<CloseableReference<CloseableImage>> dataSource = getImagePipeline().fetchDecodedImage(request, reactContext);
                File finalLocalFile = localFile;
                DataSubscriber<CloseableReference<CloseableImage>> dataSubscriber =
                        new BaseDataSubscriber<CloseableReference<CloseableImage>>() {
                            @Override
                            protected void onNewResultImpl(
                                    DataSource<CloseableReference<CloseableImage>> dataSource) {
                                if (!dataSource.isFinished()) {
                                    return;
                                }
                                CloseableReference<CloseableImage> ref = dataSource.getResult();
                                if (ref != null) {
                                    try {
                                        CloseableImage image = ref.get();
                                        WritableMap map = Arguments.createMap();
                                        map.putInt("width", image.getWidth());
                                        map.putInt("height", image.getHeight());
                                        if (type.startsWith("image")) {
                                            File resizedImage = resizeImage(uriString, image.getWidth(), image.getHeight(), mirror, resizeWidth, resizeHeight);
                                            map.putString("resizedUri", resizedImage.getPath());
                                            map.putString("fileSize", Long.toString(resizedImage.length()));
                                        }
                                        if (contentUri.startsWith("content://"))
                                            finalLocalFile.delete();
                                        promise.resolve(map);
                                    } catch (Exception e) {
                                        e.printStackTrace();
                                    } finally {
                                        CloseableReference.closeSafely(ref);
                                    }
                                }
                            }

                            @Override
                            protected void onFailureImpl(DataSource<CloseableReference<CloseableImage>> dataSource) {
                            }
                        };
                dataSource.subscribe(dataSubscriber, CallerThreadExecutor.getInstance());
            }
        });
    }

    public static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[8192];
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
        }
        in.close();
        out.close();
    }

    static public File getLocalUri(String path, String type) {
        Uri imageUri = Uri.parse(path);
        File file = new File(reactContext.getExternalCacheDir(), imageUri.getLastPathSegment());
        OutputStream fileOutputStream;
        try {
            fileOutputStream = new FileOutputStream(file);
            InputStream inputStream;
            if (type.startsWith("image")) {
                AssetFileDescriptor assetDescriptor = reactContext.getContentResolver().openAssetFileDescriptor(imageUri, "r");
                inputStream = new FileInputStream(assetDescriptor.getFileDescriptor());
            } else {
                Bitmap bitmap = MediaStore.Video.Thumbnails.getThumbnail(reactContext.getContentResolver(),
                        Long.parseLong(imageUri.getLastPathSegment()),
                        MediaStore.Images.Thumbnails.MICRO_KIND,
                        null);
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 0 /*ignored for PNG*/, bos);
                byte[] bitmapdata = bos.toByteArray();
                inputStream = new ByteArrayInputStream(bitmapdata);
            }
            copy(inputStream, fileOutputStream);
            inputStream.close();
            fileOutputStream.flush();
            fileOutputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return file;
    }

    public File resizeImage(String path, int width, int height, boolean mirror, int resizeWidth, int resizeHeight) throws IOException {
        Uri myUri = Uri.parse(path);
        InputStream inputStream = reactContext.getContentResolver().openInputStream(myUri);
        String imageFileName = "image-" + UUID.randomUUID().toString() + ".jpg";
        ExifInterface oldExif = new ExifInterface(inputStream);
        int rotation = 0;
        int orientation = oldExif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);

        switch (orientation) {
            case ExifInterface.ORIENTATION_ROTATE_90:
                rotation = 90;
                break;
            case ExifInterface.ORIENTATION_ROTATE_180:
                rotation = 180;
                break;
            case ExifInterface.ORIENTATION_ROTATE_270:
                rotation = 270;
                break;
        }
        inputStream = reactContext.getContentResolver().openInputStream(myUri);
        Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Matrix matrix = new Matrix();
        if (!mirror) {
            matrix.postRotate(rotation);
        } else {
            matrix.preRotate(rotation);
            matrix.postScale(-1, 1);
        }
        float ratio = Math.min((float) resizeWidth / width, (float) resizeHeight / height);
        int finalWidth = (int) (bitmap.getWidth() * ratio);
        int finalHeight = (int) (bitmap.getHeight() * ratio);
        bitmap = Bitmap.createScaledBitmap(bitmap, finalWidth, finalHeight, true);
        bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
        bitmap.compress(Bitmap.CompressFormat.JPEG, 50, outputStream);
        File f = new File(reactContext.getCacheDir().getPath(), imageFileName);
        byte[] bitmapData = outputStream.toByteArray();
        outputStream.flush();
        outputStream.close();
        FileOutputStream fos = new FileOutputStream(f);
        fos.write(bitmapData);
        fos.flush();
        fos.close();
        return f;
    }


    @ReactMethod
    public void saveFile(String path, String type, Promise promise) throws IOException {
        ContentResolver resolver = reactContext.getContentResolver();

        Uri imagesCollection;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            imagesCollection = type.equals("photo") ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL) : MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
        } else {
            imagesCollection = type.equals("photo") ? MediaStore.Images.Media.EXTERNAL_CONTENT_URI : MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
        }

        ContentValues details = new ContentValues();
        details.put(MediaStore.Images.Media.DISPLAY_NAME, Uri.parse(path).getLastPathSegment().toString());
        String bucket = type.equals("photo") ? "Sticknet Photos" : "Sticknet Videos";
        details.put(MediaStore.Images.Media.BUCKET_DISPLAY_NAME, bucket);

        Uri imageUri = resolver.insert(imagesCollection, details);

        InputStream inputStream = new FileInputStream(new File(path));
        OutputStream outputStream = resolver.openOutputStream(imageUri);
        copy(inputStream, outputStream);
        promise.resolve(true);
    }

    @ReactMethod
    public void generateSecureRandom(int length, Promise promise) {
        SecureRandom secureRandom = new SecureRandom();
        byte[] buffer = new byte[length];
        secureRandom.nextBytes(buffer);
        promise.resolve(Base64.encodeBytes(buffer));
    }

    @ReactMethod
    private void cacheUri(String id, String uri) {
        DatabaseFactory.getFileDatabase(reactContext).insertUri(id, uri);
    }

    @ReactMethod
    private void readNativeDB(String id, Promise promise) {
        promise.resolve(DatabaseFactory.getFileDatabase(reactContext).getUri(id));
    }

    @ReactMethod
    private void removeItemNativeDB(String id) {
        DatabaseFactory.getFileDatabase(reactContext).remove(id);
    }


    @ReactMethod
    public void generateUUID(Promise promise) {
        String uuid = UUID.randomUUID().toString();
        promise.resolve(uuid);
    }


    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("mainURL", mainURL);
        return constants;
    }

    @ReactMethod
    public void raiseTestNativeError() throws Exception {
//        throw new Exception("TEST EXCEPTION ON ANDROID");
        int x = 5 / 0;
    }

    @ReactMethod
    public void hashArray(ReadableArray items, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                WritableArray output = Arguments.createArray();
                for (int i = 0; i < items.size(); i++) {
                    try {
                        String text = items.getString(i);
                        MessageDigest digest = MessageDigest.getInstance("SHA-256");
                        byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
                        output.pushString(Base64.encodeBytes(hash));
                    } catch (NoSuchAlgorithmException e) {
                        e.printStackTrace();
                    }
                }
                promise.resolve(output);
            }
        });
    }

    @ReactMethod
    public void hash(String text, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    MessageDigest digest = MessageDigest.getInstance("SHA-256");
                    byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
                    promise.resolve(Base64.encodeBytes(hash));
                } catch (NoSuchAlgorithmException e) {
                    e.printStackTrace();
                }
            }
        });
    }

}
