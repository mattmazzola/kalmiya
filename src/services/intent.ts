export enum Intents {
    None,
    Analyze,
    ClearSnapshot,
    ClearMessages,
    ViewLastSnapshot,
    Query
}

export interface IEntity {
    name: string
    value: string
}

export interface IntentResult {
    intent: Intents
    entities: IEntity[]
}

export function intent (text: string): IntentResult {
    if ([/clear/i, /snapshot/i].every(r => r.test(text))) {
        return {
            intent: Intents.ClearSnapshot,
            entities: []
        }
    }
    else if ([/view/i, /last/i, /snapshot/i].every(r => r.test(text))) {
        return {
            intent: Intents.ViewLastSnapshot,
            entities: []
        }
    }
    else if ([/picture/i, /analyze/i, /photo/i, /snapshot/i].some(r => r.test(text))) {
        return {
            intent: Intents.Analyze,
            entities: []
        }
    }
    else if ([/what/i, /tell/i].some(r => r.test(text))) {
        return {
            intent: Intents.Query,
            entities: []
        }
    }

    return {
        intent: Intents.None,
        entities: []
    }
}