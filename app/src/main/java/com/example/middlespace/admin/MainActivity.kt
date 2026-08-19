package com.example.middlespace.admin

import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.core.view.WindowCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Navy = Color(0xFF07111F)
private val Panel = Color(0xFF0E1B2D)
private val PanelSoft = Color(0xFF14243A)
private val Border = Color(0xFF263A55)
private val Mint = Color(0xFF63E6BE)
private val Blue = Color(0xFF6E8BFF)
private val Amber = Color(0xFFFFC857)
private val Muted = Color(0xFF9CAFC8)

private val AdminColors: ColorScheme = darkColorScheme(
    primary = Mint,
    onPrimary = Navy,
    secondary = Blue,
    background = Navy,
    onBackground = Color.White,
    surface = Panel,
    onSurface = Color.White,
    surfaceVariant = PanelSoft,
    onSurfaceVariant = Muted,
    outline = Border,
    outlineVariant = Border.copy(alpha = 0.7f),
    error = Color(0xFFFF7B8B),
    errorContainer = Color(0xFF4D1F2A),
    onErrorContainer = Color(0xFFFFD9DF),
)

class MainActivity : ComponentActivity() {
    private val viewModel by viewModels<AdminViewModel>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            MaterialTheme(colorScheme = AdminColors) {
                AdminApp(viewModel)
            }
        }
    }
}

private enum class Destination { HOME, QR, MARKER }

@Composable
private fun AdminApp(viewModel: AdminViewModel) {
    val state by viewModel.state.collectAsState()
    var destination by rememberSaveable { mutableStateOf(Destination.HOME) }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.booting -> LoadingScreen()
            !state.authenticated -> LoginScreen(state, viewModel::login)
            state.store == null -> CreateStoreScreen(state, viewModel::createStore, viewModel::logout)
            destination == Destination.QR -> QrManagementScreen(
                state = state,
                api = viewModel.api,
                onBack = { destination = Destination.HOME },
                onRefresh = viewModel::reloadStore,
            )
            destination == Destination.MARKER -> MarkerManagementScreen(
                state = state,
                api = viewModel.api,
                onBack = { destination = Destination.HOME },
                onUpload = viewModel::uploadMarker,
                onActivate = viewModel::activateMarker,
                onDismissFeedback = viewModel::dismissFeedback,
            )
            else -> AdminHomeScreen(
                state = state,
                onQr = { destination = Destination.QR },
                onMarker = { destination = Destination.MARKER },
                onRefresh = viewModel::reloadStore,
                onLogout = viewModel::logout,
            )
        }
    }
}

@Composable
private fun LoadingScreen() {
    Column(
        Modifier.fillMaxSize().padding(28.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Brand(admin = true)
        Spacer(Modifier.height(32.dp))
        CircularProgressIndicator(color = Mint, strokeWidth = 3.dp)
        Spacer(Modifier.height(16.dp))
        Text("관리자 공간을 준비하고 있어요", color = Muted)
    }
}

@Composable
private fun LoginScreen(state: AdminUiState, onLogin: (String, String) -> Unit) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 20.dp),
    ) {
        Brand(admin = true)
        Spacer(Modifier.height(72.dp))
        Eyebrow("OWNER CONSOLE", Mint)
        Spacer(Modifier.height(12.dp))
        Text("내 공간을\n관리해 보세요", fontSize = 38.sp, lineHeight = 44.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        Text("QR 발급과 AR 진입점 이미지를 앱에서 바로 관리합니다.", color = Muted, fontSize = 16.sp)
        Spacer(Modifier.height(36.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("관리자 이메일") },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("비밀번호") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            shape = RoundedCornerShape(16.dp),
        )
        Feedback(state.error, null)
        Spacer(Modifier.height(22.dp))
        Button(
            onClick = { onLogin(email, password) },
            enabled = !state.busy,
            modifier = Modifier.fillMaxWidth().height(58.dp),
            shape = RoundedCornerShape(18.dp),
        ) {
            if (state.busy) CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
            else Text("관리자 로그인", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun CreateStoreScreen(
    state: AdminUiState,
    onCreate: (String, String, String, String) -> Unit,
    onLogout: () -> Unit,
) {
    var name by rememberSaveable { mutableStateOf("") }
    var location by rememberSaveable { mutableStateOf("") }
    var businessNumber by rememberSaveable { mutableStateOf("") }
    var description by rememberSaveable { mutableStateOf("") }
    ScreenColumn {
        TopBar("새 매장", onLogout, "로그아웃")
        Spacer(Modifier.height(36.dp))
        Eyebrow("FIRST SETUP", Mint)
        Spacer(Modifier.height(10.dp))
        Text("매장을 등록하면\nQR이 바로 발급됩니다", fontSize = 32.sp, lineHeight = 38.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(28.dp))
        FormField(name, { name = it }, "매장명 *")
        FormField(location, { location = it }, "주소 *")
        FormField(businessNumber, { businessNumber = it }, "사업자번호")
        FormField(description, { description = it }, "매장 소개", minLines = 3)
        Feedback(state.error, state.message)
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = { onCreate(name, location, businessNumber, description) },
            enabled = !state.busy,
            modifier = Modifier.fillMaxWidth().height(58.dp),
            shape = RoundedCornerShape(18.dp),
        ) { Text(if (state.busy) "등록 중…" else "매장 등록하고 QR 발급") }
    }
}

@Composable
private fun AdminHomeScreen(
    state: AdminUiState,
    onQr: () -> Unit,
    onMarker: () -> Unit,
    onRefresh: () -> Unit,
    onLogout: () -> Unit,
) {
    val store = state.store ?: return
    ScreenColumn {
        TopBar(store.name, onLogout, "로그아웃")
        Spacer(Modifier.height(38.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            StatusPill(if (store.isActive) "공개 중" else "비공개", if (store.isActive) Mint else Amber)
            Spacer(Modifier.width(8.dp))
            StatusPill(if (store.requireApproval) "승인 후 게시" else "즉시 게시", Blue)
        }
        Spacer(Modifier.height(16.dp))
        Text("관리자 홈", fontSize = 36.sp, fontWeight = FontWeight.Bold)
        Text(store.location.ifBlank { store.slug }, color = Muted, fontSize = 16.sp)
        Spacer(Modifier.height(30.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Metric("QR 스캔", store.qrScanCount.toString(), Modifier.weight(1f))
            Metric("진입점", store.activeMarker?.let { "v${it.version}" } ?: "미등록", Modifier.weight(1f))
        }
        Spacer(Modifier.height(16.dp))
        ActionCard(
            eyebrow = "VISITOR ENTRY",
            title = "QR 발급·관리",
            description = "QR을 확인하고 저장하거나 공유합니다.",
            accent = Blue,
            onClick = onQr,
        )
        Spacer(Modifier.height(14.dp))
        ActionCard(
            eyebrow = "AR ORIGIN",
            title = "진입점 그림 만들기",
            description = "사진을 찍거나 이미지를 골라 AR 기준점으로 등록합니다.",
            accent = Mint,
            onClick = onMarker,
        )
        Feedback(state.error, state.message)
        Spacer(Modifier.height(18.dp))
        TextButton(onClick = onRefresh, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) {
            Text(if (state.busy) "새로고침 중…" else "최신 상태 새로고침", color = Muted)
        }
    }
}

@Composable
private fun QrManagementScreen(
    state: AdminUiState,
    api: AdminApi,
    onBack: () -> Unit,
    onRefresh: () -> Unit,
) {
    val store = state.store ?: return
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var operationBusy by remember { mutableStateOf(false) }
    BackHandler(onBack = onBack)
    ScreenColumn {
        TopBar("QR 발급·관리", onBack, "홈")
        Spacer(Modifier.height(34.dp))
        Eyebrow("DYNAMIC STORE QR", Blue)
        Spacer(Modifier.height(10.dp))
        Text(store.name, fontSize = 32.sp, fontWeight = FontWeight.Bold)
        Text("이 QR은 매장 링크를 유지하면서 스캔 수를 집계합니다.", color = Muted)
        Spacer(Modifier.height(24.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color.White,
            shape = RoundedCornerShape(26.dp),
        ) {
            RemoteImage(
                url = store.qrUrl,
                api = api,
                modifier = Modifier.fillMaxWidth().aspectRatio(1f).padding(24.dp),
                contentScale = ContentScale.Fit,
            )
        }
        Spacer(Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Metric("누적 스캔", store.qrScanCount.toString(), Modifier.weight(1f))
            Metric("마지막 스캔", compactDate(store.qrLastScannedAt), Modifier.weight(1f))
        }
        Spacer(Modifier.height(18.dp))
        Button(
            onClick = {
                scope.launch {
                    operationBusy = true
                    runCatching {
                        val bitmap = withContext(Dispatchers.IO) { api.downloadBitmap(store.qrUrl) }
                        withContext(Dispatchers.IO) { saveBitmap(context, bitmap, "${store.slug}-qr.png") }
                    }.onSuccess { Toast.makeText(context, "QR 이미지를 저장했습니다.", Toast.LENGTH_SHORT).show() }
                        .onFailure { Toast.makeText(context, it.message, Toast.LENGTH_LONG).show() }
                    operationBusy = false
                }
            },
            enabled = !operationBusy,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(17.dp),
        ) { Text(if (operationBusy) "처리 중…" else "QR 이미지 저장") }
        Spacer(Modifier.height(10.dp))
        OutlinedButton(
            onClick = {
                scope.launch {
                    operationBusy = true
                    runCatching {
                        val bitmap = withContext(Dispatchers.IO) { api.downloadBitmap(store.qrUrl) }
                        shareBitmap(context, bitmap, store.name)
                    }.onFailure { Toast.makeText(context, it.message, Toast.LENGTH_LONG).show() }
                    operationBusy = false
                }
            },
            enabled = !operationBusy,
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(17.dp),
        ) { Text("QR 공유") }
        Spacer(Modifier.height(10.dp))
        TextButton(
            onClick = {
                copyText(context, store.qrRedirectUrl.ifBlank { store.publicUrl })
                Toast.makeText(context, "방문자 링크를 복사했습니다.", Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text("방문자 링크 복사") }
        TextButton(onClick = onRefresh, modifier = Modifier.fillMaxWidth()) { Text("스캔 통계 새로고침", color = Muted) }
    }
}

@Composable
private fun MarkerManagementScreen(
    state: AdminUiState,
    api: AdminApi,
    onBack: () -> Unit,
    onUpload: (Uri, Double) -> Unit,
    onActivate: (StoreMarker) -> Unit,
    onDismissFeedback: () -> Unit,
) {
    val context = LocalContext.current
    val store = state.store ?: return
    var selectedUriText by rememberSaveable { mutableStateOf<String?>(null) }
    var pendingCameraUriText by rememberSaveable { mutableStateOf<String?>(null) }
    var widthCentimeters by rememberSaveable { mutableStateOf("10") }
    val selectedUri = selectedUriText?.let(Uri::parse)
    val galleryLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermissionSafely(uri)
            selectedUriText = uri.toString()
            onDismissFeedback()
        }
    }
    val cameraLauncher = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { success ->
        if (success) {
            selectedUriText = pendingCameraUriText
            onDismissFeedback()
        }
    }
    BackHandler(onBack = onBack)
    ScreenColumn {
        TopBar("진입점 그림", onBack, "홈")
        Spacer(Modifier.height(34.dp))
        Eyebrow("AR IMAGE MARKER", Mint)
        Spacer(Modifier.height(10.dp))
        Text("AR 진입점 만들기", fontSize = 32.sp, fontWeight = FontWeight.Bold)
        Text("벽이나 입구에 고정할 그림을 등록하면 사용자 앱이 그 지점을 공간의 원점으로 인식합니다.", color = Muted)
        Spacer(Modifier.height(22.dp))
        val previewUrl = selectedUri?.toString() ?: store.activeMarker?.imageUrl
        Surface(
            modifier = Modifier.fillMaxWidth().aspectRatio(1.35f),
            color = PanelSoft,
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, if (selectedUri != null) Mint.copy(alpha = 0.6f) else Border),
        ) {
            when {
                selectedUri != null -> LocalImage(selectedUri, Modifier.fillMaxSize().padding(12.dp))
                !previewUrl.isNullOrBlank() -> RemoteImage(previewUrl, api, Modifier.fillMaxSize().padding(12.dp))
                else -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("등록된 진입점 이미지가 없습니다.", color = Muted)
                }
            }
        }
        Spacer(Modifier.height(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedButton(
                onClick = { galleryLauncher.launch("image/*") },
                modifier = Modifier.weight(1f).height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) { Text("갤러리") }
            OutlinedButton(
                onClick = {
                    val uri = createCameraUri(context)
                    pendingCameraUriText = uri.toString()
                    cameraLauncher.launch(uri)
                },
                modifier = Modifier.weight(1f).height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) { Text("사진 촬영") }
        }
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = widthCentimeters,
            onValueChange = { widthCentimeters = it.filter { char -> char.isDigit() || char == '.' } },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("실물 가로 길이(cm)") },
            supportingText = { Text("인쇄하거나 부착할 실제 그림의 가로 길이") },
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
        )
        Spacer(Modifier.height(12.dp))
        MarkerQualityGuide()
        Feedback(state.error, state.message)
        Spacer(Modifier.height(14.dp))
        Button(
            onClick = {
                val widthMeters = (widthCentimeters.toDoubleOrNull() ?: 0.0) / 100.0
                selectedUri?.let { onUpload(it, widthMeters) }
            },
            enabled = selectedUri != null && !state.busy,
            modifier = Modifier.fillMaxWidth().height(58.dp),
            shape = RoundedCornerShape(18.dp),
        ) { Text(if (state.busy) "등록 중…" else "새 진입점 버전 등록") }
        if (state.markers.isNotEmpty()) {
            Spacer(Modifier.height(34.dp))
            Eyebrow("VERSION HISTORY", Blue)
            Spacer(Modifier.height(12.dp))
            state.markers.forEach { marker ->
                MarkerHistoryCard(marker, api, state.busy) { onActivate(marker) }
                Spacer(Modifier.height(10.dp))
            }
        }
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
private fun MarkerQualityGuide() {
    Surface(color = PanelSoft, shape = RoundedCornerShape(18.dp), border = BorderStroke(1.dp, Border)) {
        Column(Modifier.padding(17.dp)) {
            Eyebrow("GOOD MARKER", Amber)
            Spacer(Modifier.height(8.dp))
            Text("• 글자와 무늬가 다양하고 대비가 높은 그림\n• 가로·세로 300px 이상의 선명한 이미지\n• 반복 무늬, 단색, 반사가 심한 사진은 피하기", color = Muted, lineHeight = 22.sp)
        }
    }
}

@Composable
private fun MarkerHistoryCard(marker: StoreMarker, api: AdminApi, busy: Boolean, onActivate: () -> Unit) {
    Surface(color = Panel, shape = RoundedCornerShape(18.dp), border = BorderStroke(1.dp, if (marker.isActive) Mint.copy(alpha = 0.45f) else Border)) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            RemoteImage(
                marker.imageUrl,
                api,
                Modifier.size(68.dp).clip(RoundedCornerShape(12.dp)),
                ContentScale.Crop,
            )
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f)) {
                Text("v${marker.version} · ${formatCentimeters(marker.physicalWidthMeters)}", fontWeight = FontWeight.Bold)
                Text(compactDate(marker.createdAt), color = Muted, fontSize = 12.sp)
                Text(marker.coordinateFrame, color = Blue, fontSize = 11.sp)
            }
            TextButton(onClick = onActivate, enabled = !marker.isActive && !busy) {
                Text(if (marker.isActive) "사용 중" else "활성화", color = if (marker.isActive) Mint else Color.White)
            }
        }
    }
}

@Composable
private fun RemoteImage(
    url: String,
    api: AdminApi,
    modifier: Modifier,
    contentScale: ContentScale = ContentScale.Fit,
) {
    var bitmap by remember(url) { mutableStateOf<Bitmap?>(null) }
    var failed by remember(url) { mutableStateOf(false) }
    LaunchedEffect(url) {
        if (url.isBlank()) {
            failed = true
        } else {
            runCatching { withContext(Dispatchers.IO) { api.downloadBitmap(url) } }
                .onSuccess { bitmap = it }
                .onFailure { failed = true }
        }
    }
    Box(modifier.background(if (failed) PanelSoft else Color.Transparent), contentAlignment = Alignment.Center) {
        when {
            bitmap != null -> Image(bitmap!!.asImageBitmap(), null, Modifier.fillMaxSize(), contentScale = contentScale)
            failed -> Text("이미지를 불러오지 못했습니다.", color = Muted, fontSize = 12.sp)
            else -> CircularProgressIndicator(Modifier.size(26.dp), color = Mint, strokeWidth = 2.dp)
        }
    }
}

@Composable
private fun LocalImage(uri: Uri, modifier: Modifier) {
    val context = LocalContext.current
    var bitmap by remember(uri) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(uri) {
        bitmap = withContext(Dispatchers.IO) {
            context.contentResolver.openInputStream(uri)?.use(BitmapFactory::decodeStream)
        }
    }
    Box(modifier, contentAlignment = Alignment.Center) {
        bitmap?.let { Image(it.asImageBitmap(), null, Modifier.fillMaxSize(), contentScale = ContentScale.Fit) }
            ?: CircularProgressIndicator(Modifier.size(26.dp), color = Mint, strokeWidth = 2.dp)
    }
}

@Composable
private fun ScreenColumn(content: @Composable ColumnScope.() -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp, vertical = 18.dp),
        content = content,
    )
}

@Composable
private fun TopBar(title: String, onAction: () -> Unit, actionLabel: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Brand(admin = false)
        Spacer(Modifier.weight(1f))
        TextButton(onClick = onAction) { Text(actionLabel, color = Muted) }
    }
    Text(title, color = Muted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
}

@Composable
private fun Brand(admin: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(11.dp).background(Mint, CircleShape))
        Spacer(Modifier.width(9.dp))
        Text("MIDDLE SPACE", fontWeight = FontWeight.ExtraBold, letterSpacing = 1.2.sp)
        if (admin) {
            Spacer(Modifier.width(8.dp))
            Text("ADMIN", color = Blue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun Eyebrow(text: String, color: Color) {
    Text(text, color = color, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.4.sp)
}

@Composable
private fun StatusPill(text: String, color: Color) {
    Surface(color = color.copy(alpha = 0.12f), shape = RoundedCornerShape(50), border = BorderStroke(1.dp, color.copy(alpha = 0.4f))) {
        Text(text, Modifier.padding(horizontal = 11.dp, vertical = 6.dp), color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun Metric(label: String, value: String, modifier: Modifier) {
    Surface(modifier, color = Panel, shape = RoundedCornerShape(20.dp), border = BorderStroke(1.dp, Border)) {
        Column(Modifier.padding(17.dp)) {
            Eyebrow(label.uppercase(), Muted)
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 25.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun ActionCard(eyebrow: String, title: String, description: String, accent: Color, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        color = Panel,
        shape = RoundedCornerShape(23.dp),
        border = BorderStroke(1.dp, accent.copy(alpha = 0.34f)),
    ) {
        Row(Modifier.padding(19.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(46.dp).background(accent.copy(alpha = 0.15f), RoundedCornerShape(15.dp)), contentAlignment = Alignment.Center) {
                Box(Modifier.size(12.dp).background(accent, CircleShape))
            }
            Spacer(Modifier.width(15.dp))
            Column(Modifier.weight(1f)) {
                Eyebrow(eyebrow, accent)
                Spacer(Modifier.height(4.dp))
                Text(title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text(description, color = Muted, fontSize = 13.sp)
            }
            Text("›", color = accent, fontSize = 28.sp)
        }
    }
}

@Composable
private fun FormField(value: String, onValueChange: (String) -> Unit, label: String, minLines: Int = 1) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth().padding(bottom = 11.dp),
        label = { Text(label) },
        minLines = minLines,
        singleLine = minLines == 1,
        shape = RoundedCornerShape(16.dp),
    )
}

@Composable
private fun Feedback(error: String?, message: String?) {
    val text = error ?: message ?: return
    val color = if (error != null) MaterialTheme.colorScheme.error else Mint
    Surface(
        modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
        color = color.copy(alpha = 0.1f),
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, color.copy(alpha = 0.35f)),
    ) {
        Text(text, Modifier.padding(13.dp), color = color, fontSize = 13.sp)
    }
}

private fun createCameraUri(context: Context): Uri {
    val directory = File(context.cacheDir, "images").apply { mkdirs() }
    val file = File(directory, "marker-${System.currentTimeMillis()}.jpg")
    return FileProvider.getUriForFile(context, "${context.packageName}.files", file)
}

private fun android.content.ContentResolver.takePersistableUriPermissionSafely(uri: Uri) {
    runCatching { takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
}

private fun saveBitmap(context: Context, bitmap: Bitmap, fileName: String): Uri {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MiddleSpace")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }
        val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("저장 위치를 만들지 못했습니다.")
        context.contentResolver.openOutputStream(uri)?.use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            ?: throw IllegalStateException("QR 이미지를 저장하지 못했습니다.")
        values.clear()
        values.put(MediaStore.Images.Media.IS_PENDING, 0)
        context.contentResolver.update(uri, values, null, null)
        return uri
    }
    val directory = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: context.filesDir
    val file = File(directory, fileName)
    FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    return Uri.fromFile(file)
}

private fun shareBitmap(context: Context, bitmap: Bitmap, storeName: String) {
    val directory = File(context.cacheDir, "images").apply { mkdirs() }
    val file = File(directory, "middle-space-qr.png")
    FileOutputStream(file).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "image/png"
        putExtra(Intent.EXTRA_STREAM, uri)
        putExtra(Intent.EXTRA_TEXT, "$storeName Middle Space QR")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(intent, "QR 공유"))
}

private fun copyText(context: Context, value: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText("Middle Space 방문자 링크", value))
}

private fun compactDate(raw: String?): String {
    if (raw.isNullOrBlank()) return "없음"
    return runCatching {
        val source = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        val target = SimpleDateFormat("MM.dd HH:mm", Locale.KOREA)
        target.format(source.parse(raw) ?: Date())
    }.getOrDefault(raw.take(10))
}

private fun formatCentimeters(meters: Double): String = String.format(Locale.KOREA, "%.1fcm", meters * 100)
