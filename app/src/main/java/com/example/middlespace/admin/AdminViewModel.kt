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
    val store: Store? = null,
    val markers: List<StoreMarker> = emptyList(),
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
                    val store = api.fetchStore()
                    store to store?.let { api.fetchMarkers(it.slug) }.orEmpty()
                }
            }.onSuccess { (store, markers) ->
                mutableState.value = AdminUiState(
                    booting = false,
                    authenticated = true,
                    store = store,
                    markers = markers,
                )
            }.onFailure(::showFailure)
        }
    }

    fun reloadStore() {
        mutableState.update { it.copy(booting = it.booting, busy = !it.booting, error = null) }
        viewModelScope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    val store = api.fetchStore()
                    store to store?.let { api.fetchMarkers(it.slug) }.orEmpty()
                }
            }.onSuccess { (store, markers) ->
                mutableState.update {
                    it.copy(
                        booting = false,
                        authenticated = true,
                        busy = false,
                        store = store,
                        markers = markers,
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
            store to api.fetchMarkers(store.slug)
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
            api.fetchStore()!! to api.fetchMarkers(store.slug)
        }
    }

    fun activateMarker(marker: StoreMarker) {
        val store = state.value.store ?: return
        perform("진입점 이미지 v${marker.version}을 활성화했습니다.") {
            api.activateMarker(store.slug, marker.id)
            api.fetchStore()!! to api.fetchMarkers(store.slug)
        }
    }

    fun logout() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) { api.logout() }
            mutableState.value = AdminUiState(booting = false)
        }
    }

    fun dismissFeedback() = mutableState.update { it.copy(error = null, message = null) }

    private fun perform(successMessage: String, block: suspend () -> Pair<Store, List<StoreMarker>>) {
        mutableState.update { it.copy(busy = true, error = null, message = null) }
        viewModelScope.launch {
            runCatching { withContext(Dispatchers.IO) { block() } }
                .onSuccess { (store, markers) ->
                    mutableState.update {
                        it.copy(busy = false, store = store, markers = markers, message = successMessage)
                    }
                }
                .onFailure(::showFailure)
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
}
