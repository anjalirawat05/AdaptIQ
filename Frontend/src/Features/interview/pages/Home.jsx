import React, { useEffect, useRef, useState } from 'react'
import './../style/Home.scss'
import { useInterview } from '../hooks/useInterview'
import { useNavigate } from 'react-router-dom'

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

const Home = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState('')
  const [selfDescription, setSelfDescription] = useState('')
  const [jobDescription, setJobDescription] = useState('')

  const { loading, generateReport, reports, getAllReports } = useInterview()

  useEffect(() => {
    getAllReports()
  }, [])

  const acceptFile = (file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only PDF or DOCX files are supported')
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError('File must be under 5MB')
      return
    }
    setFileError('')
    setResumeFile(file)
  }

  const handleFileChange = (e) => {
    acceptFile(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    acceptFile(e.dataTransfer.files?.[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleGenerateReport = async () => {
    if (!resumeFile || !selfDescription || !jobDescription) {
      setFileError('Please fill all fields and upload a valid resume')
      return
    }
    const data = await generateReport({ resumeFile, selfDescription, jobDescription })
    if (!data?._id) {
      setFileError('Failed to generate interview report. Please try again.')
      return
    }
    navigate(`/interview/${data._id}`)

  }

  if(loading){
    return (
      <main>
        <h1>loading your interview plan</h1>
      </main>
    )
  }

  return (
    <main className='home'>
      <div className="home-header">
        <h1>Prepare for your next interview</h1>
        <p>Paste the job description, upload your resume and tell us about yourself — we'll generate tailored interview questions.</p>
      </div>
      <div className="home-content">
        <div className='left card'>
          <label htmlFor="jobDescription">Job Description</label>
          <textarea
            onChange={(e) => setJobDescription(e.target.value)}
            name='jobDescription' id='jobDescription' placeholder='Paste the job description here...'></textarea>
        </div>
        <div className='right card'>
          <div className="input-group">
            <label htmlFor="resume">
              Upload Resume
              <span className="badge">Best results</span>
            </label>

            <div
              className={`dropzone ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="resume"
                name="resume"
                accept=".pdf,.docx"
                hidden
                onChange={handleFileChange}
              />
              <svg className="upload-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {resumeFile ? (
                <p className="dropzone-text">{resumeFile.name}</p>
              ) : (
                <>
                  <p className="dropzone-text">Click to upload or drag &amp; drop</p>
                  <p className="dropzone-hint">PDF or DOCX (Max 5MB)</p>
                </>
              )}
            </div>

            {fileError && <p className="field-error">{fileError}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="selfDescription">Self Description</label>
            <textarea 
            onChange={(e) => setSelfDescription(e.target.value)}
            id="selfDescription" name="selfDescription" placeholder="Tell us a bit about yourself...">
            </textarea>
          </div>
          <button className="generate-btn" onClick={handleGenerateReport} disabled={loading || !resumeFile || !selfDescription || !jobDescription}>
            Generate Interview Questions
          </button>
        </div>
      </div>

      <section className="reports-section">
        <h2>Your generated reports</h2>
        {reports && reports.length > 0 ? (
          <div className="reports-list">
            {reports.map((r) => (
              <div key={r._id} className="report-card" onClick={() => navigate(`/interview/${r._id}`)}>
                <span className="report-title">{r.title}</span>
                {typeof r.matchScore === 'number' && (
                  <span className="report-score">{r.matchScore}% match</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="reports-empty">You haven't generated any interview reports yet.</p>
        )}
      </section>

      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Interview AI. All rights reserved.</p>
      </footer>
    </main>
  )
}
export default Home