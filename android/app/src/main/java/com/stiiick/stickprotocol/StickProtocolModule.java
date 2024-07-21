package com.stiiick.stickprotocol;

import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.preference.PreferenceManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.stiiick.stickprotocol.keychain.Keychain;
import com.stiiick.stickprotocol.main.StickProtocol;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.signal.argon2.Argon2Exception;
import org.whispersystems.libsignal.InvalidKeyException;
import org.whispersystems.libsignal.InvalidMessageException;
import org.whispersystems.libsignal.LegacyMessageException;
import org.whispersystems.libsignal.NoSessionException;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;

import static com.stiiick.common_native.CommonNativeModule.getLocalUri;
import static com.stiiick.stickprotocol.Util.convertArrayToJson;
import static com.stiiick.stickprotocol.Util.convertJsonToArray;
import static com.stiiick.stickprotocol.Util.convertJsonToMap;
import static com.stiiick.stickprotocol.Util.convertMapToJson;


public class StickProtocolModule extends ReactContextBaseJavaModule {
    public static Context reactContext;
    StickProtocol stickProtocol;

    StickProtocolModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        stickProtocol = new StickProtocol(context, context.getPackageName());
    }

    public StickProtocolModule(Context context) {
        reactContext = context;
        stickProtocol = new StickProtocol(context, context.getPackageName());
    }

    public class ProgressEventImpl implements StickProtocol.ProgressEvent {
        @Override
        public void execute(JSONObject event) {
            ReactContext rc = (ReactContext) reactContext;
            try {
                rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit("KeysProgress", convertJsonToMap(event));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
    }


    @NonNull
    @Override
    public String getName() {
        return "StickProtocol";
    }

    @ReactMethod
    public void resetDatabase() {
        stickProtocol.resetDatabase();
    }

    @ReactMethod
    public void reInitialize(ReadableMap bundle, String password, String userId, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    ProgressEventImpl progressEvent = new ProgressEventImpl();
                    stickProtocol.reInitialize(convertMapToJson(bundle), password, userId, progressEvent);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                promise.resolve(true);
            }
        });
    }

    @ReactMethod
    public void decryptPreKeys(ReadableArray preKeys, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    stickProtocol.decryptPreKeys(convertArrayToJson(preKeys));
                } catch (Exception e) {
                    e.printStackTrace();
                }
                promise.resolve(true);
            }
        });
    }

    @ReactMethod
    public void reEncryptKeys(String password, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    ProgressEventImpl progressEvent = new ProgressEventImpl();
                    JSONObject jsonBundle = stickProtocol.reEncryptKeys(password, progressEvent);
                    ReadableMap bundle = convertJsonToMap(jsonBundle);
                    promise.resolve(bundle);
                } catch (Exception e) {
                    e.printStackTrace();
                }
                promise.resolve(true);
            }
        });
    }

    private String reEncryptCipher(String cipher, String currentPass, String newPass) throws Exception {
        String encryptedSecret = cipher.substring(0, cipher.length() - 44);
        String salt = cipher.substring(cipher.length() - 44);
        byte[] secret = stickProtocol.pbDecrypt(encryptedSecret, salt, currentPass);
        HashMap<String, String> encrypted = stickProtocol.pbEncrypt(new String(secret, StandardCharsets.UTF_8).getBytes(), newPass);
        return encrypted.get("cipher") + encrypted.get("salt");
    }

    @ReactMethod
    public void reEncryptCiphers(ReadableMap ciphersMap, String currentPass, String newPass, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    ProgressEventImpl progressEvent = new ProgressEventImpl();
                    JSONObject ciphers = convertMapToJson(ciphersMap);
                    JSONArray filesCipher = ciphers.getJSONArray("filesCipher");
                    JSONArray notesCipher = ciphers.getJSONArray("notesCipher");
                    JSONObject profile = ciphers.getJSONObject("profile");
                    for (int i=0; i<filesCipher.length(); i++) {
                        JSONObject file = filesCipher.getJSONObject(i);
                        file.put("cipher", reEncryptCipher(file.getString("cipher"), currentPass, newPass));
                        if (file.has("previewCipher")) {
                            file.put("previewCipher", reEncryptCipher(file.getString("previewCipher"), currentPass, newPass));
                        }
                    }
                    for (int i=0; i<notesCipher.length(); i++) {
                        JSONObject note = notesCipher.getJSONObject(i);
                        note.put("cipher", reEncryptCipher(note.getString("cipher"), currentPass, newPass));
                    }
                    if (profile.has("profilePictureCipher")) {
                        profile.put("profilePictureCipher", reEncryptCipher(profile.getString("profilePictureCipher"), currentPass, newPass));
                    }
                    promise.resolve(convertJsonToMap(ciphers));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void decryptDSKs(ReadableArray DSKs, Promise promise) throws JSONException {
        for (int i = 0; i < DSKs.size(); i++) {
            JSONObject dsk = convertMapToJson(DSKs.getMap(i));
            stickProtocol.initStickySession(dsk.getString("senderId"), dsk.getString("stickId"), dsk.getString("key"), dsk.getInt("identityKeyId"));
        }
        promise.resolve(true);
    }

    @ReactMethod
    public void createPasswordHash(String password, String passwordSalt, Promise promise) throws IOException, Argon2Exception {
        promise.resolve(stickProtocol.createPasswordHash(password, passwordSalt));
    }

    @ReactMethod
    public void createNewPasswordHash(String password, Promise promise) throws JSONException {
        promise.resolve(convertJsonToMap(stickProtocol.createNewPasswordHash(password)));
    }

    @ReactMethod
    public void updateKeychainPassword(String password, Promise promise) {
        HashMap<String, String> serviceMap = new HashMap();
        serviceMap.put("service", reactContext.getPackageName() + ".password");
        Keychain keychain = new Keychain(reactContext);
        String userId = PreferenceManager.getDefaultSharedPreferences(reactContext).getString("userId", "");
        keychain.setGenericPassword(userId, userId, password, serviceMap);
        promise.resolve(null);
    }

    @ReactMethod
    public void recoverPassword(String userId, Promise promise) {
        promise.resolve(stickProtocol.recoverPassword(userId));
    }

    @ReactMethod
    public void ratchetChain(String userId, String stickId, int steps, Promise promise) throws NoSessionException {
        stickProtocol.ratchetChain(userId, stickId, steps);
        promise.resolve(true);
    }

    @ReactMethod
    public void generatePreKeys(int nextPreKeyId, int count, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    ReadableArray preKeysArray = convertJsonToArray(stickProtocol.generatePreKeys(nextPreKeyId, count));
                    promise.resolve(preKeysArray);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void initialize(String userId, String password, Promise promise) {
        AsyncTask.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    ProgressEventImpl progressEvent = new ProgressEventImpl();
                    JSONObject jsonBundle = stickProtocol.initialize(userId, password, progressEvent);
                    ReadableMap bundle = convertJsonToMap(jsonBundle);
                    promise.resolve(bundle);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void checkRegistration(Promise promise) {
        promise.resolve(stickProtocol.isInitialized());
    }

    @ReactMethod
    public void initPairwiseSession(ReadableMap bundle) throws JSONException {
        stickProtocol.initPairwiseSession(convertMapToJson(bundle));
    }


    @ReactMethod()
    public void pairwiseSessionExists(String oneTimeId, Promise promise) {
        promise.resolve(stickProtocol.pairwiseSessionExists(oneTimeId));
    }

    @ReactMethod
    public void encryptTextPairwise(String userId, String text, Promise promise) {
        promise.resolve(stickProtocol.encryptTextPairwise(userId, text));
    }


    @ReactMethod
    public void createStickySession(String userId, String stickId, Promise promise) throws JSONException {
        promise.resolve(convertJsonToMap(stickProtocol.createStickySession(userId, stickId)));
    }


    @ReactMethod
    public void getSenderKey(String senderId, String targetId, String stickId, Boolean isSticky, Promise promise) throws IOException, LegacyMessageException, InvalidMessageException {
        promise.resolve(stickProtocol.getSenderKey(senderId, targetId, stickId, isSticky));
    }

    @ReactMethod
    public void getChainStep(String userId, String stickId, Promise promise) {
        promise.resolve(stickProtocol.getChainStep(userId, stickId));
    }

    @ReactMethod
    public void encryptText(String senderId, String stickId, String text, Boolean isSticky, Promise promise) {
        promise.resolve(stickProtocol.encryptText(senderId, stickId, text, isSticky));
    }

    @ReactMethod
    public void sessionExists(String senderId, String stickId, Promise promise) {
        promise.resolve(stickProtocol.sessionExists(senderId, stickId));
    }

    @ReactMethod
    public void reinitMyStickySession(String userId, ReadableMap senderKey, Promise promise) throws IOException, JSONException, NoSessionException, InvalidKeyException {
        stickProtocol.reinitMyStickySession(userId, convertMapToJson(senderKey));
        promise.resolve(true);
    }

    @ReactMethod
    public void initStickySession(String senderId, String stickId, String cipherSenderKey, int identityKeyId) {
        stickProtocol.initStickySession(senderId, stickId, cipherSenderKey, identityKeyId);
    }

    @ReactMethod
    public void initStandardGroupSession(String senderId, String chatId, String cipherSenderKey) {
        stickProtocol.initStandardGroupSession(senderId, chatId, cipherSenderKey);
    }

    @ReactMethod
    public void decryptText(String senderId, String stickId, String cipher, Boolean isSticky, Promise promise) {
        promise.resolve(stickProtocol.decryptText(senderId, stickId, cipher, isSticky));
    }

    @ReactMethod
    public void decryptTextPairwise(String oneTimeId, String cipher, Promise promise) {
        promise.resolve(stickProtocol.decryptTextPairwise(oneTimeId, false, cipher));
    }


    @ReactMethod
    public void encryptFilePairwise(String userId, String filePath, Promise promise) throws JSONException {
        promise.resolve(convertJsonToMap(stickProtocol.encryptFilePairwise(userId, filePath)));
    }

    @ReactMethod
    public void encryptFile(String senderId, String stickId, String filePath, Boolean isSticky, String type, Promise promise) throws JSONException {
        String uriString;
        if (filePath.startsWith("content://")) {
            File localFile = getLocalUri(filePath, type);
            uriString = Uri.fromFile(localFile).toString().substring(7);
        } else
            uriString = filePath;
        promise.resolve(convertJsonToMap(stickProtocol.encryptFile(senderId, stickId, uriString, isSticky)));
    }

    @ReactMethod
    public void encryptFileVault(String filePath, String type, Promise promise) throws Exception {
        String uriString;
        if (filePath.startsWith("content://")) {
            File localFile = getLocalUri(filePath, type);
            uriString = Uri.fromFile(localFile).toString().substring(7);
        } else
            uriString = filePath;
        HashMap<String, String> response = stickProtocol.encryptBlob(uriString);
        String userId = PreferenceManager.getDefaultSharedPreferences(reactContext).getString("userId", "");
        HashMap<String, String> encrypted = stickProtocol.pbEncrypt(response.get("secret").getBytes(), stickProtocol.recoverPassword(userId));
        JSONObject map = new JSONObject();
        map.put("uri", response.get("uri"));
        map.put("cipher", encrypted.get("cipher") + encrypted.get("salt"));
        promise.resolve(convertJsonToMap(map));
    }

    @ReactMethod
    public void encryptTextVault(String text, Promise promise) throws Exception {
        String userId = PreferenceManager.getDefaultSharedPreferences(reactContext).getString("userId", "");
        HashMap<String, String> encrypted = stickProtocol.pbEncrypt(text.getBytes(), stickProtocol.recoverPassword(userId));
        promise.resolve(encrypted.get("cipher") + encrypted.get("salt"));
    }

    @ReactMethod
    public void decryptFileVault(String filePath, String cipher, int size, String outputPath, Promise promise) throws Exception {
        String encryptedSecret = cipher.substring(0, cipher.length() - 44);
        String salt = cipher.substring(cipher.length() - 44);
        String userId = PreferenceManager.getDefaultSharedPreferences(reactContext).getString("userId", "");
        byte[] secret = stickProtocol.pbDecrypt(encryptedSecret, salt, stickProtocol.recoverPassword(userId));
        String path = null;
        if (secret != null)
            path = stickProtocol.decryptBlob(filePath, new String(secret, StandardCharsets.UTF_8), outputPath);
        promise.resolve(path);
    }

    @ReactMethod
    public void decryptTextVault(String cipher, Promise promise) throws Exception {
        String encryptedSecret = cipher.substring(0, cipher.length() - 44);
        String salt = cipher.substring(cipher.length() - 44);
        String userId = PreferenceManager.getDefaultSharedPreferences(reactContext).getString("userId", "");
        byte[] secret = stickProtocol.pbDecrypt(encryptedSecret, salt, stickProtocol.recoverPassword(userId));
        if (secret != null)
            promise.resolve(new String(secret, StandardCharsets.UTF_8));
        else promise.resolve("");
    }

    @ReactMethod
    public void decryptFilePairwise(String senderId, String filePath, String cipher, int size, String outputPath, Promise promise) {
        promise.resolve(stickProtocol.decryptFilePairwise(senderId, filePath, cipher, outputPath));
    }

    @ReactMethod
    public void decryptFile(String senderId, String stickId, String filePath, String cipher, int size, String outputPath, Boolean isSticky, Promise promise) {
        promise.resolve(stickProtocol.decryptFile(senderId, stickId, filePath, cipher, outputPath, isSticky));
    }

    @ReactMethod
    public void refreshSignedPreKey(Promise promise) throws Exception {
        JSONObject result = stickProtocol.refreshSignedPreKey(TimeUnit.DAYS.toMillis(30));
        if (result != null) {
            promise.resolve(convertJsonToMap(result));
        }
        promise.resolve(null);
    }

    @ReactMethod
    public void refreshIdentityKey(Promise promise) throws Exception {
        JSONObject result = stickProtocol.refreshIdentityKey(TimeUnit.DAYS.toMillis(30));
        if (result != null) {
            promise.resolve(convertJsonToMap(result));
        }
        promise.resolve(null);
    }

//    @ReactMethod
//    public void test(Promise promise) {
//        MyProtocolStore store = new MyProtocolStore(reactContext);
//        List<PreKeyRecord> preKeys = store.loadPreKeys();
//        ECKeyPair ecKey = preKeys.get(0).getKeyPair();
//        ECPublicKey ecPublicKey = ecKey.getPublicKey();
//        ECPrivateKey ecPrivateKey = ecKey.getPrivateKey();
//        byte[] pub = ecPublicKey.serialize();
//        byte[] priv = ecPrivateKey.serialize();
//        Log.d("PUBXXX", Base64.encodeBytes(pub));
//        Log.d("PRIVXXX", Base64.encodeBytes(priv));
//        promise.resolve(null);
//    }
}