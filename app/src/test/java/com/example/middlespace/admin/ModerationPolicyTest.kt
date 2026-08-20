package com.example.middlespace.admin

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ModerationPolicyTest {
    @Test
    fun pendingCanBeApprovedOrRejectedButNotHidden() {
        val policy = moderationPolicy("PENDING")

        assertTrue(policy.canApprove)
        assertTrue(policy.canReject)
        assertFalse(policy.canHide)
    }

    @Test
    fun approvedCanOnlyBeHidden() {
        val policy = moderationPolicy("approved")

        assertFalse(policy.canApprove)
        assertFalse(policy.canReject)
        assertTrue(policy.canHide)
    }
}
