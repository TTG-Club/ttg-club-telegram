export enum EClass {
    Artificer = 'Artificer',
    Bard = 'Bard',
    Cleric = 'Cleric',
    Druid = 'Druid',
    Paladin = 'Paladin',
    Ranger = 'Ranger',
    Sorcerer = 'Sorcerer',
    Warlock = 'Warlock',
    Wizard = 'Wizard',
}

export enum ESource {
    ADLA = 'ADLA',
    AI = 'AI',
    AMCM = 'AMCM',
    ATH = 'ATH',
    AW = 'AW',
    CC = 'CC',
    CM = 'CM',
    COS = 'COS',
    DC = 'DC',
    DiA = 'DiA',
    DMG = 'DMG',
    DMGi = 'DMGi',
    EB = 'EB',
    EDMG = 'EDMG',
    EEW = 'EEW',
    EGtW = 'EGtW',
    EMM = 'EMM',
    EPHB = 'EPHB',
    ERLW = 'ERLW',
    ESCAG = 'ESCAG',
    EV = 'EV',
    EVGM = 'EVGM',
    EXGE = 'EXGE',
    FTD = 'FTD',
    GGR = 'GGR',
    GOS = 'GOS',
    HH = 'HH',
    HotDQ = 'HotDQ',
    IDRotF = 'IDRotF',
    LMoP = 'LMoP',
    LPZAE = 'LPZAE',
    LR = 'LR',
    LSM = 'LSM',
    MM = 'MM',
    MOT = 'MOT',
    MTF = 'MTF',
    ODL = 'ODL',
    OTA = 'OTA',
    PG = 'PG',
    PHB = 'PHB',
    PotA = 'PotA',
    RoT = 'RoT',
    SAC = 'SAC',
    SCAG = 'SCAG',
    SCC = 'SCC',
    ScDun = 'ScDun',
    SDW = 'SDW',
    SKT = 'SKT',
    TCE = 'TCE',
    TftYP = 'TftYP',
    TOA = 'TOA',
    ttP = 'ttP',
    UA = 'UA',
    VGM = 'VGM',
    VH = 'VH',
    VRGR = 'VRGR',
    WBtW = 'WBtW',
    WDH = 'WDH',
    WDMM = 'WDMM',
    WOW = 'WOW',
    WSG = 'WSG',
    XGE = 'XGE',
}

export enum EDamageInflict {
    Acid = 'acid',
    Bludgeoning = 'bludgeoning',
    Cold = 'cold',
    Fair = 'fair',
    Force = 'force',
    Lightning = 'lightning',
    Nectotic = 'nectotic',
    Piercing = 'piercing',
    Poison = 'poison',
    Psychic = 'psychic',
    Radiant = 'radiant',
    Slashing = 'slashing',
    Sound = 'sound',
}

export enum EDurationOption {
    Days = 'days',
    Hours = 'hours',
    Minutes = 'minutes',
    Rounds = 'rounds',
    Years = 'years',
}

export enum EDuration {
    Instant = 'instant',
    Permanent = 'permanent',
    Timed = 'timed',
}

export enum EDistance {
    Feet = 'feet',
    Miles = 'miles',
    Self = 'self',
    Sight = 'sight',
    Touch = 'touch',
    Unlimited = 'unlimited',
}

export enum ERange {
    Cone = 'cone',
    Cube = 'cube',
    Line = 'line',
    Point = 'point',
    Radius = 'radius',
    Special = 'special',
}

export enum ESchool {
    Abjuration = 'abjuration',
    Conjuration = 'conjuration',
    Divination = 'divination',
    Enchantment = 'enchantment',
    Evocation = 'evocation',
    Illusion = 'illusion',
    Necromancy = 'necromancy',
    Transmutation = 'transmutation',
}

export enum ETime {
    Action = 'action',
    Bonus = 'bonus',
    Hour = 'hour',
    Minute = 'minute',
    Reaction = 'reaction',
    Round = 'round',
}

declare namespace NSpell {
    interface ITime {
        number: number
        unit: ETime
        condition?: string
    }

    interface IDistance {
        type: EDistance
        amount?: number
    }

    interface IRange {
        raw: string
        type: ERange
        distance?: IDistance
    }

    interface IDurationOptions {
        amount: number
        type?: EDurationOption
        upTo?: boolean
    }

    interface IDuration {
        raw: string
        type?: EDuration
        duration?: IDurationOptions
        concentration?: boolean
        ends?: string[]
    }

    interface IComponents {
        v?: boolean
        s?: boolean
        m?: string
    }

    interface IClassItem {
        name: EClass
        source: ESource
    }

    interface IClass {
        fromClassList: IClassItem[];
        fromClassListVariant?: IClassItem[];
        fromSubclass?: IClassItem[];
    }

    interface IEntriesHigherLevel {
        type: string;
        name: string;
        entries: string[];
    }

    interface ISpell {
        id?: string
        name: string
        englishName: string
        altName: string
        level: number
        school: ESchool
        range: IRange
        components: IComponents
        duration: IDuration[]
        classes: IClass
        source: ESource
        entries: string[]
        entriesHigherLevel?: IEntriesHigherLevel
        time: ITime[]
        page: number
        damageInflict?: EDamageInflict[]
        savingThrow: string[]
        meta?: {
            ritual?: boolean
        }
    }

    interface ISearch {
        value: string
        exact?: boolean
    }

    interface IRequest {
        page?: number
        limit?: number
        search: ISearch
        order?: {
            field: string
            direction: 'asc' | 'desc'
        }[]
        filter?: {
            book?: string[]
            level?: number[]
            class?: string[]
            school?: string[]
            component?: string[]
            damage?: string[]
            ritual?: boolean
            concentration?: boolean
        }
    }
}

export default NSpell
