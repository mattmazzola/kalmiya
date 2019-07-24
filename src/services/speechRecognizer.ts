import * as SDK from 'microsoft-speech-browser-sdk'

export function setup(recognitionMode: SDK.RecognitionMode, language: string, format: SDK.SpeechResultFormat, subscriptionKey: string) {
    let recognizerConfig = new SDK.RecognizerConfig(
        new SDK.SpeechConfig(
            new SDK.Context(
                new SDK.OS(navigator.userAgent, "Browser", '1.0'),
                new SDK.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
        recognitionMode, // SDK.RecognitionMode.Interactive  (Options - Interactive/Conversation/Dictation)
        language, // Supported languages are specific to each recognition mode Refer to docs.
        format); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)
 
    // Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
    let authentication = new SDK.CognitiveSubscriptionKeyAuthentication(subscriptionKey);
 
    return SDK.CreateRecognizer(recognizerConfig, authentication)
}
 
export function start(
    recognizer: SDK.Recognizer,
    onEvent: (event: SDK.SpeechRecognitionEvent) => void,
    onComplete: () => void,
    onError: (error: Error) => void) {
    recognizer.Recognize((event) => onEvent(event))
    .On(() => {
        // The request succeeded. Nothing to do here.
    },
    (error: string) => {
        console.error(error)
        onError(new Error(error))
    });
}
 
export function stop(recognizer: SDK.Recognizer) {
    // recognizer.AudioSource.Detach(audioNodeId) can be also used here. (audioNodeId is part of ListeningStartedEvent)
    recognizer.AudioSource.TurnOff()
}