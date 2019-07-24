

const baseUri = "https://api.cognitive.microsoft.com/bing/v7.0/images/visualsearch"
const subscriptionKey = process.env.REACT_APP_VISUAL_SEARCH_SUBSCRIPTION_KEY!

export interface IImage {
    thumbnailUrl: string
}

export interface ICoordinate {
    x: number
    y: number
}

export interface IRectangle {
    topLeft: ICoordinate
    topRight: ICoordinate
    bottomRight: ICoordinate
    bottomLeft: ICoordinate
}

export interface IBoundingBox {
    queryRectanble: IRectangle
    displayRectangle: IRectangle
}

export interface ITag {
    image: IImage
    displayName: string
    boundingBox: IBoundingBox
    actions: any
}

export interface IResult {
    tags: ITag[]
}

export async function query (imageData: FormData): Promise<IResult> {
    const response = await fetch(baseUri, {
        method: "POST",
        body: imageData,
        headers: {
            "Content-Type": "multipart/form-data",
            "Ocp-Apim-Subscription-Key": subscriptionKey
        }
    })

    const json = await response.json()
    if (!response.ok) {
        throw new Error(json)
    }

    return json
}