export enum Persona {
    Friendly,
    Professional,
    Humorous
}

export interface PcScenario {
    ScenarioName: string
    Score: number
    Responses: string[]
}

export interface PcResult {
    ScenarioList: PcScenario[],
    IsChatQuery: boolean,
    IsAdult: boolean,
    ElapsedMilliseconds: number
}

export async function query (query: string, persona: Persona): Promise<PcResult> {
    const response = await fetch("https://smarttalk.azure-api.net/api/v1/botframework", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query,
            persona
        })
    })

    const json = await response.json()
    if (!response.ok) {
        throw new Error(json)
    }

    return json
}