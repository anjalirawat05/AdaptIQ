import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './../style/LiveInterview.scss'
import { useInterview } from '../hooks/useInterview'

const MAX_QUESTIONS = 10

const LiveInterview = () => {
  const { interviewId } = useParams()
  const { startLiveInterview, submitLiveInterviewAnswer, advanceLiveInterview, endLiveInterview } = useInterview()

  const [interviewLoop, setInterviewLoop] = useState(null)
  const [lastScore, setLastScore] = useState(null)
  const [lastScoreError, setLastScoreError] = useState(null)
  const [perfError, setPerfError] = useState(null)
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setStarting(true)
    startLiveInterview(interviewId)
      .then((loop) => {
        if (!cancelled) setInterviewLoop(loop)
      })
      .catch(() => {
        if (!cancelled) setError('Could not start the interview. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setStarting(false)
      })
    return () => { cancelled = true }
  }, [interviewId])

  const handleSubmit = async () => {
    if (!draft.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { score, interviewLoop: nextLoop, scoreError, performanceReportError } = await submitLiveInterviewAnswer({
        interviewReportId: interviewId,
        answer: draft
      })
      setLastScore(score)
      setLastScoreError(scoreError)
      setPerfError(performanceReportError)
      setInterviewLoop(nextLoop)
      setDraft('')
    } catch (err) {
      setError(
        err.response?.data?.quotaExceeded
          ? 'The AI interviewer is temporarily busy (rate limit reached). Please wait a moment and try again.'
          : 'Could not submit your answer. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdvance = async (skipFollowUp) => {
    if (advancing) return
    setAdvancing(true)
    setError(null)
    try {
      const { interviewLoop: nextLoop, performanceReportError } = await advanceLiveInterview({ interviewReportId: interviewId, skipFollowUp })
      setInterviewLoop(nextLoop)
      setPerfError(performanceReportError)
      setLastScore(null)
      setLastScoreError(null)
    } catch {
      setError('Could not load the next question. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  const handleEnd = async () => {
    if (advancing) return
    setAdvancing(true)
    setError(null)
    try {
      const { interviewLoop: nextLoop, performanceReportError } = await endLiveInterview(interviewId)
      setInterviewLoop(nextLoop)
      setPerfError(performanceReportError)
    } catch {
      setError('Could not end the interview. Please try again.')
    } finally {
      setAdvancing(false)
    }
  }

  if (starting) {
    return <main className="live-interview">Starting interview...</main>
  }

  if (error && !interviewLoop) {
    return <main className="live-interview">{error}</main>
  }

  if (!interviewLoop) {
    return null
  }

  if (interviewLoop.status === 'completed') {
    const scores = interviewLoop.transcript.map((t) => t.score).filter((s) => s && s.correctness != null)
    const avg = (key) =>
      scores.length ? (scores.reduce((sum, s) => sum + s[key], 0) / scores.length).toFixed(1) : '—'
    const perf = interviewLoop.performanceReport
    const hasPerf = Boolean(perf && perf.verdict)

    return (
      <main className="live-interview">
        <div className="live-interview-inner">
          <h1>Interview Complete</h1>
          <p>You answered {interviewLoop.questionCount} question{interviewLoop.questionCount === 1 ? '' : 's'}.</p>
          <div className="summary-scores">
            <span>Avg Correctness: {avg('correctness')}/5</span>
            <span>Avg Depth: {avg('depth')}/5</span>
            <span>Avg Communication: {avg('communication')}/5</span>
          </div>

          {hasPerf ? (
            <div className="performance-report">
              <div className={`verdict-badge ${perf.verdict}`}>{perf.verdict.replace('_', ' ')}</div>
              <p className="perf-summary">{perf.summary}</p>

              <div className="perf-column">
                <h3>Strengths</h3>
                <ul>
                  {(perf.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              {(perf.weaknesses || []).length > 0 && (
                <div className="perf-column">
                  <h3>Weaknesses</h3>
                  <ul>
                    {perf.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="perf-unavailable">
              {perfError || "Detailed performance summary couldn't be generated for this interview."}
            </p>
          )}

          <Link className="back-link" to={`/interview/${interviewId}`}>Back to Report</Link>
        </div>
      </main>
    )
  }

  const { currentQuestion, pendingNext, questionCount } = interviewLoop

  return (
    <main className="live-interview">
      <div className="live-interview-inner">
        <div className="live-header">
          <span className="progress">Question {questionCount} of up to {MAX_QUESTIONS}</span>
          {currentQuestion && (
            <div className="badges">
              <span className={`type-badge ${currentQuestion.type}`}>{currentQuestion.type}</span>
              {currentQuestion.isFollowUp && <span className="followup-badge">Follow-up</span>}
            </div>
          )}
        </div>

        {lastScore && (
          <div className={`answer-score ${lastScore.needsReview ? 'needs-review' : ''}`}>
            <div className="score-dims">
              <span>Correctness: {lastScore.correctness}/5</span>
              <span>Depth: {lastScore.depth}/5</span>
              <span>Communication: {lastScore.communication}/5</span>
            </div>
            <p className="score-evidence"><strong>Evidence:</strong> "{lastScore.evidence}"</p>
            {lastScore.needsReview && <p className="review-flag">⚠ Low confidence — needs review</p>}
          </div>
        )}

        {!lastScore && lastScoreError && (
          <p className="error-note">{lastScoreError}</p>
        )}

        {error && <p className="error-note">{error}</p>}

        {currentQuestion ? (
          <div className="question-card">
            <h2>{currentQuestion.question}</h2>
            <textarea
              rows={6}
              placeholder="Type your answer..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={submitting}
            />
            <div className="action-row">
              <button type="button" className="primary-btn" onClick={handleSubmit} disabled={submitting || !draft.trim()}>
                {submitting ? 'Evaluating your answer...' : 'Submit Answer'}
              </button>
              <button type="button" className="end-btn" onClick={handleEnd} disabled={submitting || advancing}>
                End Interview
              </button>
            </div>
          </div>
        ) : (
          <div className="decision-card">
            <p className="decision-prompt">
              {pendingNext?.action === 'followUp'
                ? 'The interviewer wants to ask a follow-up on that topic.'
                : "You're ready to move to the next topic."}
            </p>
            <div className="action-row">
              {pendingNext?.action === 'followUp' ? (
                <>
                  <button type="button" className="primary-btn" onClick={() => handleAdvance(false)} disabled={advancing}>
                    {advancing ? 'Loading...' : 'Answer Follow-up'}
                  </button>
                  <button type="button" className="secondary-btn" onClick={() => handleAdvance(true)} disabled={advancing}>
                    Skip to Next Question
                  </button>
                </>
              ) : (
                <button type="button" className="primary-btn" onClick={() => handleAdvance(false)} disabled={advancing}>
                  {advancing ? 'Loading...' : 'Next Question'}
                </button>
              )}
              <button type="button" className="end-btn" onClick={handleEnd} disabled={advancing}>
                End Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default LiveInterview
