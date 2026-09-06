function isQuotaOrRateLimitError (err) {
    return err?.status === 429 || /RESOURCE_EXHAUSTED|rate.?limit/i.test(err?.message || "")
}

module.exports = { isQuotaOrRateLimitError }
