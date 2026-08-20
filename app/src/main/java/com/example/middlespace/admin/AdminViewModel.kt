package com.example.middlespace.admin

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class AdminUiState(
    val booting: Boolean = true,
    val authenticated: Boolean = false,
    val busy: Boolean = false,
    val stores: List<Store> = emptyList(),
    val store: Store? = null,
    val markers: List<StoreMarker> = emptyList(),
    val qrStats: QrStats? = null,
    val memories: List<OwnerMemory> = emptyList(),
    val verificationEmail: String? = null,
    val verificationComplete: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

class AdminViewModel(application: Application) : AndroidViewModel(application) {
    private val sessionStore = SessionStore(application)
    val api = AdminApi(application, sessionStore)
    private val mutableState = MutableStateFlow(AdminUiState())
    val state: StateFlow<AdminUiState> = mutableState.asStateFlow()

    init {
        if (sessionStore.load() == null) {
            mutableState.value = AdminUiState(booting = false)
        } else {
            mutableState.update { it.copy(authenticated = true) }
            reloadStore()
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            mutableState.update { it.copy(error = "이메일과 비밀번호를 입력해 주세요.") }
            return
        }
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    api.login(email.trim(), password)
                    loadStoreData()
                }
            }.onSuccess { data ->
                mutableState.value = AdminUiState(
                    booting = false,
                    authenticated = true,
                    stores = data.stores,
                    store = data.store,
                    markers = data.markers,
                    qrStats = data.qrStats,
                    memories = data.memories,
                )
            }.onFailure(::showFailure)
        }
    }

    fun register(
        email: String,
        nickname: String,
        phone: String,
        password: String,
        confirmPassword: String,
        agreedToTerms: Boolean,
        agreedToPrivacy: Boolean,
    ) {
        val normalizedEmail = email.trim()
        when {
            !EMAIL_PATTERN.matches(normalizedEmail) -> showValidationError("올바른 이메일을 입력해 주세요.")
            nickname.trim().length < 2 -> showValidationError("닉네임은 2자 이상이어야 합니다.")
            password.length < 8 -> showValidationError("비밀번호는 8자 이상이어야 합니다.")
            password != confirmPassword -> showValidationError("비밀번호가 일치하지 않습니다.")
            !agreedToTerms -> showValidationError("서비스 이용약관에 동의해야 합니다.")
            !agreedToPrivacy -> showValidationError("개인정보 처리방침에 동의해야 합니다.")
            else -> {
                mutableState.update { it.copy(busy = true, error = null, message = null) }
                viewModelScope.launch {
                    runCatching {
                        withContext(Dispatchers.IO) {
                            api.register(normalizedEmail, nickname.trim(), phone.trim(), password)
                        }
                    }.onSuccess {
                        mutableState.update {
                            it.copy(
                                busy = false,
                                verificationEmail = normalizedEmail,
                                verificationComplete = false,
                            )
                        }
                    }.onFailure(::showFailure)
                }
            }
        }
    }

    fun resendVerificationEmail() {
        val email = state.value.verificationEmail ?: return
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching { withContext(Dispatchers.IO) { api.resendVerificationEmail(email) } }
                .onSuccess {
                    mutableState.update { it.copy(busy = false, message = "인증 메일을 다시 발송했습니다.") }
                }
                .onFailure(::showFailure)
        }
    }

    fun verifyEmail(token: String) {
        if (token.isBlank()) {
            showValidationError("메일에 적힌 인증 토큰을 입력해 주세요.")
            return
        }
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching { withContext(Dispatchers.IO) { api.verifyEmail(token.trim()) } }
                .onSuccess {
                    mutableState.update {
                        it.copy(busy = false, verificationComplete = true, message = null)
                    }
                }
                .onFailure(::showFailure)
        }
    }

    fun resetRegistrationFlow() {
        mutableState.update {
            it.copy(
                verificationEmail = null,
                verificationComplete = false,
                error = null,
                message = null,
            )
        }
    }

    fun reloadStore() {
        mutableState.update { it.copy(booting = it.booting, busy = !it.booting, error = null) }
        viewModelScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    loadStoreData(state.value.store?.slug)
                }
            }.onSuccess { data ->
                mutableState.update {
                    it.copy(
                        booting = false,
                        authenticated = true,
                        busy = false,
                        stores = data.stores,
                        store = data.store,
                        markers = data.markers,
                        qrStats = data.qrStats,
                        memories = data.memories,
                    )
                }
            }.onFailure(::showFailure)
        }
    }

    fun createStore(name: String, location: String, businessNumber: String, description: String) {
        if (name.isBlank() || location.isBlank()) {
            mutableState.update { it.copy(error = "매장명과 주소는 필수입니다.") }
            return
        }
        perform("매장이 등록되고 QR이 발급되었습니다.") {
            val store = api.createStore(name.trim(), location.trim(), businessNumber.trim(), description.trim())
            loadStoreData(store.slug)
        }
    }

    fun selectStore(slug: String) {
        if (slug == state.value.store?.slug) return
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching { withContext(Dispatchers.IO) { loadStoreData(slug) } }
                .onSuccess(::applyStoreData)
                .onFailure(::showFailure)
        }
    }

    fun moderateMemory(memory: OwnerMemory, action: String) {
        val successMessage = when (action) {
            "approve" -> "게시글을 승인했습니다."
            "reject" -> "게시글을 반려했습니다."
            else -> "게시글을 숨겼습니다."
        }
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    api.updateMemoryStatus(memory.id, action)
                    loadStoreData(state.value.store?.slug)
                }
            }.onSuccess { data ->
                applyStoreData(data, successMessage)
            }.onFailure(::showFailure)
        }
    }

    fun uploadMarker(imageUri: Uri, physicalWidthMeters: Double) {
        val store = state.value.store ?: return
        if (physicalWidthMeters !in 0.03..5.0) {
            mutableState.update { it.copy(error = "실측 가로 길이는 3cm 이상 5m 이하여야 합니다.") }
            return
        }
        perform("새 진입점 이미지가 등록되고 활성화되었습니다.") {
            api.createMarker(store.slug, imageUri, physicalWidthMeters)
            loadStoreData(store.slug)
        }
    }

    fun activateMarker(marker: StoreMarker) {
        val store = state.value.store ?: return
        perform("진입점 이미지 v${marker.version}을 활성화했습니다.") {
            api.activateMarker(store.slug, marker.id)
            loadStoreData(store.slug)
        }
    }

    fun logout() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) { api.logout() }
            mutableState.value = AdminUiState(booting = false)
        }
    }

    fun dismissFeedback() = mutableState.update { it.copy(error = null, message = null) }

    private fun perform(successMessage: String, block: suspend () -> StoreData) {
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching { withContext(Dispatchers.IO) { block() } }
                .onSuccess { applyStoreData(it, successMessage) }
                .onFailure(::showFailure)
        }
    }

    private fun loadStoreData(preferredSlug: String? = null): StoreData {
        val stores = api.fetchStores()
        val store = stores.firstOrNull { it.slug == preferredSlug } ?: stores.firstOrNull()
        return StoreData(
            stores = stores,
            store = store,
            markers = store?.let { api.fetchMarkers(it.slug) }.orEmpty(),
            qrStats = store?.let { api.fetchQrStats(it.slug) },
            memories = store?.let { api.fetchMemories(it.slug) }.orEmpty(),
        )
    }

    private fun applyStoreData(data: StoreData, message: String? = null) {
        mutableState.update {
            it.copy(
                booting = false,
                authenticated = true,
                busy = false,
                stores = data.stores,
                store = data.store,
                markers = data.markers,
                qrStats = data.qrStats,
                memories = data.memories,
                message = message,
            )
        }
    }
    private fun showFailure(error: Throwable) {
        mutableState.update {
            it.copy(
                booting = false,
                busy = false,
                error = error.message ?: "요청을 처리하지 못했습니다.",
            )
        }
    }

    private fun showValidationError(message: String) {
        mutableState.update { it.copy(error = message, message = null) }
    }

    private companion object {
        val EMAIL_PATTERN = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    }

    private data class StoreData(
        val stores: List<Store>,
        val store: Store?,
        val markers: List<StoreMarker>,
        val qrStats: QrStats?,
        val memories: List<OwnerMemory>,
    )
}
