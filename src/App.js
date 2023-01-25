import { useEffect, useRef, useState } from 'react'
import './App.css'
import '@tensorflow/tfjs'

const mobilenetModule = require('@tensorflow-models/mobilenet')
const knnClassifier = require('@tensorflow-models/knn-classifier')

const NOT_TOUCH = 'not_touch'
const TOUCHED = 'touched'
const TRAINING_TIME = 100
const CONFIDENCE = 0.8

function App() {
  const video = useRef()
  const classifier = useRef()
  const mobilenet = useRef()

  const [isTraining, setIsTraining] = useState()
  const [trainingState, setTrainingState] = useState(0)
  const [showMessage, setShowMessage] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showTrani1, setShowTrain1] = useState(true)
  const [showTrani2, setShowTrain2] = useState(false)
  const [showRun, setShowRun] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [finalResult, setFinalResult] = useState()

  const init = async () => {
    await setupCamera()

    classifier.current = knnClassifier.create()

    mobilenet.current = await mobilenetModule.load()

    setShowMessage(true)
    setShowButton(true)
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia

      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          { video: true },
          (stream) => {
            video.current.srcObject = stream
            video.current.addEventListener('loadeddata', resolve)
          },
          (error) => reject(error)
        )
      } else {
        reject()
      }
    })
  }

  const train = async (label) => {
    setIsTraining(true)
    for (let i = 0; i < TRAINING_TIME; ++i) {
      setTrainingState(i + 1)
      await training(label)
    }

    if (label === NOT_TOUCH) {
      setShowTrain1(false)
      setShowTrain2(true)
    } else if (label === TOUCHED) {
      setShowTrain2(false)
      setShowRun(true)
    }

    setIsTraining(false)
  }

  const training = (label) => {
    return new Promise(async (resolve) => {
      const embedding = mobilenet.current.infer(video.current, true)

      classifier.current.addExample(embedding, label)
      await sleep(100)
      resolve()
    })
  }

  const run = async () => {
    setShowRun(false)
    setShowResult(true)
    const embedding = mobilenet.current.infer(video.current, true)

    const result = await classifier.current.predictClass(embedding)

    if (
      result.label === TOUCHED &&
      result.confidences[result.label] > CONFIDENCE
    ) {
      setFinalResult(true)
    } else {
      setFinalResult(false)
    }
    await sleep(100)
    run()
  }

  const sleep = (ms = 0) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  useEffect(() => {
    init()

    //  Cleanup function
    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app">
      <video className="video" ref={video} autoPlay />

      {showButton && (
        <div className="control">
          <button
            className="btn"
            disabled={!showTrani1}
            onClick={() => train(NOT_TOUCH)}
          >
            Train 'Không chạm lên mặt'
          </button>
          <button
            className="btn"
            disabled={!showTrani2}
            onClick={() => train(TOUCHED)}
          >
            Train 'Chạm lên mặt'
          </button>
          <button className="btn" disabled={!showRun} onClick={() => run()}>
            Run
          </button>
        </div>
      )}

      {showMessage && (
        <div className="message">
          {showTrani1 && <h2>Bấm train 'Không chạm lên mặt'</h2>}
          {showTrani2 && (
            <h2>Bấm train 'Chạm lên mặt' (Chạm lên mặt trước khi bấm)</h2>
          )}
          {showRun && <h2>Bấm 'Run'</h2>}
          {isTraining && (
            <h2>
              TRAINING: {parseInt((trainingState / TRAINING_TIME) * 100)}%
            </h2>
          )}
          {showResult && (
            <h2>
              {finalResult
                ? 'Bạn đang chạm tay lên mặt'
                : 'Bạn đang không chạm tay lên mặt'}
            </h2>
          )}
        </div>
      )}
    </div>
  )
}

export default App
