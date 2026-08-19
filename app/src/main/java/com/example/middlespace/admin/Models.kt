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
    val publicUrl: String,
    val qrRedirectUrl: String,
    val qrUrl: String,
    val qrScanCount: Int,
    val qrLastScannedAt: String?,
    val activeMarker: StoreMarker?,
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
