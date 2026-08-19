package com.example.middlespace.admin

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.provider.OpenableColumns
import com.example.middlespace.admin.BuildConfig
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataOutputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.util.UUID

class AdminApiException(message: String) : Exception(message)

class SessionStore(context: Context) {
    private val preferences = context.getSharedPreferences("middle_space_admin_session", Context.MODE_PRIVATE)

    fun load(): AdminSession? {
        val access = preferences.getString("access", null)?.takeIf(String::isNotBlank) ?: return null
        return AdminSession(access, preferences.getString("refresh_cookie", null))
    }

    fun save(session: AdminSession) {
        preferences.edit()
            .putString("access", session.accessToken)
            .putString("refresh_cookie", session.refreshCookie)
            .apply()
    }

    fun clear() = preferences.edit().clear().apply()
}

class AdminApi(
    private val context: Context,
    private val sessionStore: SessionStore,
    private val baseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/'),
) {
    fun login(email: String, password: String): AdminSession {
        val result = execute(
            method = "POST",
            path = "/v1/owner/auth/login/",
            jsonBody = JSONObject().put("email", email).put("password", password),
        )
        ensureSuccess(result)
        val access = JSONObject(result.text).getString("access")
        return AdminSession(access, extractRefreshCookie(result.setCookies)).also(sessionStore::save)
    }

    fun logout() {
        runCatching { authenticated("POST", "/v1/owner/auth/logout/") }
        sessionStore.clear()
    }

    fun fetchStore(): Store? {
        val result = authenticated("GET", "/v1/owner/stores/")
        val array = if (result.text.trimStart().startsWith("[")) {
            JSONArray(result.text)
        } else {
            JSONObject(result.text).optJSONArray("results") ?: JSONArray()
        }
        if (array.length() == 0) return null
        val slug = array.getJSONObject(0).getString("slug")
        return parseStore(JSONObject(authenticated("GET", "/v1/owner/stores/${Uri.encode(slug)}/").text))
    }

    fun createStore(
        name: String,
        location: String,
        businessNumber: String,
        description: String,
    ): Store {
        val body = JSONObject()
            .put("name", name)
            .put("location", location)
            .put("business_number", businessNumber)
            .put("description", description)
        return parseStore(JSONObject(authenticated("POST", "/v1/owner/stores/", body).text))
    }

    fun fetchMarkers(slug: String): List<StoreMarker> {
        val array = JSONArray(authenticated("GET", "/v1/owner/stores/${Uri.encode(slug)}/markers/").text)
        return buildList {
            for (index in 0 until array.length()) add(parseMarker(array.getJSONObject(index)))
        }
    }

    fun createMarker(slug: String, imageUri: Uri, physicalWidthMeters: Double): StoreMarker {
        val bytes = context.contentResolver.openInputStream(imageUri)?.use { it.readBytes() }
            ?: throw AdminApiException("선택한 이미지를 읽을 수 없습니다.")
        if (bytes.size > 10 * 1024 * 1024) throw AdminApiException("이미지는 10MB 이하여야 합니다.")
        val mimeType = context.contentResolver.getType(imageUri) ?: "image/jpeg"
        val fileName = queryFileName(imageUri) ?: "marker-${System.currentTimeMillis()}.jpg"
        val result = authenticatedMultipart(
            path = "/v1/owner/stores/${Uri.encode(slug)}/markers/",
            fileName = fileName,
            mimeType = mimeType,
            imageBytes = bytes,
            physicalWidthMeters = physicalWidthMeters,
        )
        return parseMarker(JSONObject(result.text))
    }

    fun activateMarker(slug: String, markerId: String): StoreMarker = parseMarker(
        JSONObject(
            authenticated(
                "POST",
                "/v1/owner/stores/${Uri.encode(slug)}/markers/${Uri.encode(markerId)}/activate/",
            ).text,
        ),
    )

    fun downloadBitmap(rawUrl: String): Bitmap {
        val connection = URL(remapLoopback(rawUrl)).openConnection() as HttpURLConnection
        connection.connectTimeout = 10_000
        connection.readTimeout = 20_000
        try {
            if (connection.responseCode !in 200..299) {
                throw AdminApiException("이미지를 내려받지 못했습니다. (${connection.responseCode})")
            }
            return connection.inputStream.use(BitmapFactory::decodeStream)
                ?: throw AdminApiException("이미지 형식을 확인할 수 없습니다.")
        } finally {
            connection.disconnect()
        }
    }

    private fun authenticated(method: String, path: String, body: JSONObject? = null): HttpResult {
        var session = sessionStore.load() ?: throw AdminApiException("로그인이 필요합니다.")
        var result = execute(method, path, body, accessToken = session.accessToken)
        if (result.code == HttpURLConnection.HTTP_UNAUTHORIZED && session.refreshCookie != null) {
            session = refresh(session.refreshCookie)
            result = execute(method, path, body, accessToken = session.accessToken)
        }
        ensureSuccess(result)
        return result
    }

    private fun authenticatedMultipart(
        path: String,
        fileName: String,
        mimeType: String,
        imageBytes: ByteArray,
        physicalWidthMeters: Double,
    ): HttpResult {
        var session = sessionStore.load() ?: throw AdminApiException("로그인이 필요합니다.")
        var result = executeMultipart(path, session.accessToken, fileName, mimeType, imageBytes, physicalWidthMeters)
        if (result.code == HttpURLConnection.HTTP_UNAUTHORIZED && session.refreshCookie != null) {
            session = refresh(session.refreshCookie)
            result = executeMultipart(path, session.accessToken, fileName, mimeType, imageBytes, physicalWidthMeters)
        }
        ensureSuccess(result)
        return result
    }

    private fun refresh(cookie: String): AdminSession {
        val result = execute("POST", "/v1/owner/auth/refresh/", cookie = cookie)
        ensureSuccess(result)
        val rotatedCookie = extractRefreshCookie(result.setCookies) ?: cookie
        return AdminSession(JSONObject(result.text).getString("access"), rotatedCookie).also(sessionStore::save)
    }

    private fun execute(
        method: String,
        path: String,
        jsonBody: JSONObject? = null,
        accessToken: String? = null,
        cookie: String? = null,
    ): HttpResult {
        val connection = URL("$baseUrl$path").openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 10_000
        connection.readTimeout = 20_000
        connection.setRequestProperty("Accept", "application/json")
        connection.setRequestProperty("User-Agent", "MiddleSpaceAdmin/${BuildConfig.VERSION_NAME}")
        accessToken?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
        cookie?.let { connection.setRequestProperty("Cookie", it) }
        if (jsonBody != null) {
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
            connection.outputStream.use { it.write(jsonBody.toString().toByteArray(Charsets.UTF_8)) }
        }
        return readResult(connection)
    }

    private fun executeMultipart(
        path: String,
        accessToken: String,
        fileName: String,
        mimeType: String,
        imageBytes: ByteArray,
        physicalWidthMeters: Double,
    ): HttpResult {
        val boundary = "MiddleSpace-${UUID.randomUUID()}"
        val connection = URL("$baseUrl$path").openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.connectTimeout = 15_000
        connection.readTimeout = 30_000
        connection.doOutput = true
        connection.setRequestProperty("Accept", "application/json")
        connection.setRequestProperty("Authorization", "Bearer $accessToken")
        connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
        DataOutputStream(connection.outputStream).use { output ->
            output.writeBytes("--$boundary\r\n")
            output.writeBytes("Content-Disposition: form-data; name=\"physical_width_m\"\r\n\r\n")
            output.writeBytes("$physicalWidthMeters\r\n")
            output.writeBytes("--$boundary\r\n")
            output.writeBytes("Content-Disposition: form-data; name=\"image\"; filename=\"${fileName.replace('"', '_')}\"\r\n")
            output.writeBytes("Content-Type: $mimeType\r\n\r\n")
            output.write(imageBytes)
            output.writeBytes("\r\n--$boundary--\r\n")
        }
        return readResult(connection)
    }

    private fun readResult(connection: HttpURLConnection): HttpResult {
        try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val cookies = connection.headerFields.entries
                .firstOrNull { it.key?.equals("Set-Cookie", ignoreCase = true) == true }
                ?.value.orEmpty()
            return HttpResult(code, text, cookies)
        } finally {
            connection.disconnect()
        }
    }

    private fun ensureSuccess(result: HttpResult) {
        if (result.code in 200..299) return
        val message = runCatching {
            val json = JSONObject(result.text)
            json.optString("detail").takeIf(String::isNotBlank)
                ?: json.keys().asSequence().firstOrNull()?.let { key ->
                    val value = json.opt(key)
                    if (value is JSONArray && value.length() > 0) value.optString(0) else value?.toString()
                }
        }.getOrNull()
        throw AdminApiException(message ?: "서버 요청에 실패했습니다. (${result.code})")
    }

    private fun parseStore(json: JSONObject): Store = Store(
        id = json.optString("place_id", json.optString("uuid")),
        slug = json.getString("slug"),
        name = json.getString("name"),
        location = json.optString("location"),
        description = json.optString("description"),
        businessNumber = json.optString("business_number"),
        isActive = json.optBoolean("is_active", true),
        requireApproval = json.optBoolean("require_approval", true),
        publicUrl = remapLoopback(json.optString("public_url")),
        qrRedirectUrl = remapLoopback(json.optString("qr_redirect_url")),
        qrUrl = remapLoopback(json.optString("qr_url")),
        qrScanCount = json.optInt("qr_scan_count"),
        qrLastScannedAt = json.optString("qr_last_scanned_at").takeIf { it.isNotBlank() && it != "null" },
        activeMarker = json.optJSONObject("active_marker")?.let(::parseMarker),
    )

    private fun parseMarker(json: JSONObject): StoreMarker = StoreMarker(
        id = json.getString("id"),
        version = json.getInt("version"),
        imageUrl = remapLoopback(json.getString("image_url")),
        imageSha256 = json.optString("image_sha256"),
        physicalWidthMeters = json.getDouble("physical_width_m"),
        coordinateFrame = json.optString("coordinate_frame", "marker_local_v2"),
        isActive = json.optBoolean("is_active"),
        createdAt = json.optString("created_at"),
    )

    private fun queryFileName(uri: Uri): String? {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) return cursor.getString(0)
        }
        return uri.lastPathSegment
    }

    private fun remapLoopback(rawUrl: String): String {
        if (rawUrl.isBlank()) return rawUrl
        val uri = runCatching { URI(rawUrl) }.getOrNull() ?: return rawUrl
        if (uri.host?.lowercase() !in setOf("localhost", "127.0.0.1", "10.0.2.2")) return rawUrl
        val apiUri = runCatching { URI(baseUrl) }.getOrNull() ?: return rawUrl
        return URI(apiUri.scheme, null, apiUri.host, apiUri.port, uri.path, uri.query, null).toString()
    }

    private fun extractRefreshCookie(headers: List<String>): String? = headers
        .firstOrNull { it.startsWith("owner_refresh=", ignoreCase = true) }
        ?.substringBefore(';')

    private data class HttpResult(val code: Int, val text: String, val setCookies: List<String>)
}
