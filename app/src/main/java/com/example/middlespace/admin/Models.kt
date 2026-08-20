package com.example.middlespace.admin

data class Store(
    val id: String,
    val slug: String,
    val name: String,
    val location: String,
    val description: String,
    val businessNumber: String,
    val isActive: Boolean,
    val requireApproval: Boolean,
    val representativeImageUrl: String,
    val publicUrl: String,
    val qrRedirectUrl: String,
    val qrUrl: String,
    val qrScanCount: Int,
    val qrLastScannedAt: String?,
    val pendingCount: Int,
    val activeMarker: StoreMarker?,
)

data class QrScanDay(
    val date: String,
    val count: Int,
)

data class QrStats(
    val totalCount: Int,
    val lastScannedAt: String?,
    val periodCount: Int,
    val daily: List<QrScanDay>,
)

data class OwnerMemory(
    val id: String,
    val storeName: String,
    val authorNickname: String,
    val content: String,
    val status: String,
    val reportCount: Int,
    val createdAt: String,
)

data class StoreMarker(
    val id: String,
    val version: Int,
    val imageUrl: String,
    val imageSha256: String,
    val physicalWidthMeters: Double,
    val coordinateFrame: String,
    val isActive: Boolean,
    val createdAt: String,
)

data class AdminSession(
    val accessToken: String,
    val refreshCookie: String?,
)
