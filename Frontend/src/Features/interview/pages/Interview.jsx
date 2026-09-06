import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import './../style/Interview.scss'
import {useInterview} from '../hooks/useInterview'



const Interview = () => {
  const {interviewId} = useParams()
  const {report, loading, getReportById, generateResumePDF, submitAnswer} = useInterview()
  const [activeTab, setActiveTab] = useState('technical')
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const handleAnswerChange = (questionId, value) => {
    setDrafts((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmitAnswer = async (questionType, question) => {
    const answer = drafts[question._id]
    if (!answer || !answer.trim()) return
    setSavingId(question._id)
    try {
      await submitAnswer({ questionType, questionId: question._id, answer })
    } finally {
      setSavingId(null)
    }
  }

  const handleDownloadResumePDF = async () => {
    setDownloadingPdf(true)
    try {
      await generateResumePDF(report._id)
    } finally {
      setDownloadingPdf(false)
    }
  }

  useEffect(() => {
    if (interviewId && report?._id !== interviewId) {
      getReportById(interviewId)
    }
  }, [interviewId])

  if (loading || !report) {
    return <main className="interview-report">Loading...</main>
  }

  return (
    <main className="interview-report">
     <div className="report-inner">
      <div className="report-header">
        <div>
          <h1>Your Interview Prep Report</h1>
          <p>Based on your resume, self description and the target job description.</p>
        </div>

        <div className="score-badge">
          <svg viewBox="0 0 36 36" className="score-ring">
            <path
              className="score-ring-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="score-ring-fill"
              strokeDasharray={`${report.matchScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="score-value">
            <span>{report.matchScore}%</span>
            <small>Match</small>
          </div>
        </div>

        <button
          type="button"
          className="download-resume-btn"
          onClick={handleDownloadResumePDF}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? 'Generating PDF...' : 'Download Tailored Resume (PDF)'}
        </button>

        <Link className="start-live-btn" to={`/interview/${report._id}/live`}>
          Start Live Interview
        </Link>
      </div>

      <div className="report-tabs">
        <button className={activeTab === 'technical' ? 'active' : ''} onClick={() => setActiveTab('technical')}>
          Technical Questions
        </button>
        <button className={activeTab === 'behavioral' ? 'active' : ''} onClick={() => setActiveTab('behavioral')}>
          Behavioral Questions
        </button>
        <button className={activeTab === 'skillGaps' ? 'active' : ''} onClick={() => setActiveTab('skillGaps')}>
          Skill Gaps
        </button>
        <button className={activeTab === 'plan' ? 'active' : ''} onClick={() => setActiveTab('plan')}>
          Preparation Plan
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'technical' && (
          <div className="question-list">
            {report.technicalQuestions.map((q, i) => (
              <details className="question-card" key={q._id} open={i === 0}>
                <summary>{q.question}</summary>
                <p className="intention"><strong>Why it's asked:</strong> {q.intention}</p>
                <p className="answer"><strong>How to answer:</strong> {q.answer}</p>
                <div className="candidate-answer">
                  <label htmlFor={`answer-${q._id}`}><strong>Your answer:</strong></label>
                  <textarea
                    id={`answer-${q._id}`}
                    rows={4}
                    value={drafts[q._id] ?? q.candidateAnswer ?? ''}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer('technical', q)}
                    disabled={savingId === q._id}
                  >
                    {savingId === q._id ? 'Saving...' : 'Submit Answer'}
                  </button>
                  {q.candidateAnswer && <p className="saved-note">Saved answer on file.</p>}
                  {q.score && (
                    <div className={`answer-score ${q.score.needsReview ? 'needs-review' : ''}`}>
                      <div className="score-dims">
                        <span>Correctness: {q.score.correctness}/5</span>
                        <span>Depth: {q.score.depth}/5</span>
                        <span>Communication: {q.score.communication}/5</span>
                      </div>
                      <p className="score-evidence">
                        <strong>Evidence:</strong> "{q.score.evidence}"
                      </p>
                      {q.score.needsReview && (
                        <p className="review-flag">⚠ Low confidence — needs review</p>
                      )}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {activeTab === 'behavioral' && (
          <div className="question-list">
            {report.behavioralQuestions.map((q, i) => (
              <details className="question-card" key={q._id} open={i === 0}>
                <summary>{q.question}</summary>
                <p className="intention"><strong>Why it's asked:</strong> {q.intention}</p>
                <p className="answer"><strong>How to answer:</strong> {q.answer}</p>
                <div className="candidate-answer">
                  <label htmlFor={`answer-${q._id}`}><strong>Your answer:</strong></label>
                  <textarea
                    id={`answer-${q._id}`}
                    rows={4}
                    value={drafts[q._id] ?? q.candidateAnswer ?? ''}
                    onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer('behavioral', q)}
                    disabled={savingId === q._id}
                  >
                    {savingId === q._id ? 'Saving...' : 'Submit Answer'}
                  </button>
                  {q.candidateAnswer && <p className="saved-note">Saved answer on file.</p>}
                  {q.score && (
                    <div className={`answer-score ${q.score.needsReview ? 'needs-review' : ''}`}>
                      <div className="score-dims">
                        <span>Correctness: {q.score.correctness}/5</span>
                        <span>Depth: {q.score.depth}/5</span>
                        <span>Communication: {q.score.communication}/5</span>
                      </div>
                      <p className="score-evidence">
                        <strong>Evidence:</strong> "{q.score.evidence}"
                      </p>
                      {q.score.needsReview && (
                        <p className="review-flag">⚠ Low confidence — needs review</p>
                      )}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {activeTab === 'skillGaps' && (
          <div className="skill-gap-list">
            {report.skillGaps.map((gap, i) => (
              <div className="skill-gap-card" key={i}>
                <span>{gap.skill}</span>
                <span className={`importance-badge ${gap.importance}`}>{gap.importance}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="prep-timeline">
            {report.preparationPlan.map((day) => (
              <div className="prep-day" key={day.day}>
                <div className="prep-day-marker">Day {day.day}</div>
                <div className="prep-day-body">
                  <h3>{day.focus}</h3>
                  <ul>
                    {day.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
     </div>
    </main>
  )
}

export default Interview
