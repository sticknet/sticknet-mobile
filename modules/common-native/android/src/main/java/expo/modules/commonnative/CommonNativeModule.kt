package expo.modules.commonnative

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import android.os.CancellationSignal
import android.provider.MediaStore
import android.util.Log
import android.util.Size
import androidx.exifinterface.media.ExifInterface
import com.stiiick.stickprotocol.util.Base64
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.*
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.*
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.coroutines.resume

class CommonNativeModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exception("React context not available")
  private var userId: String? = null
  private var passwordKey: String? = null

  private val SAVE_PASSWORD = 0
  private val RECOVER_PASSWORD = 1

  override fun definition() = ModuleDefinition {
    Name("CommonNative")

    // Define constants exported to JS
    Property("mainURL") { "https://www.sticknet.org" }
    Property("cacheDirectoryPath") { appContext.reactContext?.cacheDir?.absolutePath ?: "" }

    // --- Image Processing ---

    AsyncFunction("flipImage") { uri: String ->
      val path = Uri.parse(uri).path
      val image = BitmapFactory.decodeFile(path)
      val matrix = Matrix().apply { postScale(-1f, 1f) }
      val flipped = Bitmap.createBitmap(image, 0, 0, image.width, image.height, matrix, true)
      val file = File(path!!)
      FileOutputStream(file).use { flipped.compress(Bitmap.CompressFormat.JPEG, 100, it) }
      Uri.fromFile(file).toString()
    }

    AsyncFunction("rotateImage") { uri: String, orientation: Int ->
      val path = Uri.parse(uri).path
      val image = BitmapFactory.decodeFile(path)
      val matrix = Matrix().apply { postRotate(if (orientation == 4) 90f else -90f) }
      val rotated = Bitmap.createBitmap(image, 0, 0, image.width, image.height, matrix, true)
      val file = File(path!!)
      FileOutputStream(file).use { rotated.compress(Bitmap.CompressFormat.JPEG, 100, it) }
      Uri.fromFile(file).toString()
    }

        AsyncFunction("getSizeAndResize") { contentUri: String, type: String, mirror: Boolean, resizeWidth: Int, resizeHeight: Int ->
          if (contentUri.isEmpty()) {
            throw Exception("Cannot get the size of an image for an empty URI")
          }

          var localFile: File? = null
          val uriString = if (contentUri.startsWith("content://")) {
            localFile = getLocalUri(context, contentUri, type)
            Uri.fromFile(localFile).toString()
          } else {
            contentUri
          }

          try {
            // Get image dimensions
            val options = BitmapFactory.Options().apply {
              inJustDecodeBounds = true
            }

            val inputStream = context.contentResolver.openInputStream(Uri.parse(uriString))
            BitmapFactory.decodeStream(inputStream, null, options)
            inputStream?.close()

            val width = options.outWidth
            val height = options.outHeight

            val result = mutableMapOf<String, Any>(
              "width" to width,
              "height" to height
            )

            if (type.startsWith("image")) {
              val resizedImage = resizeImage(uriString, width, height, mirror, resizeWidth, resizeHeight)
              result["resizedUri"] = resizedImage.path
              result["fileSize"] = resizedImage.length().toString()
            }

            result
          } finally {
            // Clean up temporary file if created from content:// URI
            localFile?.delete()
          }
        }

    // --- Cryptography & Randomness ---

    AsyncFunction("encryptPassword") { password: String ->
      val secureRandom = SecureRandom()
      val passwordKeyBytes = ByteArray(32)
      secureRandom.nextBytes(passwordKeyBytes)

      val ivSize = 16
      val iv = ByteArray(ivSize)
      secureRandom.nextBytes(iv)
      val ivParameterSpec = IvParameterSpec(iv)

      val secretKeySpec = SecretKeySpec(passwordKeyBytes, "AES")
      val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
      cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivParameterSpec)
      val encrypted = cipher.doFinal(password.toByteArray())

      val encryptedIVAndText = ByteArray(ivSize + encrypted.size)
      System.arraycopy(iv, 0, encryptedIVAndText, 0, ivSize)
      System.arraycopy(encrypted, 0, encryptedIVAndText, ivSize, encrypted.size)

      mapOf(
        "passwordKey" to Base64.encodeBytes(passwordKeyBytes),
        "ciphertext" to Base64.encodeBytes(encryptedIVAndText)
      )
    }

    AsyncFunction("generateSecureRandom") { length: Int ->
      val bytes = ByteArray(length)
      SecureRandom().nextBytes(bytes)
      Base64.encodeBytes(bytes)
    }

    AsyncFunction("generateUUID") {
      UUID.randomUUID().toString()
    }

    AsyncFunction("hash") { text: String ->
      val digest = MessageDigest.getInstance("SHA-256")
      val hash = digest.digest(text.toByteArray(StandardCharsets.UTF_8))
      Base64.encodeBytes(hash)
    }

    AsyncFunction("hashArray") { items: List<String> ->
      val digest = MessageDigest.getInstance("SHA-256")
      items.map { Base64.encodeBytes(digest.digest(it.toByteArray(StandardCharsets.UTF_8))) }
    }

    // --- Media & File Management ---

    AsyncFunction("saveFile") { path: String, type: String ->
      val resolver = context.contentResolver
      val imagesCollection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        if (type == "photo") MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
        else MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
      } else {
        if (type == "photo") MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        else MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      }

      val details = ContentValues().apply {
        put(MediaStore.Images.Media.DISPLAY_NAME, Uri.parse(path).lastPathSegment)
        put(MediaStore.Images.Media.BUCKET_DISPLAY_NAME, if (type == "photo") "Sticknet Photos" else "Sticknet Videos")
      }

      val imageUri = resolver.insert(imagesCollection, details) ?: throw Exception("Failed to insert media record")

      resolver.openOutputStream(imageUri).use { outputStream ->
        FileInputStream(File(path)).use { inputStream ->
          copy(inputStream, outputStream!!)
        }
      }
      true
    }
  }

  // --- Helper Methods ---

  private fun decryptPassword(encryptedIvText: String, key: String): ByteArray {
    val ivSize = 16
    val encryptedIvTextBytes = Base64.decode(encryptedIvText)
    val iv = encryptedIvTextBytes.copyOfRange(0, ivSize)
    val encryptedBytes = encryptedIvTextBytes.copyOfRange(ivSize, encryptedIvTextBytes.size)
    val secretKeySpec = SecretKeySpec(Base64.decode(key), "AES")
    val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
    cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, IvParameterSpec(iv))
    return cipher.doFinal(encryptedBytes)
  }

  private fun resizeImage(path: String, width: Int, height: Int, mirror: Boolean, resizeWidth: Int, resizeHeight: Int): File {
    val myUri = Uri.parse(path)
    val bitmap = BitmapFactory.decodeStream(context.contentResolver.openInputStream(myUri))

    val inputStream = context.contentResolver.openInputStream(myUri)
    val oldExif = ExifInterface(inputStream!!)
    val orientation = oldExif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    val rotation = when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> 90
      ExifInterface.ORIENTATION_ROTATE_180 -> 180
      ExifInterface.ORIENTATION_ROTATE_270 -> 270
      else -> 0
    }

    val matrix = Matrix().apply {
      if (!mirror) postRotate(rotation.toFloat())
      else {
        preRotate(rotation.toFloat())
        postScale(-1f, 1f)
      }
    }

    val ratio = Math.min(resizeWidth.toFloat() / width, resizeHeight.toFloat() / height)
    val finalWidth = (bitmap.width * ratio).toInt()
    val finalHeight = (bitmap.height * ratio).toInt()

    var resultBitmap = Bitmap.createScaledBitmap(bitmap, finalWidth, finalHeight, true)
    resultBitmap = Bitmap.createBitmap(resultBitmap, 0, 0, resultBitmap.width, resultBitmap.height, matrix, true)

    val imageFileName = "image-${UUID.randomUUID()}.jpg"
    val file = File(context.cacheDir, imageFileName)
    FileOutputStream(file).use { fos ->
      resultBitmap.compress(Bitmap.CompressFormat.JPEG, 50, fos)
    }
    return file
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
}
