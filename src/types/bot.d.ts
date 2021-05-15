declare namespace BotAPI {
    interface Language {
        key: string,
        label: string
    }

    interface Languages {
        [key: string]: Language
    }
}

export default BotAPI
