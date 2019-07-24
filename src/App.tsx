import * as React from 'react'
import * as SDK from 'microsoft-speech-browser-sdk'
import * as SpeechService from './services/speechRecognizer'
import * as vision from './services/vision'
import * as personalityChat from './services/personalityChat'
import { intent, Intents } from './services/intent'
import * as visualSearch from './services/visualSearch'
import * as services from './services'
import * as util from './utilities'
import * as uuid from 'uuid/v4'
import './App.css'

enum UserType {
  User,
  Bot
}

interface ISnapshot {
  id: string
  dataUri: string
  analyzeResult: vision.IAnalyzeResult
  ocrResult: vision.IOcr
}

interface IMessage {
  id: string
  text: string
  userType: UserType
  data: { [x: string]: string }
}

interface State {
  isViewingSnapshot: boolean
  isMicrophoneActive: boolean
  hypothesis: string
  messages: IMessage[]
  snapshots: ISnapshot[]
}

class App extends React.Component<{}, State> {
  videoRef = React.createRef<HTMLVideoElement>()
  canvasRef = React.createRef<HTMLCanvasElement>()

  recognizer: SDK.Recognizer = SpeechService.setup(SDK.RecognitionMode.Interactive, "en-US", SDK.SpeechResultFormat.Simple, process.env.REACT_APP_SPEECH_API_SUBSCRIPTION_KEY!)
  state: State = {
    isViewingSnapshot: false,
    isMicrophoneActive: false,
    hypothesis: '',
    messages: [],
    snapshots: []
  }

  // TODO: Simulate webcam input from video being drawn to canvas
  async componentDidMount() {
    const canvasElement = this.canvasRef.current!
    canvasElement.width = window.innerWidth
    canvasElement.height = window.innerHeight

    const videoElement = this.videoRef.current!
    videoElement.addEventListener(`canplay`, (event) => {
      console.log(`Video.canPlay event`)
      console.log(`width: ${videoElement.videoWidth}`)
      console.log(`height: ${videoElement.videoHeight}`)
      // canvasElement.width = videoElement.videoWidth
      // canvasElement.height = videoElement.videoHeight
    })

    const constraints = {
      video: true
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    videoElement.srcObject = stream
  }

  onClickTalk = () => {
    SpeechService.start(this.recognizer, this.onEvent, this.onComplete, this.onError)
  }

  onClickPhoto = () => {
    this.onAnalyze('')
  }

  onComplete = () => {
    this.setState({
      isMicrophoneActive: false,
      hypothesis: ''
    })
  }

  onError = (error: Error) => {
    console.error(error)
    this.setState({
      isMicrophoneActive: false
    })
  }

  onEvent = (event: SDK.SpeechRecognitionEvent) => {
    if (event instanceof SDK.RecognitionTriggeredEvent) {
      console.debug(`RecognitionTriggeredEvent: `)
      console.debug(JSON.stringify(event, null, 2))
    }
    else if (event instanceof SDK.ListeningStartedEvent) {
      console.debug(`ListeningStartedEvent: `)
      console.debug(JSON.stringify(event, null, 2))
      this.setState({
        isMicrophoneActive: true
      })
    }
    else if (event instanceof SDK.RecognitionStartedEvent) {
      console.debug(`RecognitionStartedEvent: `)
      console.debug(JSON.stringify(event, null, 2))
    }
    else if (event instanceof SDK.SpeechStartDetectedEvent) {
      console.debug(`SpeechStartDetectedEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))
    }
    else if (event instanceof SDK.SpeechHypothesisEvent) {
      console.debug(`SpeechHypothesisEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))
      this.setState({
        hypothesis: event.Result.Text
      })
    }
    else if (event instanceof SDK.SpeechFragmentEvent) {
      // Doesn't occur?
      console.debug(`SpeechFragmentEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))
    }
    else if (event instanceof SDK.SpeechEndDetectedEvent) {
      console.debug(`SpeechEndDetectedEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))
    }
    else if (event instanceof SDK.SpeechSimplePhraseEvent) {
      console.debug(`SpeechSimplePhraseEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))

      if (event.Result.RecognitionStatus.toString() === SDK.RecognitionStatus[SDK.RecognitionStatus.InitialSilenceTimeout]) {
        this.addMessage(`Sorry, I didn't hear you. Please try again.`, UserType.Bot)
        return
      }

      const text = event.Result.DisplayText
      this.onUserInput(text)
    }
    else if (event instanceof SDK.SpeechDetailedPhraseEvent) {
      console.debug(`SpeechDetailedPhraseEvent: `)
      console.debug(JSON.stringify(event.Result, null, 2))
    }
    else if (event instanceof SDK.RecognitionEndedEvent) {
      console.debug(`RecognitionEndedEvent: `)
      this.onComplete()
    }
  }

  onUserInput = async (text: string) => {
    this.addMessage(text, UserType.User)

    const pcResponse = await personalityChat.query(text, personalityChat.Persona.Friendly)
    console.log(JSON.stringify(pcResponse, null, 2))

    if (pcResponse.ScenarioList.length > 0) {
      const firstScenario = pcResponse.ScenarioList[0]
      const response = util.chooseRandom(firstScenario.Responses)
      this.addMessage(response, UserType.Bot)
    }

    const userIntent = intent(text).intent
    if (userIntent === Intents.Analyze) {
      this.onAnalyze(text)
    }
    else if (userIntent === Intents.ClearSnapshot) {
      this.clearCanvas()
    }
    else if (userIntent === Intents.ViewLastSnapshot) {
      this.viewLastSnapshot()
    }
  }

  clearCanvas = () => {
    const canvasElement = this.canvasRef.current!
    const context = canvasElement.getContext('2d')!
    context.clearRect(0, 0, canvasElement.width, canvasElement.height)
    this.setState({
      isViewingSnapshot: false
    })
  }

  viewLastSnapshot = () => {
    if (this.state.snapshots.length === 0) {
      this.addMessage(`There are no snapshots to view. Please take a snapshot by saying "Analyze" or "Take a photo".`, UserType.Bot)
      return
    }

    const lastSnapshot = this.state.snapshots[this.state.snapshots.length - 1]
    this.addMessage(`Viewing last snapshot.`, UserType.Bot)
    this.setSnapshot(lastSnapshot)
  }

  onAnalyze = async (text: string) => {
    console.log(`Analyze`)
    this.addMessage(`Analyzing...`, UserType.Bot)

    const videoElement = this.videoRef.current!
    const canvasElement = this.canvasRef.current!

    const context = canvasElement.getContext('2d')!
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)

    const blob = await util.canvasToBlob(canvasElement)
    const { analyze, ocr } = await vision.all(blob)

    try {
      const result = await services.imageSearch.query(text)
      console.log(`ImageSearch: `, JSON.stringify(result, null, 2))
    }
    catch (e) {
      console.error(`Error occurred while attempting to submit image search for: ${text}`)
    }

    const formData = new FormData()
    formData.append("image", blob)
    try {
      const result = await visualSearch.query(formData)
      console.log(`OCR: `, JSON.stringify(result, null, 2))
    }
    catch (e) {
      console.error(`Error when attempting to perform visual search: `, e)
    }

    console.log(`Analyze: `, JSON.stringify(analyze, null, 2))
    console.log(`OCR: `, JSON.stringify(ocr, null, 2))

    const snapshot: ISnapshot = {
      id: uuid(),
      dataUri: canvasElement.toDataURL(),
      analyzeResult: analyze,
      ocrResult: ocr
    }

    this.setState(prevState => ({
      snapshots: [...prevState.snapshots, snapshot]
    }))

    setTimeout(() => {
      this.clearCanvas()
    }, 1000)

    if (analyze.description.captions.length > 0) {
      const caption = analyze.description.captions[0]
      this.addMessage(`I see: ${caption.text}`, UserType.Bot)
    }
    else {
      this.addMessage(`Hmmm, I'm not sure what this image is.`, UserType.Bot)
    }

    ocr.regions.map(region => {
      const [x1, y1, width, height] = region.boundingBox.split(',').map(s => parseInt(s, 10))
      context.rect(x1, y1, width, height)
      context.lineWidth = 4
      context.strokeStyle = "#FFFFFF"
      context.stroke()
    })
  }

  addMessage = (text: string, userType: UserType) => {
    this.setState(prevState => {
      const newMessage = {
        id: uuid(),
        text,
        userType,
        data: {}
      }
      const nextMessages = [...prevState.messages]
      nextMessages.push(newMessage)

      if (nextMessages.length > 10) {
        nextMessages.shift()
      }

      return {
        messages: nextMessages
      }
    }, () => {
      if (userType === UserType.Bot) {
        const utterance = new SpeechSynthesisUtterance(text)
        self.speechSynthesis.speak(utterance)
      }
    })
  }

  onDebugAddMessage = () => {
    this.addMessage(`test-${uuid().slice(0, 4)}`, UserType.User)
  }

  onClickClearMessages = () => {
    this.setState({
      messages: []
    })
  }

  onClickSnapshot = (s: ISnapshot) => {
    this.setSnapshot(s)
  }

  onClickClearSnapshot = () => {
    this.clearCanvas()
  }

  private setSnapshot = async (s: ISnapshot) => {
    const canvas = this.canvasRef.current!
    await util.drawToCanvas(canvas, s.dataUri)
    this.setState({
      isViewingSnapshot: true
    })
  }

  render() {
    return (
      <div className="kl-app">
        <video autoPlay className="kl-video" ref={this.videoRef}></video>
        <canvas className="kl-canvas" ref={this.canvasRef}></canvas>

        <div className="kl-talk">
          <button className={`kl-button-talk ${this.state.isMicrophoneActive ? 'kl-button-talk--active' : ''}`} onClick={this.onClickTalk}>
            <i className="material-icons">mic</i>
          </button>
          <div className="kl-talk_description">
            {this.state.isMicrophoneActive
              ? "Recording..."
              : "Push To Talk"}
          </div>
        </div>

        <div className="kl-photo">
          <button className={`kl-button-photo ${this.state.isMicrophoneActive ? 'kl-button-photo--active' : ''}`} onClick={this.onClickPhoto}>
            <i className="material-icons">photo_camera</i>
          </button>
          <div className="kl-photo_description">Take Picture</div>
        </div>

        <div className={`kl-snapshots-panel ${this.state.snapshots.length > 0 ? 'kl-snapshots-panel--active' : ''}`}>
          <div className="kl-snapshots">
            {this.state.snapshots.map(s =>
              <button key={s.id} className="kl-snapshot" onClick={() => this.onClickSnapshot(s)}>
                <img src={s.dataUri} />
              </button>
            )}
          </div>
        </div>

        <div className="kl-clear-canvas-button" onClick={this.onClickClearSnapshot}>
          <i className="material-icons">photo</i>
          <span>Clear</span>
          <i className="material-icons">clear</i>
        </div>

        <div className="kl-chat">
          {this.state.messages.map(message =>
            message.userType === UserType.User
              ? <div className="kl-chat_user" key={message.id}>
                <div className="kl-chat_text kl-chat_text--user">
                  {message.text}
                </div>
              </div>
              : <div className="kl-chat_bot" key={message.id}>
                <div className="kl-chat_text kl-chat_text--bot">
                  {message.text}
                </div>
              </div>
          )}
          {this.state.hypothesis.length > 0
            && <div className="kl-chat_user">
              <div className="kl-chat_text kl-chat_text--user">
                {this.state.hypothesis}
              </div>
            </div>}

          <div>
            <div className="kl-clear-messages-button" onClick={this.onClickClearMessages}>
              <i className="material-icons">message</i>
              <span>Clear</span>
              <i className="material-icons">clear</i>
            </div>
          </div>
        </div>

        <div className="kl-debug">
          <div>Debug:</div>
          <button className="kl-button" onClick={this.onDebugAddMessage}>Add Message</button>
        </div>
      </div>
    );
  }
}

export default App
