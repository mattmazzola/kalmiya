const subscriptionKey = process.env.REACT_APP_COMPUTER_VISION_SUBSCRIPTION_KEY!
const uriBase = "https://westus2.api.cognitive.microsoft.com/vision/v2.0/"

export interface IAnalyzeLandmark {
    name: string
    confidence: number
}
export interface IAnalyzeDetail {
    landmarks: IAnalyzeLandmark[]
}

export interface IAnalyzeCategory {
    name: string
    score: number
    detail: IAnalyzeDetail
}

export interface IAnalyzeCaption {
    text: string
    confidence: number
}

export interface IAnalyzeColor {
    dominantColorForeground: string
    dominantColorBackground: string
    dominantColors: string[]
    accentColor: string
    isBwImg: boolean
}

export interface IAnalyzeMetadata {
    height: number
    width: number
    format: string
}
export interface IAnalyzeDescription {
    tags: string[]
    captions: IAnalyzeCaption[]
}

export interface IAnalyzeFaceRectangle {
    left: number
    top: number
    width: number
    right: number
}

export interface IAnalyzeFaces {
    age: number
    gender: string
    faceRectangle: IAnalyzeFaceRectangle
}
export interface IAnalyzeResult {
    categories: IAnalyzeCategory
    color: IAnalyzeColor
    description: IAnalyzeDescription
    faces: IAnalyzeFaces
    requestId: string
    metadata: IAnalyzeMetadata
}

export async function analyze(blob: Blob): Promise<IAnalyzeResult> {
    const params = {
        "visualFeatures": "Categories,Description,Color,Faces",
        "details": "Celebrities",
        "language": "en",
    }
    
    const serializedParams = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')

    const response = await fetch(`${uriBase}/analyze?${serializedParams}`, {
        method: "POST",
        body: blob,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key' : subscriptionKey
        }
    })

    const json = await response.json()
    if (!response.ok) {
        throw new Error(json)
    }

    return json
}

export interface IOcrWord {
    boundingBox: string,
    text: string
}

export interface IOcrLine {
    boundingBox: string,
    words: IOcrWord[]
}

export interface IOcrRegion {
    boundingBox: string,
    lines: IOcrLine[]
}

export interface IOcr {
    language: string
    orientation: string
    textAngle: number,
    regions: IOcrRegion[]
}

export async function ocr(blob: Blob): Promise<IOcr> {
    const params = {
        'language': 'en'
    }
    const serializedParams = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')

    const response = await fetch(`${uriBase}/ocr?${serializedParams}`, {
        method: "POST",
        body: blob,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key' : subscriptionKey
        }
    })

    const json = await response.json()
    if (!response.ok) {
        throw new Error(json)
    }

    return json
}

export async function all(blob: Blob) {
    const [r1, r2] = await Promise.all([analyze(blob), ocr(blob)])

    return {
        analyze: r1,
        ocr: r2
    }
}
