package expo.modules.stickprotocol

import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.CancellationSignal
import android.preference.PreferenceManager
import android.provider.MediaStore
import android.util.Size
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.stiiick.stickprotocol.main.StickProtocol
import com.stiiick.stickprotocol.keychain.Keychain
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.util.concurrent.TimeUnit

class StickProtocolModule : Module() {
    private val context get() = appContext.reactContext ?: throw Exception("React context not available")

    private val stickProtocol by lazy {
        StickProtocol(context, context.packageName)
    }

    override fun definition() = ModuleDefinition {
        Name("StickProtocol")

        Events("KeysProgress")

        // --- resetDatabase ---
        AsyncFunction("resetDatabase") {
            stickProtocol.resetDatabase()
        }

        // --- reInitialize ---
        AsyncFunction("reInitialize") { bundle: Map<String, Any?>, password: String, userId: String ->
            stickProtocol.reInitialize(mapToJson(bundle), password, userId) { event ->
              val progress = event.getInt("progress")
              val total = event.getInt("total")
              sendEvent("KeysProgress", mapOf("progress" to progress, "total" to total))
            }
        }

        // --- decryptPreKeys ---
        AsyncFunction("decryptPreKeys") { preKeys: List<Any?> ->
            stickProtocol.decryptPreKeys(JSONArray(preKeys))
        }

        // --- reEncryptKeys ---
        AsyncFunction("reEncryptKeys") { password: String ->
            val jsonBundle = stickProtocol.reEncryptKeys(password) { event ->
                sendEvent("KeysProgress", mapOf(
                    "progress" to event.getInt("progress"),
                    "total" to event.getInt("total")
                ))
            }
            jsonToMap(jsonBundle)
        }

        // --- reEncryptCiphers ---
        AsyncFunction("reEncryptCiphers") { ciphersMap: Map<String, Any?>, currentPass: String, newPass: String ->
            val ciphers = mapToJson(ciphersMap)
            val filesCipher = ciphers.getJSONArray("filesCipher")
            val notesCipher = ciphers.getJSONArray("notesCipher")
            val profile = ciphers.getJSONObject("profile")

            for (i in 0 until filesCipher.length()) {
                val file = filesCipher.getJSONObject(i)
                file.put("cipher", reEncryptCipher(file.getString("cipher"), currentPass, newPass))
                if (file.has("previewCipher")) {
                    file.put("previewCipher", reEncryptCipher(file.getString("previewCipher"), currentPass, newPass))
                }
            }
            for (i in 0 until notesCipher.length()) {
                val note = notesCipher.getJSONObject(i)
                note.put("cipher", reEncryptCipher(note.getString("cipher"), currentPass, newPass))
            }
            if (profile.has("profilePictureCipher")) {
                profile.put("profilePictureCipher", reEncryptCipher(profile.getString("profilePictureCipher"), currentPass, newPass))
            }
            jsonToMap(ciphers)
        }

        // --- decryptDSKs ---
        AsyncFunction("decryptDSKs") { DSKs: List<Map<String, Any?>> ->
            for (dskMap in DSKs) {
                val dsk = mapToJson(dskMap)
                stickProtocol.initStickySession(
                    dsk.getString("senderId"),
                    dsk.getString("stickId"),
                    dsk.getString("key"),
                    dsk.getInt("identityKeyId")
                )
            }
        }

        // --- createPasswordHash ---
        AsyncFunction("createPasswordHash") { password: String, passwordSalt: String ->
            stickProtocol.createPasswordHash(password, passwordSalt)
        }

        // --- createNewPasswordHash ---
        AsyncFunction("createNewPasswordHash") { password: String ->
            jsonToMap(stickProtocol.createNewPasswordHash(password))
        }

        // --- updateKeychainPassword ---
        AsyncFunction("updateKeychainPassword") { password: String ->
            val serviceMap = hashMapOf<String, String>()
            serviceMap["service"] = context.packageName + ".password"
            val keychain = Keychain(context)
            val userId = context.getSharedPreferences(context.packageName + "_preferences", android.content.Context.MODE_PRIVATE).getString("userId", "") ?: ""
            keychain.setGenericPassword(userId, userId, password, serviceMap)
            null
        }

        // --- recoverPassword ---
        AsyncFunction("recoverPassword") { userId: String ->
            stickProtocol.recoverPassword(userId)
        }

        // --- ratchetChain ---
        AsyncFunction("ratchetChain") { userId: String, stickId: String, steps: Int ->
            stickProtocol.ratchetChain(userId, stickId, steps)
        }

        // --- generatePreKeys ---
        AsyncFunction("generatePreKeys") { nextPreKeyId: Int, count: Int ->
            jsonToList(stickProtocol.generatePreKeys(nextPreKeyId, count))
        }

        // --- initialize ---
        AsyncFunction("initialize") { userId: String, password: String ->
            val jsonResult = stickProtocol.initialize(userId, password) { event ->
                sendEvent("KeysProgress", mapOf(
                    "progress" to event.getInt("progress"),
                    "total" to event.getInt("total")
                ))
            }
            jsonToMap(jsonResult)
        }

        // --- checkRegistration ---
        AsyncFunction("checkRegistration") {
            stickProtocol.isInitialized()
        }

        // --- initPairwiseSession ---
        AsyncFunction("initPairwiseSession") { bundle: Map<String, Any?> ->
            stickProtocol.initPairwiseSession(mapToJson(bundle))
        }

        // --- pairwiseSessionExists ---
        AsyncFunction("pairwiseSessionExists") { oneTimeId: String ->
            stickProtocol.pairwiseSessionExists(oneTimeId)
        }

        // --- encryptTextPairwise ---
        AsyncFunction("encryptTextPairwise") { userId: String, text: String ->
            stickProtocol.encryptTextPairwise(userId, text)
        }

        // --- createStickySession ---
        AsyncFunction("createStickySession") { userId: String, stickId: String ->
            jsonToMap(stickProtocol.createStickySession(userId, stickId))
        }

        // --- getSenderKey ---
        AsyncFunction("getSenderKey") { senderId: String, targetId: String, stickId: String, isSticky: Boolean ->
            stickProtocol.getSenderKey(senderId, targetId, stickId, isSticky)
        }

        // --- getChainStep ---
        AsyncFunction("getChainStep") { userId: String, stickId: String ->
            stickProtocol.getChainStep(userId, stickId)
        }

        // --- encryptText ---
        AsyncFunction("encryptText") { senderId: String, stickId: String, text: String, isSticky: Boolean ->
            stickProtocol.encryptText(senderId, stickId, text, isSticky)
        }

        // --- sessionExists ---
        AsyncFunction("sessionExists") { senderId: String, stickId: String ->
            stickProtocol.sessionExists(senderId, stickId)
        }

        // --- reinitMyStickySession ---
        AsyncFunction("reinitMyStickySession") { userId: String, senderKey: Map<String, Any?> ->
            stickProtocol.reinitMyStickySession(userId, mapToJson(senderKey))
        }

        // --- initStickySession ---
        AsyncFunction("initStickySession") { senderId: String, stickId: String, cipherSenderKey: String, identityKeyId: Int ->
            stickProtocol.initStickySession(senderId, stickId, cipherSenderKey, identityKeyId)
        }

        // --- initStandardGroupSession ---
        AsyncFunction("initStandardGroupSession") { senderId: String, chatId: String, cipherSenderKey: String ->
            stickProtocol.initStandardGroupSession(senderId, chatId, cipherSenderKey)
        }

        // --- decryptText ---
        AsyncFunction("decryptText") { senderId: String, stickId: String, cipher: String, isSticky: Boolean ->
            stickProtocol.decryptText(senderId, stickId, cipher, isSticky)
        }

        // --- decryptTextPairwise ---
        AsyncFunction("decryptTextPairwise") { oneTimeId: String, cipher: String ->
            stickProtocol.decryptTextPairwise(oneTimeId, false, cipher)
        }

        // --- encryptFilePairwise ---
        AsyncFunction("encryptFilePairwise") { userId: String, filePath: String ->
            jsonToMap(stickProtocol.encryptFilePairwise(userId, filePath))
        }

        // --- encryptFile ---
        AsyncFunction("encryptFile") { senderId: String, stickId: String, filePath: String, isSticky: Boolean, type: String ->
            val uriString = if (filePath.startsWith("content://")) {
                val localFile: File = getLocalUri(context, filePath, type)
                Uri.fromFile(localFile).toString().substring(7)
            } else {
                filePath
            }
            jsonToMap(stickProtocol.encryptFile(senderId, stickId, uriString, isSticky))
        }

        // --- encryptFileVault ---
        AsyncFunction("encryptFileVault") { filePath: String, type: String ->
            val uriString = if (filePath.startsWith("content://")) {
                val localFile: File = getLocalUri(context, filePath, type)
                Uri.fromFile(localFile).toString().substring(7)
            } else {
                filePath
            }
            val response = stickProtocol.encryptBlob(uriString)
            val userId = context.getSharedPreferences(context.packageName + "_preferences", android.content.Context.MODE_PRIVATE).getString("userId", "") ?: ""
            val encrypted = stickProtocol.pbEncrypt(response["secret"]?.toByteArray(), stickProtocol.recoverPassword(userId))
            val map = JSONObject()
            map.put("uri", response["uri"])
            map.put("cipher", (encrypted["cipher"] ?: "") + (encrypted["salt"] ?: ""))
            jsonToMap(map)
        }

        // --- encryptTextVault ---
        AsyncFunction("encryptTextVault") { text: String ->
            val userId = context.getSharedPreferences(context.packageName + "_preferences", android.content.Context.MODE_PRIVATE).getString("userId", "") ?: ""
            val encrypted = stickProtocol.pbEncrypt(text.toByteArray(), stickProtocol.recoverPassword(userId))
            (encrypted["cipher"] ?: "") + (encrypted["salt"] ?: "")
        }

        // --- decryptFileVault ---
        AsyncFunction("decryptFileVault") { filePath: String, cipher: String, size: Int, outputPath: String ->
            if (cipher.length < 44) return@AsyncFunction null
            val encryptedSecret = cipher.substring(0, cipher.length - 44)
            val salt = cipher.substring(cipher.length - 44)
            val userId = context.getSharedPreferences(context.packageName + "_preferences", android.content.Context.MODE_PRIVATE).getString("userId", "") ?: ""
            val secret = stickProtocol.pbDecrypt(encryptedSecret, salt, stickProtocol.recoverPassword(userId))
            if (secret != null) {
                stickProtocol.decryptBlob(filePath, String(secret, Charsets.UTF_8), outputPath)
            } else {
                null
            }
        }

        // --- decryptTextVault ---
        AsyncFunction("decryptTextVault") { cipher: String ->
            if (cipher.length < 44) return@AsyncFunction ""
            val encryptedSecret = cipher.substring(0, cipher.length - 44)
            val salt = cipher.substring(cipher.length - 44)
            val userId = context.getSharedPreferences(context.packageName + "_preferences", android.content.Context.MODE_PRIVATE).getString("userId", "") ?: ""
            val secret = stickProtocol.pbDecrypt(encryptedSecret, salt, stickProtocol.recoverPassword(userId))
            secret?.let { String(it, Charsets.UTF_8) } ?: ""
        }

        // --- decryptFilePairwise ---
        AsyncFunction("decryptFilePairwise") { senderId: String, filePath: String, cipher: String, size: Int, outputPath: String ->
            stickProtocol.decryptFilePairwise(senderId, filePath, cipher, outputPath)
        }

        // --- decryptFile ---
        AsyncFunction("decryptFile") { senderId: String, stickId: String, filePath: String, cipher: String, size: Int, outputPath: String, isSticky: Boolean ->
            stickProtocol.decryptFile(senderId, stickId, filePath, cipher, outputPath, isSticky)
        }

        // --- refreshSignedPreKey ---
        AsyncFunction("refreshSignedPreKey") {
            val result = stickProtocol.refreshSignedPreKey(TimeUnit.DAYS.toMillis(30))
            result?.let { jsonToMap(it) }
        }

        // --- refreshIdentityKey ---
        AsyncFunction("refreshIdentityKey") {
            val result = stickProtocol.refreshIdentityKey(TimeUnit.DAYS.toMillis(30))
            result?.let { jsonToMap(it) }
        }
    }

    // --- Helper: Convert JSONObject to Map ---
    private fun jsonToMap(jsonObject: JSONObject): Map<String, Any?> {
        val map = mutableMapOf<String, Any?>()
        val keys = jsonObject.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            val value = jsonObject.get(key)
            map[key] = when (value) {
                is JSONObject -> jsonToMap(value)
                is JSONArray -> jsonToList(value)
                JSONObject.NULL -> null
                else -> value
            }
        }
        return map
    }

    // --- Helper: Convert JSONArray to List ---
    private fun jsonToList(jsonArray: JSONArray): List<Any?> {
        val list = mutableListOf<Any?>()
        for (i in 0 until jsonArray.length()) {
            val value = jsonArray.get(i)
            list.add(when (value) {
                is JSONObject -> jsonToMap(value)
                is JSONArray -> jsonToList(value)
                JSONObject.NULL -> null
                else -> value
            })
        }
        return list
    }

    // --- Helper: Re-encrypt cipher with new password ---
    private fun reEncryptCipher(cipher: String, currentPass: String, newPass: String): String {
        if (cipher.length < 44) return ""
        val encryptedSecret = cipher.substring(0, cipher.length - 44)
        val salt = cipher.substring(cipher.length - 44)
        val secret = stickProtocol.pbDecrypt(encryptedSecret, salt, currentPass)
        val encrypted = stickProtocol.pbEncrypt(secret, newPass)
        return (encrypted["cipher"] ?: "") + (encrypted["salt"] ?: "")
    }

    fun copy(inputStream: InputStream, outputStream: OutputStream) {
      val buffer = ByteArray(8192)
      var read: Int
      while (inputStream.read(buffer).also { read = it } != -1) {
          outputStream.write(buffer, 0, read)
      }
    }

    fun getLocalUri(context: android.content.Context, path: String, type: String): File {
      val imageUri = Uri.parse(path)
      val file = File(context.externalCacheDir, imageUri.lastPathSegment ?: "temp")
      FileOutputStream(file).use { fileOutputStream ->
          val inputStream = if (type.startsWith("image")) {
              val assetDescriptor = context.contentResolver.openAssetFileDescriptor(imageUri, "r")
              FileInputStream(assetDescriptor?.fileDescriptor)
          } else {
              val bitmap = getVideoThumbnail(context, imageUri)
              val bos = ByteArrayOutputStream()
              bitmap?.compress(Bitmap.CompressFormat.PNG, 100, bos)
              ByteArrayInputStream(bos.toByteArray())
          }
          copy(inputStream, fileOutputStream)
          inputStream.close()
      }
      return file
    }

    @Suppress("DEPRECATION")
    private fun getVideoThumbnail(context: android.content.Context, uri: Uri): Bitmap? {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          try {
              context.contentResolver.loadThumbnail(uri, Size(96, 96), CancellationSignal())
          } catch (e: Exception) {
              null
          }
      } else {
          MediaStore.Video.Thumbnails.getThumbnail(
              context.contentResolver,
              uri.lastPathSegment?.toLongOrNull() ?: 0L,
              MediaStore.Images.Thumbnails.MICRO_KIND,
              null
          )
      }
    }

private fun mapToJson(map: Map<String, Any?>): JSONObject {
    val json = JSONObject()
    map.forEach { (key, value) ->
        when (value) {
            is Map<*, *> -> json.put(key, mapToJson(value as Map<String, Any?>))
            is List<*> -> json.put(key, listToJson(value as List<Any?>))
            is Double -> {
                if (value == value.toInt().toDouble()) {
                    json.put(key, value.toInt())
                } else {
                    json.put(key, value)
                }
            }
            else -> json.put(key, value)
        }
    }
    return json
}

private fun listToJson(list: List<Any?>): JSONArray {
    val json = JSONArray()
    list.forEach { value ->
        when (value) {
            is Map<*, *> -> json.put(mapToJson(value as Map<String, Any?>))
            is List<*> -> json.put(listToJson(value as List<Any?>))
            is Double -> {
                if (value == value.toInt().toDouble()) {
                    json.put(value.toInt())
                } else {
                    json.put(value)
                }
            }
            else -> json.put(value)
        }
    }
    return json
}
}
