package com.example.middlespace.admin

data class ModerationPolicy(
    val label: String,
    val canApprove: Boolean = false,
    val canReject: Boolean = false,
    val canHide: Boolean = false,
)

fun moderationPolicy(status: String): ModerationPolicy = when (status.uppercase()) {
    "PENDING" -> ModerationPolicy("승인 대기", canApprove = true, canReject = true)
    "APPROVED" -> ModerationPolicy("게시 중", canHide = true)
    "REJECTED" -> ModerationPolicy("반려")
    "HIDDEN" -> ModerationPolicy("숨김")
    else -> ModerationPolicy(status)
}
