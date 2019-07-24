

const baseUri = "https://api.cognitive.microsoft.com/bing/v7.0/images/search"
const subscriptionKey = process.env.REACT_APP_VISUAL_SEARCH_SUBSCRIPTION_KEY!

export async function query (query: string): Promise<any> {
    const response = await fetch(`${baseUri}?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
            "Ocp-Apim-Subscription-Key": subscriptionKey
        }
    })

    const json = await response.json()
    if (!response.ok) {
        throw new Error(json)
    }

    return json
}